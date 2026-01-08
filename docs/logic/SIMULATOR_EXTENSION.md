# 시뮬레이터 확장 설계

> C: 여러 함수, static, 구조체, 함수 포인터
> Python: Object Reference 시각화

---

## 1. 현재 구조 분석

### 1.1 현재 시뮬레이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│  simulateCode(code, stdin)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 코드를 줄 단위로 분리                                    │
│  2. "int main" 찾을 때까지 스킵                              │
│  3. main 안에서만 라인별 처리                                │
│  4. 각 라인 → registry.findHandler(code) → handler.handle() │
│  5. Step[] 반환                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 현재 핸들러 목록

| 핸들러 | 우선순위 | 처리 패턴 |
|--------|----------|----------|
| MallocHandler | 30 | `malloc()`, `free()` |
| PointerHandler | 25 | `int *p = &a`, `*p = 10` |
| ArrayHandler | 20 | `int arr[3]`, `arr[0] = 1` |
| IOHandler | 15 | `printf()`, `scanf()` |
| IntHandler | 10 | `int x = 5`, `x = 10` |

### 1.3 현재 한계

```c
// ❌ 지원 안 됨
int g_count = 0;              // 전역변수
static int s_count = 0;       // static

void helper() { }             // 다른 함수 정의
int result = helper();        // 함수 호출

struct Point { int x, y; };   // 구조체
Point p = {1, 2};

void (*fp)() = helper;        // 함수 포인터
```

---

## 2. 확장 목표

| 기능 | 설명 | 난이도 |
|------|------|--------|
| **전역변수** | main 바깥 변수, Data 세그먼트 | 🟡 |
| **static 변수** | 함수 내 static, Data 세그먼트 | 🟡 |
| **여러 함수 정의** | main 외 함수 파싱 | 🔴 |
| **함수 호출** | 콜스택, 인자 전달, 리턴 | 🔴 |
| **구조체 정의** | struct 파싱, 필드 오프셋 | 🔴 |
| **구조체 변수** | 멤버 접근, 포인터 | 🔴 |
| **함수 포인터** | Code 세그먼트 주소 | 🟡 |

---

## 3. 아키텍처 변경

### 3.1 새로운 시뮬레이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│  simulateCode(code, stdin)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Phase 1: 파싱 (새로 추가)                                   │
│  ─────────────────────────                                   │
│  1. 전처리 (#include 제거)                                   │
│  2. 구조체 정의 파싱 → structDefs[]                         │
│  3. 함수 정의 파싱 → functionDefs[]                         │
│  4. 전역변수 파싱 → globals[]                               │
│  5. 문자열 리터럴 수집 → literals[]                         │
│                                                              │
│  Phase 2: 실행                                               │
│  ─────────────────────────                                   │
│  1. main() 찾아서 시작                                       │
│  2. 라인별 핸들러 실행                                       │
│  3. 함수 호출 시 → 콜스택 push → 해당 함수로 이동           │
│  4. return 시 → 콜스택 pop → 호출 지점으로 복귀             │
│                                                              │
│  Phase 3: 결과                                               │
│  ─────────────────────────                                   │
│  1. static_info 생성                                        │
│  2. steps[] + static_info 반환                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 새로운 SimContext

```typescript
interface SimContext {
  // === 기존 ===
  stackBase: number;
  heapBase: number;
  stackOffset: number;
  heapOffset: number;
  variables: Map<string, Variable>;
  heapBlocks: Map<string, HeapBlock>;
  stdinBuffer: string[];
  stdinIndex: number;

  // === 새로 추가 ===

  // Data 세그먼트
  dataBase: number;              // 0x00601000
  dataOffset: number;
  globals: Map<string, Variable>;      // 전역변수
  statics: Map<string, Variable>;      // static 변수
  literals: Map<string, LiteralInfo>;  // 문자열 리터럴

  // Code 세그먼트
  codeBase: number;              // 0x00401000
  functions: Map<string, FunctionDef>; // 함수 정의

  // 구조체 정의
  structDefs: Map<string, StructDef>;

  // 콜스택
  callStack: CallFrame[];
  currentFunction: string;       // 현재 실행 중인 함수

  // 실행 위치
  instructionPointer: number;    // 현재 실행 줄
}
```

### 3.3 새로운 타입 정의

```typescript
// 함수 정의
interface FunctionDef {
  name: string;
  returnType: string;
  params: ParamDef[];
  startLine: number;      // 함수 시작 줄
  endLine: number;        // 함수 끝 줄
  address: string;        // Code 세그먼트 주소
  body: string[];         // 함수 본문 (줄 배열)
}

interface ParamDef {
  name: string;
  type: string;
}

// 콜스택 프레임
interface CallFrame {
  functionName: string;
  returnAddress: number;  // 복귀할 줄 번호
  returnTo: string;       // 복귀할 함수
  savedRbp: string;       // 이전 rbp
  localVars: string[];    // 이 프레임의 지역변수들
}

// 구조체 정의
interface StructDef {
  name: string;
  size: number;
  fields: FieldDef[];
}

interface FieldDef {
  name: string;
  type: string;
  offset: number;
  size: number;
}

// 문자열 리터럴
interface LiteralInfo {
  id: string;
  address: string;
  value: string;
  size: number;
}
```

---

## 4. 기능별 상세 설계

### 4.1 전역변수

#### 파싱

```c
// 입력
int g_count = 0;
char g_name[10];

// 파싱 결과
globals: [
  { name: "g_count", type: "int", address: "0x00601000", value: "0" },
  { name: "g_name", type: "char[10]", address: "0x00601004", value: "" }
]
```

#### 구현

```typescript
// simulator.ts - Phase 1에서 전역변수 감지

function parseGlobals(lines: string[]): GlobalInfo[] {
  const globals: GlobalInfo[] = [];
  let inFunction = false;

  for (const line of lines) {
    // 함수 시작 감지
    if (/^\w+\s+\w+\s*\(/.test(line) && line.includes('{')) {
      inFunction = true;
    }
    if (line.includes('}') && !line.includes('{')) {
      inFunction = false;
    }

    // 함수 바깥에서 변수 선언 감지
    if (!inFunction) {
      const match = line.match(/^(int|char|float|double)\s+(\w+)(?:\[(\d+)\])?\s*(?:=\s*(.+))?;/);
      if (match) {
        globals.push({
          type: match[1] + (match[3] ? `[${match[3]}]` : ''),
          name: match[2],
          initialValue: match[4] || null,
        });
      }
    }
  }

  return globals;
}
```

#### 핸들러

```typescript
// handlers/global.handler.ts

export const GlobalHandler: CodeHandler = {
  name: 'global',
  priority: 5,  // 낮은 우선순위 (다른 핸들러가 못 잡으면)

  canHandle(code: string): boolean {
    // 전역변수 접근 패턴
    // g_count = 10;
    // int x = g_count;
    return ctx.globals.has(extractVarName(code));
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // 전역변수 값 변경
    // ...
  }
};
```

---

### 4.2 static 변수

#### 파싱

```c
void counter() {
  static int count = 0;  // 함수 내 static
  count++;
}
```

#### 특징

- Data 세그먼트에 저장 (Stack 아님)
- 초기화는 한 번만
- 함수 호출 간 값 유지

#### 구현

```typescript
// handlers/static.handler.ts

const PATTERN = /^static\s+(int|char)\s+(\w+)\s*(?:=\s*(.+))?$/;

export const StaticHandler: CodeHandler = {
  name: 'static',
  priority: 35,  // 높은 우선순위

  canHandle(code: string): boolean {
    return PATTERN.test(code);
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    const match = code.match(PATTERN);
    const [, type, name, initValue] = match;

    // 이미 초기화됐으면 스킵
    const key = `${ctx.currentFunction}_${name}`;
    if (ctx.statics.has(key)) {
      return ctx.createStep(lineNum, code,
        `static 변수 '${name}'은 이미 초기화됨 (값 유지)`);
    }

    // Data 세그먼트에 할당
    const addr = ctx.allocateData(4);
    ctx.statics.set(key, {
      address: ctx.toHex(addr),
      type,
      value: initValue || '0',
      // ...
    });

    return ctx.createStep(lineNum, code,
      `static 변수 '${name}' 초기화 (Data 세그먼트)`);
  }
};
```

---

### 4.3 여러 함수 정의

#### 파싱

```c
// 입력
int add(int a, int b) {
  return a + b;
}

int main() {
  int result = add(1, 2);
}
```

#### 파싱 결과

```typescript
functions: Map {
  "add" => {
    name: "add",
    returnType: "int",
    params: [
      { name: "a", type: "int" },
      { name: "b", type: "int" }
    ],
    startLine: 1,
    endLine: 3,
    address: "0x00401000",
    body: ["return a + b"]
  },
  "main" => {
    name: "main",
    returnType: "int",
    params: [],
    startLine: 5,
    endLine: 7,
    address: "0x00401050",
    body: ["int result = add(1, 2)"]
  }
}
```

#### 구현

```typescript
// simulator.ts

function parseFunctions(lines: string[]): Map<string, FunctionDef> {
  const functions = new Map<string, FunctionDef>();
  let currentFunc: FunctionDef | null = null;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 함수 정의 시작 감지
    // int add(int a, int b) {
    const funcMatch = line.match(
      /^(int|void|char|float)\s+(\w+)\s*\(([^)]*)\)\s*\{?$/
    );

    if (funcMatch && !currentFunc) {
      const [, returnType, name, paramsStr] = funcMatch;
      currentFunc = {
        name,
        returnType,
        params: parseParams(paramsStr),
        startLine: i,
        endLine: -1,
        address: ctx.toHex(ctx.codeBase + functions.size * 0x50),
        body: [],
      };
      braceCount = line.includes('{') ? 1 : 0;
      continue;
    }

    if (currentFunc) {
      // 중괄호 카운팅
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;

      if (braceCount === 0) {
        currentFunc.endLine = i;
        functions.set(currentFunc.name, currentFunc);
        currentFunc = null;
      } else {
        currentFunc.body.push(line);
      }
    }
  }

  return functions;
}
```

---

### 4.4 함수 호출

#### 호출 과정

```
┌─────────────────────────────────────────────────────────────┐
│  int result = add(1, 2);                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 인자 평가: 1, 2                                         │
│  2. 콜스택 push:                                            │
│     - returnAddress: 현재 줄 + 1                            │
│     - returnTo: "main"                                      │
│     - savedRbp: 현재 rbp                                    │
│  3. 새 스택 프레임 생성                                     │
│     - 인자를 지역변수로 할당 (a=1, b=2)                     │
│  4. currentFunction = "add"                                 │
│  5. add 함수 본문 실행                                      │
│                                                              │
│  return a + b;                                               │
│  ──────────────                                              │
│  6. 리턴값 계산: 3                                          │
│  7. 콜스택 pop                                              │
│  8. 지역변수 정리                                           │
│  9. currentFunction = "main"                                │
│  10. result = 3                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 핸들러

```typescript
// handlers/call.handler.ts

const FUNC_CALL = /^(?:(int|char)\s+)?(\w+)\s*=\s*(\w+)\s*\(([^)]*)\)$/;

export const CallHandler: CodeHandler = {
  name: 'call',
  priority: 40,  // 높은 우선순위

  canHandle(code: string): boolean {
    const match = code.match(FUNC_CALL);
    if (!match) return false;
    const funcName = match[3];
    // 내장 함수가 아니고, 정의된 함수인 경우
    return !['printf', 'scanf', 'malloc', 'free'].includes(funcName)
           && ctx.functions.has(funcName);
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    const match = code.match(FUNC_CALL);
    const [, varType, varName, funcName, argsStr] = match;

    // 1. 인자 파싱
    const args = parseArgs(argsStr);
    const funcDef = ctx.functions.get(funcName);

    // 2. 콜스택 push
    ctx.callStack.push({
      functionName: ctx.currentFunction,
      returnAddress: lineNum + 1,
      returnTo: ctx.currentFunction,
      savedRbp: ctx.rbp,
      localVars: [...ctx.variables.keys()], // 현재 지역변수들
    });

    // 3. 새 스택 프레임
    ctx.rbp = ctx.rsp;

    // 4. 인자를 지역변수로 할당
    for (let i = 0; i < funcDef.params.length; i++) {
      const param = funcDef.params[i];
      const argValue = evaluateArg(ctx, args[i]);
      ctx.variables.set(param.name, {
        address: ctx.toHex(ctx.allocateStack(4)),
        type: param.type,
        value: argValue,
        // ...
      });
    }

    // 5. 함수 전환
    ctx.currentFunction = funcName;
    ctx.pendingReturn = { varType, varName }; // 리턴값 받을 변수

    return ctx.createStep(lineNum, code,
      `함수 '${funcName}' 호출 (인자: ${args.join(', ')})`);
  }
};
```

#### return 핸들러

```typescript
// handlers/return.handler.ts

export const ReturnHandler: CodeHandler = {
  name: 'return',
  priority: 45,

  canHandle(code: string): boolean {
    return code.startsWith('return');
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    const match = code.match(/^return\s+(.+)$/);
    const returnValue = match ? evaluateExpr(ctx, match[1]) : null;

    // 콜스택이 비어있으면 main 종료
    if (ctx.callStack.length === 0) {
      return ctx.createStep(lineNum, code, '프로그램 종료');
    }

    // 콜스택 pop
    const frame = ctx.callStack.pop();

    // 지역변수 정리 (이 함수에서 만든 것들)
    for (const [name] of ctx.variables) {
      if (!frame.localVars.includes(name)) {
        ctx.variables.delete(name);
      }
    }

    // 복귀
    ctx.currentFunction = frame.returnTo;
    ctx.rbp = frame.savedRbp;

    // 리턴값 할당
    if (ctx.pendingReturn && returnValue !== null) {
      const { varType, varName } = ctx.pendingReturn;
      ctx.variables.set(varName, {
        address: ctx.toHex(ctx.allocateStack(4)),
        type: varType || 'int',
        value: returnValue,
        // ...
      });
      ctx.pendingReturn = null;
    }

    return ctx.createStep(lineNum, code,
      `함수 종료, 리턴값: ${returnValue}`);
  }
};
```

---

### 4.5 구조체

#### 파싱

```c
struct Point {
  int x;
  int y;
};

struct Point p = {10, 20};
p.x = 30;
```

#### 구조체 정의 파싱

```typescript
function parseStructs(lines: string[]): Map<string, StructDef> {
  const structs = new Map<string, StructDef>();
  let currentStruct: StructDef | null = null;
  let offset = 0;

  for (const line of lines) {
    // struct Point {
    const structStart = line.match(/^struct\s+(\w+)\s*\{/);
    if (structStart) {
      currentStruct = {
        name: structStart[1],
        size: 0,
        fields: [],
      };
      offset = 0;
      continue;
    }

    if (currentStruct) {
      // int x;
      const fieldMatch = line.match(/^\s*(int|char|float)\s+(\w+);/);
      if (fieldMatch) {
        const [, type, name] = fieldMatch;
        const size = getTypeSize(type);
        currentStruct.fields.push({
          name,
          type,
          offset,
          size,
        });
        offset += size;
      }

      // };
      if (line.includes('};')) {
        currentStruct.size = offset;
        structs.set(currentStruct.name, currentStruct);
        currentStruct = null;
      }
    }
  }

  return structs;
}
```

#### 구조체 핸들러

```typescript
// handlers/struct.handler.ts

export const StructHandler: CodeHandler = {
  name: 'struct',
  priority: 35,

  canHandle(code: string): boolean {
    // struct Point p;
    // struct Point p = {1, 2};
    // p.x = 10;
    return /^struct\s+\w+\s+\w+/.test(code) ||
           /^\w+\.\w+\s*=/.test(code);
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // 구조체 변수 선언
    const declMatch = code.match(
      /^struct\s+(\w+)\s+(\w+)(?:\s*=\s*\{([^}]+)\})?$/
    );
    if (declMatch) {
      const [, structType, varName, initValues] = declMatch;
      const structDef = ctx.structDefs.get(structType);

      // 전체 크기만큼 스택 할당
      const baseAddr = ctx.allocateStack(structDef.size);

      // 각 필드 초기화
      const values = initValues?.split(',').map(v => v.trim()) || [];
      for (let i = 0; i < structDef.fields.length; i++) {
        const field = structDef.fields[i];
        const value = values[i] || '0';

        ctx.variables.set(`${varName}.${field.name}`, {
          address: ctx.toHex(baseAddr + field.offset),
          type: field.type,
          value,
          // ...
        });
      }

      return ctx.createStep(lineNum, code,
        `구조체 '${varName}' 생성 (${structDef.size}바이트)`);
    }

    // 필드 접근
    const accessMatch = code.match(/^(\w+)\.(\w+)\s*=\s*(.+)$/);
    if (accessMatch) {
      const [, varName, fieldName, value] = accessMatch;
      const fullName = `${varName}.${fieldName}`;
      const v = ctx.variables.get(fullName);

      if (v) {
        v.value = evaluateExpr(ctx, value);
        return ctx.createStep(lineNum, code,
          `${fullName} = ${v.value}`);
      }
    }

    return null;
  }
};
```

---

### 4.6 함수 포인터

#### 예시

```c
void greet() {
  printf("Hello");
}

int main() {
  void (*fp)() = greet;  // 함수 포인터
  fp();                   // 함수 포인터로 호출
}
```

#### 핸들러

```typescript
// handlers/funcptr.handler.ts

export const FuncPtrHandler: CodeHandler = {
  name: 'funcptr',
  priority: 38,

  canHandle(code: string): boolean {
    // void (*fp)() = greet;
    // fp();
    return /\(\*\w+\)\s*\(/.test(code) ||
           /^\w+\s*\(\)$/.test(code);
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // 함수 포인터 선언
    const declMatch = code.match(
      /^(\w+)\s*\(\*(\w+)\)\s*\([^)]*\)\s*=\s*(\w+)$/
    );
    if (declMatch) {
      const [, returnType, ptrName, funcName] = declMatch;
      const funcDef = ctx.functions.get(funcName);

      // Code 세그먼트 주소 저장
      ctx.variables.set(ptrName, {
        address: ctx.toHex(ctx.allocateStack(8)), // 포인터는 8바이트
        type: `${returnType}(*)()`,
        value: funcDef.address,
        points_to: funcDef.address,
      });

      return ctx.createStep(lineNum, code,
        `함수 포인터 '${ptrName}' = ${funcName} (${funcDef.address})`);
    }

    // 함수 포인터로 호출
    const callMatch = code.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (callMatch) {
      const [, ptrName, args] = callMatch;
      const v = ctx.variables.get(ptrName);

      if (v && v.points_to) {
        // 해당 주소의 함수 찾기
        const funcDef = [...ctx.functions.values()]
          .find(f => f.address === v.points_to);

        if (funcDef) {
          // CallHandler와 동일한 로직 수행
          // ...
        }
      }
    }

    return null;
  }
};
```

---

## 5. 메모리 레이아웃

### 5.1 주소 범위

```
┌─────────────────────────────────────────────────────────────┐
│  0xFFFFFFFF  ┌─────────────────────────────┐               │
│              │        STACK                │ ← 높은 주소    │
│              │     (지역변수, 인자)         │   ↓ grows down │
│  0x7FFFFFFF  ├─────────────────────────────┤               │
│              │                              │               │
│              │         (빈 공간)            │               │
│              │                              │               │
│              ├─────────────────────────────┤               │
│              │        HEAP                 │ ← ↑ grows up  │
│  0x00602000  │     (malloc)                │               │
│              ├─────────────────────────────┤               │
│              │        DATA                 │               │
│  0x00601000  │  (전역변수, static, 리터럴)  │               │
│              ├─────────────────────────────┤               │
│              │        CODE                 │               │
│  0x00401000  │      (함수 코드)             │               │
│              └─────────────────────────────┘               │
│  0x00000000                                  ← 낮은 주소    │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 SimContext 주소 설정

```typescript
class CSimulator implements SimContext {
  // Code 세그먼트 (함수)
  codeBase = 0x00401000;

  // Data 세그먼트 (전역, static, 리터럴)
  dataBase = 0x00601000;
  dataOffset = 0;

  // Heap 세그먼트
  heapBase = 0x00602000;
  heapOffset = 0;

  // Stack 세그먼트
  stackBase = 0x7fffffffde00;
  stackOffset = 0;

  allocateData(size: number): number {
    const addr = this.dataBase + this.dataOffset;
    this.dataOffset += size;
    return addr;
  }
}
```

---

## 6. 구현 순서

### Phase 2-A: 기반 (1주)

| # | 작업 | 설명 |
|---|------|------|
| 1 | 타입 정의 | `FunctionDef`, `StructDef`, `CallFrame` 등 |
| 2 | SimContext 확장 | `dataBase`, `functions`, `structDefs`, `callStack` |
| 3 | 파싱 함수 | `parseGlobals`, `parseFunctions`, `parseStructs` |

### Phase 2-B: 전역/static (1주)

| # | 작업 | 설명 |
|---|------|------|
| 4 | GlobalHandler | 전역변수 접근 |
| 5 | StaticHandler | static 변수 |
| 6 | LiteralHandler | 문자열 리터럴 |

### Phase 2-C: 함수 (2주)

| # | 작업 | 설명 |
|---|------|------|
| 7 | 실행 루프 변경 | main만 → 현재 함수 기준 |
| 8 | CallHandler | 함수 호출 |
| 9 | ReturnHandler | 함수 복귀 |
| 10 | 콜스택 관리 | push/pop, 지역변수 정리 |

### Phase 2-D: 구조체 (1주)

| # | 작업 | 설명 |
|---|------|------|
| 11 | StructHandler | 구조체 선언/접근 |
| 12 | 필드 오프셋 | 멤버 접근 주소 계산 |

### Phase 2-E: 함수 포인터 (옵션)

| # | 작업 | 설명 |
|---|------|------|
| 13 | FuncPtrHandler | 함수 포인터 선언/호출 |

---

## 7. 테스트 케이스

### 7.1 전역변수

```c
int g_count = 0;

int main() {
  g_count = 10;
  int local = g_count + 5;
  return 0;
}
```

### 7.2 static

```c
void counter() {
  static int count = 0;
  count++;
  printf("%d\n", count);
}

int main() {
  counter();  // 1
  counter();  // 2
  counter();  // 3
  return 0;
}
```

### 7.3 함수 호출

```c
int add(int a, int b) {
  return a + b;
}

int main() {
  int x = add(3, 4);
  int y = add(x, 2);
  return 0;
}
```

### 7.4 구조체

```c
struct Point {
  int x;
  int y;
};

int main() {
  struct Point p = {10, 20};
  p.x = 30;
  int sum = p.x + p.y;
  return 0;
}
```

### 7.5 함수 포인터

```c
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }

int main() {
  int (*op)(int, int) = add;
  int result = op(5, 3);  // 8
  op = sub;
  result = op(5, 3);      // 2
  return 0;
}
```

---

# Part 2: Python Object Reference 시각화

---

## 8. Python 시각화 개요

### 8.1 C vs Python 차이

| 관점 | C | Python |
|------|---|--------|
| 변수 | 메모리 공간 (값 저장) | 이름표 (객체 참조) |
| 할당 | 값 복사 | 참조 공유 |
| 메모리 | Stack/Heap 직접 관리 | 자동 관리 (GC) |
| 시각화 | 메모리 블록 + 주소 | Names → Objects 화살표 |

### 8.2 핵심 개념

```
┌──────────────────────────────────────────────────────────────┐
│  "변수는 객체에 붙은 이름표다"                                │
│                                                              │
│  a = 10        # "a"라는 이름표를 int 객체 10에 붙임          │
│  b = a         # "b"라는 이름표도 같은 객체에 붙임            │
│  a = 20        # "a"를 떼서 새 객체 20에 붙임 (b는 그대로)    │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. 시각화 구조

### 9.1 화면 레이아웃

```
┌─────────────────────────────────────────────────────────────┐
│  Names (이름 공간)           Objects (객체 공간)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────┐                    ┌──────────────────┐           │
│   │  a  │ ─────────────────→ │ int             │           │
│   └─────┘                    │ value: 10       │           │
│                              │ id: 0x7f8a...   │           │
│   ┌─────┐                    └──────────────────┘           │
│   │  b  │ ──────────────────────────┘ (같은 객체)           │
│   └─────┘                                                   │
│                                                             │
│   ┌─────┐                    ┌──────────────────┐           │
│   │ lst │ ─────────────────→ │ list            │           │
│   └─────┘                    │ [0] ──→ int: 1  │           │
│                              │ [1] ──→ int: 2  │           │
│                              │ id: 0x7f8b...   │           │
│                              └──────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 객체 표현

```typescript
interface PyObject {
  id: string;           // 고유 ID (메모리 주소 대용)
  type: PyType;         // 타입
  value: PyValue;       // 값
  mutable: boolean;     // 가변성
}

type PyType =
  | 'int' | 'float' | 'str' | 'bool' | 'NoneType'  // 기본
  | 'list' | 'tuple'                                 // 시퀀스
  | 'dict' | 'set'                                   // 컬렉션
  | 'function' | 'class' | 'instance';               // Phase 2

type PyValue =
  | number | string | boolean | null                 // 기본값
  | PyObject[]                                       // list, tuple
  | Map<string, PyObject>                            // dict
  | Set<PyObject>;                                   // set
```

### 9.3 이름 표현

```typescript
interface PyName {
  name: string;         // 변수명
  scope: 'local' | 'global';
  pointsTo: string;     // PyObject.id
}
```

---

## 10. 지원 범위

### 10.1 Phase 1 (MVP)

| # | 기능 | 예시 | 시각화 |
|---|------|------|--------|
| 1 | 기본 타입 | `a = 10` | Name → int 객체 |
| 2 | 문자열 | `s = "hello"` | Name → str 객체 |
| 3 | bool/None | `b = True` | Name → bool 객체 |
| 4 | 참조 공유 | `b = a` | 두 Name → 같은 객체 |
| 5 | 재할당 | `a = 20` | 화살표 이동 애니메이션 |
| 6 | list | `[1, 2, 3]` | 내부 요소도 참조로 표시 |
| 7 | tuple | `(1, 2)` | immutable 표시 (🔒) |
| 8 | dict | `{"a": 1}` | key-value 쌍 |
| 9 | set | `{1, 2, 3}` | 순서 없음 표시 |
| 10 | 리스트 수정 | `lst[0] = 10` | 내부 참조 변경 |
| 11 | 중첩 | `[[1], [2]]` | 리스트 → 리스트 참조 |

### 10.2 Phase 2

| # | 기능 | 예시 | 시각화 |
|---|------|------|--------|
| 12 | 함수 정의 | `def foo():` | function 객체 |
| 13 | 함수 호출 | `foo()` | Call Frame 표시 |
| 14 | 클래스 정의 | `class Point:` | class 객체 |
| 15 | 인스턴스 | `p = Point()` | instance 객체 + 속성 |
| 16 | self 참조 | `self.x = 10` | instance 내부 화살표 |

### 10.3 제외

- ~~클로저~~
- ~~GC/refcount 상세~~

---

## 11. 핸들러 설계

### 11.1 SimContext (Python)

```typescript
interface PySimContext {
  // 이름 공간
  globalNames: Map<string, PyName>;
  localNames: Map<string, PyName>;    // 현재 스코프

  // 객체 공간
  objects: Map<string, PyObject>;
  nextId: number;

  // 실행 상태
  currentLine: number;
  callStack: PyCallFrame[];           // Phase 2
}
```

### 11.2 핸들러 목록

| 핸들러 | 우선순위 | 패턴 |
|--------|----------|------|
| AssignHandler | 10 | `a = 10`, `a = b` |
| ListHandler | 20 | `[1, 2]`, `lst[0] = x` |
| TupleHandler | 20 | `(1, 2)` |
| DictHandler | 20 | `{"a": 1}`, `d["key"] = x` |
| SetHandler | 20 | `{1, 2}` |
| MethodHandler | 15 | `lst.append(x)` |
| FunctionHandler | 25 | `def foo():` (Phase 2) |
| ClassHandler | 25 | `class Foo:` (Phase 2) |

### 11.3 AssignHandler 예시

```typescript
// handlers/python/assign.handler.ts

const ASSIGN_PATTERN = /^(\w+)\s*=\s*(.+)$/;

export const AssignHandler: PyCodeHandler = {
  name: 'assign',
  priority: 10,

  canHandle(code: string): boolean {
    return ASSIGN_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(ASSIGN_PATTERN);
    const [, name, expr] = match;

    // 1. 표현식 평가 → 객체 생성 또는 기존 객체 참조
    const obj = evaluateExpr(ctx, expr);

    // 2. 이름 바인딩
    ctx.localNames.set(name, {
      name,
      scope: 'local',
      pointsTo: obj.id,
    });

    // 3. 스텝 생성
    return {
      line: lineNum,
      code,
      explanation: `'${name}'이 ${obj.type} 객체를 참조`,
      names: [...ctx.localNames.values()],
      objects: [...ctx.objects.values()],
      changes: [{ type: 'bind', name, objectId: obj.id }],
    };
  }
};
```

### 11.4 ListHandler 예시

```typescript
// handlers/python/list.handler.ts

export const ListHandler: PyCodeHandler = {
  name: 'list',
  priority: 20,

  canHandle(code: string): boolean {
    // [1, 2, 3] 또는 lst[0] = x
    return /\[.*\]/.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    // 리스트 리터럴: [1, 2, 3]
    const literalMatch = code.match(/^\[([^\]]*)\]$/);
    if (literalMatch) {
      const elements = parseListElements(literalMatch[1]);

      // 각 요소를 객체로 생성
      const elementObjs = elements.map(el => evaluateExpr(ctx, el));

      // 리스트 객체 생성
      const listObj: PyObject = {
        id: ctx.generateId(),
        type: 'list',
        value: elementObjs,
        mutable: true,
      };
      ctx.objects.set(listObj.id, listObj);

      return { /* ... */ };
    }

    // 인덱스 접근: lst[0] = x
    const indexMatch = code.match(/^(\w+)\[(\d+)\]\s*=\s*(.+)$/);
    if (indexMatch) {
      const [, listName, index, expr] = indexMatch;
      const listObj = getObjectByName(ctx, listName);
      const newValue = evaluateExpr(ctx, expr);

      // 리스트 내부 참조 변경
      (listObj.value as PyObject[])[+index] = newValue;

      return { /* ... */ };
    }

    return null;
  }
};
```

---

## 12. 시각화 컴포넌트

### 12.1 폴더 구조

```
features/visualizers/
├── c/
│   ├── CMemoryView.tsx
│   ├── handlers/
│   └── constants.ts
├── python/
│   ├── PyReferenceView.tsx      # 메인 시각화
│   ├── components/
│   │   ├── NamesPanel.tsx       # 왼쪽: 이름 공간
│   │   ├── ObjectsPanel.tsx     # 오른쪽: 객체 공간
│   │   ├── ReferenceArrow.tsx   # 화살표
│   │   └── ObjectCard.tsx       # 개별 객체 카드
│   ├── handlers/
│   │   ├── assign.handler.ts
│   │   ├── list.handler.ts
│   │   ├── dict.handler.ts
│   │   └── index.ts
│   ├── types.ts
│   └── constants.ts
└── shared/
    └── Arrow.tsx                # 공통 화살표 컴포넌트
```

### 12.2 색상 체계

```typescript
// python/constants.ts

export const PY_COLORS = {
  // 타입별 색상
  int: { main: '#3B82F6', bg: '#EFF6FF' },      // 파랑
  float: { main: '#8B5CF6', bg: '#F5F3FF' },    // 보라
  str: { main: '#10B981', bg: '#ECFDF5' },      // 초록
  bool: { main: '#F59E0B', bg: '#FFFBEB' },     // 주황
  NoneType: { main: '#6B7280', bg: '#F9FAFB' }, // 회색

  list: { main: '#EC4899', bg: '#FDF2F8' },     // 핑크
  tuple: { main: '#14B8A6', bg: '#F0FDFA' },    // 청록 (🔒)
  dict: { main: '#F97316', bg: '#FFF7ED' },     // 오렌지
  set: { main: '#8B5CF6', bg: '#F5F3FF' },      // 보라

  // 상태 색상
  changed: '#FBBF24',    // 변경됨
  shared: '#EF4444',     // 공유 참조
};
```

---

## 13. 테스트 케이스

### 13.1 기본 참조

```python
a = 10
b = a        # 같은 객체
a = 20       # a만 새 객체로
```

**기대 결과**: b는 여전히 10

### 13.2 리스트 참조

```python
lst1 = [1, 2, 3]
lst2 = lst1       # 같은 리스트
lst1[0] = 100     # lst2도 변경됨
```

**기대 결과**: lst2[0]도 100

### 13.3 리스트 복사 vs 참조

```python
lst1 = [1, 2, 3]
lst2 = lst1[:]    # 복사 (새 리스트)
lst1[0] = 100
```

**기대 결과**: lst2[0]은 1 (영향 없음)

### 13.4 중첩 리스트

```python
inner = [1, 2]
outer = [inner, inner]  # 같은 inner 두 번 참조
inner[0] = 100
```

**기대 결과**: outer[0][0]과 outer[1][0] 모두 100

### 13.5 dict

```python
d = {"name": "Kim", "age": 20}
d["age"] = 21
```

### 13.6 tuple (immutable)

```python
t = (1, 2, 3)
# t[0] = 10  # Error! 시각화에서 🔒 표시
```

---

## 14. 구현 순서

### Phase 1-A: 기반 (1주)

| # | 작업 |
|---|------|
| 1 | Python 타입 정의 (`PyObject`, `PyName`, `PySimContext`) |
| 2 | 기본 핸들러 (`AssignHandler`) |
| 3 | `PyReferenceView` 컴포넌트 기본 구조 |

### Phase 1-B: 기본 타입 (1주)

| # | 작업 |
|---|------|
| 4 | int, float, str, bool, None 지원 |
| 5 | `NamesPanel`, `ObjectsPanel` 구현 |
| 6 | `ReferenceArrow` 구현 |

### Phase 1-C: 컬렉션 (1주)

| # | 작업 |
|---|------|
| 7 | `ListHandler`, `TupleHandler` |
| 8 | `DictHandler`, `SetHandler` |
| 9 | 중첩 참조 시각화 |

### Phase 2: 클래스/함수 (2주)

| # | 작업 |
|---|------|
| 10 | `FunctionHandler` |
| 11 | `ClassHandler` |
| 12 | Call Frame 시각화 |

---

# Part 3: 아키텍처 상세 설계

---

## 15. 전체 시스템 구조

### 15.1 고수준 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Playground Page                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────────┐    │
│  │ CodeEditor   │    │ LanguageTab  │    │ StepControls       │    │
│  │ (Monaco)     │    │ C|Python|Java│    │ ◀ ▶ Reset          │    │
│  └──────────────┘    └──────────────┘    └────────────────────┘    │
│         │                   │                      │                │
│         ▼                   ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SimulatorEngine                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │ C Simulator │  │ Py Simulator│  │Java Simulator│          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Visualizer (언어별)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │   │
│  │  │CMemoryView  │  │PyRefView    │  │JavaHeapView │          │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 15.2 데이터 플로우

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Code   │────▶│ Parser  │────▶│ Handler │────▶│  Steps  │
│ (string)│     │         │     │ Chain   │     │  []     │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                     │
                     ┌───────────────────────────────┘
                     ▼
              ┌─────────────┐     ┌─────────────┐
              │ currentStep │────▶│ Visualizer  │
              │ (state)     │     │ (render)    │
              └─────────────┘     └─────────────┘
```

---

## 16. 핵심 인터페이스 정의

### 16.1 공통 인터페이스

```typescript
// types/simulator.ts

/**
 * 시뮬레이터 공통 인터페이스
 * C, Python, Java 모두 이 인터페이스 구현
 */
interface Simulator<TContext, TStep> {
  // 초기화
  init(code: string): TContext;

  // 한 줄 실행
  step(ctx: TContext, lineNum: number): TStep | null;

  // 전체 실행 (모든 스텝 생성)
  simulate(code: string): TStep[];

  // 리셋
  reset(): TContext;
}

/**
 * 핸들러 공통 인터페이스
 */
interface CodeHandler<TContext, TStep> {
  name: string;
  priority: number;
  canHandle(code: string, ctx: TContext): boolean;
  handle(ctx: TContext, lineNum: number, code: string): TStep | null;
}

/**
 * 핸들러 레지스트리
 */
interface HandlerRegistry<TContext, TStep> {
  handlers: CodeHandler<TContext, TStep>[];
  register(handler: CodeHandler<TContext, TStep>): void;
  findHandler(code: string, ctx: TContext): CodeHandler<TContext, TStep> | null;
}
```

### 16.2 C 전용 타입

```typescript
// types/c-simulator.ts

interface CSimContext {
  // 메모리 세그먼트
  stack: CMemoryBlock[];
  heap: CMemoryBlock[];
  data: CMemoryBlock[];      // 전역, static
  code: CFunctionDef[];      // 함수 정의

  // 주소 관리
  stackPointer: number;
  heapPointer: number;
  dataPointer: number;

  // 변수 매핑
  variables: Map<string, CVariable>;

  // 콜스택 (Phase 2)
  callStack: CCallFrame[];
  currentFunction: string;

  // 구조체 정의 (Phase 2)
  structDefs: Map<string, CStructDef>;
}

interface CMemoryBlock {
  address: string;        // "0x7fff..."
  name: string;           // 변수명
  type: string;           // "int", "char*", etc.
  value: string;
  size: number;
  segment: 'stack' | 'heap' | 'data' | 'code';
  points_to?: string;     // 포인터인 경우
}

interface CStep {
  line: number;
  code: string;
  explanation: string;
  stack: CMemoryBlock[];
  heap: CMemoryBlock[];
  data: CMemoryBlock[];
  stdout?: string;
  changes: CChange[];
}

interface CChange {
  type: 'alloc' | 'free' | 'modify' | 'pointer';
  target: string;         // 변수명 또는 주소
  oldValue?: string;
  newValue?: string;
}
```

### 16.3 Python 전용 타입

```typescript
// types/py-simulator.ts

interface PySimContext {
  // 이름 공간
  names: Map<string, PyName>;

  // 객체 공간
  objects: Map<string, PyObject>;

  // ID 생성
  nextObjectId: number;

  // 콜스택 (Phase 2)
  callStack: PyCallFrame[];
  currentScope: 'global' | 'local';
}

interface PyName {
  name: string;
  scope: 'global' | 'local';
  pointsTo: string;       // PyObject.id
}

interface PyObject {
  id: string;             // "obj_1", "obj_2", ...
  type: PyType;
  value: PyValue;
  mutable: boolean;
  refCount?: number;      // 참조 시각화용 (실제 GC 아님)
}

type PyType =
  | 'int' | 'float' | 'str' | 'bool' | 'NoneType'
  | 'list' | 'tuple' | 'dict' | 'set'
  | 'function' | 'class' | 'instance';

type PyValue =
  | number | string | boolean | null
  | PyObjectRef[]                      // list, tuple
  | Map<string, PyObjectRef>           // dict
  | Set<string>;                       // set (object ids)

type PyObjectRef = string;             // PyObject.id

interface PyStep {
  line: number;
  code: string;
  explanation: string;
  names: PyName[];
  objects: PyObject[];
  changes: PyChange[];
}

interface PyChange {
  type: 'bind' | 'rebind' | 'modify' | 'create' | 'delete';
  name?: string;
  objectId: string;
  oldObjectId?: string;
}
```

---

## 17. 함수 호출 체인 (Execution Pipeline)

### 17.1 C 실행 파이프라인

```
┌────────────────────────────────────────────────────────────────────┐
│                     C Execution Pipeline                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐                                                      │
│  │ Raw Code │                                                      │
│  └────┬─────┘                                                      │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Phase 1: Parse                                                │ │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │ │
│  │ │preprocessor│→│parseStructs│→│parseFuncs  │→│parseGlobals│  │ │
│  │ │(#include제거)│ │(구조체정의) │ │(함수정의)  │ │(전역변수)   │  │ │
│  │ └────────────┘ └────────────┘ └────────────┘ └────────────┘  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Phase 2: Execute (line by line)                               │ │
│  │                                                                │ │
│  │   for each line in currentFunction:                           │ │
│  │     ┌─────────────┐                                           │ │
│  │     │ findHandler │ ← HandlerRegistry                         │ │
│  │     └──────┬──────┘                                           │ │
│  │            │                                                   │ │
│  │            ▼                                                   │ │
│  │     ┌─────────────────────────────────────────────────────┐   │ │
│  │     │ Handler Priority Chain                               │   │ │
│  │     │                                                      │   │ │
│  │     │  [45] ReturnHandler                                  │   │ │
│  │     │  [40] CallHandler        ← 함수 호출                 │   │ │
│  │     │  [38] FuncPtrHandler                                 │   │ │
│  │     │  [35] StaticHandler      ← static 변수               │   │ │
│  │     │  [35] StructHandler      ← 구조체                    │   │ │
│  │     │  [30] MallocHandler      ← malloc/free               │   │ │
│  │     │  [25] PointerHandler     ← 포인터 연산               │   │ │
│  │     │  [20] ArrayHandler       ← 배열                      │   │ │
│  │     │  [15] IOHandler          ← printf/scanf              │   │ │
│  │     │  [10] IntHandler         ← 기본 변수                 │   │ │
│  │     │  [5]  GlobalHandler      ← 전역변수 접근             │   │ │
│  │     │                                                      │   │ │
│  │     └─────────────────────────────────────────────────────┘   │ │
│  │            │                                                   │ │
│  │            ▼                                                   │ │
│  │     ┌─────────────┐                                           │ │
│  │     │ handler.    │ → CStep                                   │ │
│  │     │ handle()    │                                           │ │
│  │     └─────────────┘                                           │ │
│  │                                                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────┐                                                      │
│  │ Steps[]  │ → Visualizer                                         │
│  └──────────┘                                                      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 17.2 Python 실행 파이프라인

```
┌────────────────────────────────────────────────────────────────────┐
│                   Python Execution Pipeline                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────┐                                                      │
│  │ Raw Code │                                                      │
│  └────┬─────┘                                                      │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Phase 1: Parse (간단)                                         │ │
│  │ ┌────────────┐ ┌────────────┐                                 │ │
│  │ │ splitLines │→│ detectIndent│ (Phase 2: 함수/클래스)         │ │
│  │ └────────────┘ └────────────┘                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Phase 2: Execute (line by line)                               │ │
│  │                                                                │ │
│  │   for each line:                                              │ │
│  │     ┌─────────────┐                                           │ │
│  │     │ findHandler │                                           │ │
│  │     └──────┬──────┘                                           │ │
│  │            │                                                   │ │
│  │            ▼                                                   │ │
│  │     ┌─────────────────────────────────────────────────────┐   │ │
│  │     │ Handler Priority Chain                               │   │ │
│  │     │                                                      │   │ │
│  │     │  [30] ClassHandler       ← class 정의 (Phase 2)      │   │ │
│  │     │  [30] FunctionHandler    ← def 정의 (Phase 2)        │   │ │
│  │     │  [25] MethodHandler      ← .append(), .pop() 등      │   │ │
│  │     │  [20] DictHandler        ← {}, d["key"]              │   │ │
│  │     │  [20] SetHandler         ← {1, 2}                    │   │ │
│  │     │  [20] ListHandler        ← [], lst[0]                │   │ │
│  │     │  [20] TupleHandler       ← ()                        │   │ │
│  │     │  [10] AssignHandler      ← a = x (기본)              │   │ │
│  │     │                                                      │   │ │
│  │     └─────────────────────────────────────────────────────┘   │ │
│  │            │                                                   │ │
│  │            ▼                                                   │ │
│  │     ┌─────────────┐                                           │ │
│  │     │ handler.    │ → PyStep                                  │ │
│  │     │ handle()    │                                           │ │
│  │     └─────────────┘                                           │ │
│  │                                                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│       │                                                            │
│       ▼                                                            │
│  ┌──────────┐                                                      │
│  │ Steps[]  │ → Visualizer                                         │
│  └──────────┘                                                      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 18. 컴포넌트 상세 설계

### 18.1 C 메모리 시각화 컴포넌트

```
┌─────────────────────────────────────────────────────────────────────┐
│ CMemoryView                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ VariablesPanel (상단)                                        │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐                         │   │
│  │ │   x     │ │   p     │ │  arr    │  ← 변수 태그            │   │
│  │ │ 🔵Stack │ │ 🟠Ptr  │ │ 🔵Stack │                         │   │
│  │ └─────────┘ └─────────┘ └─────────┘                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│                          │ (hover 시 연결선)                        │
│                          ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ MemoryPanel (하단)                                           │   │
│  │                                                              │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐   │   │
│  │  │ Stack                   │  │ Heap                    │   │   │
│  │  │ ┌─────────────────────┐ │  │ ┌─────────────────────┐ │   │   │
│  │  │ │ 0x7fff0000 │   10   │ │  │ │ 0x5600000 │ [1,2,3] │ │   │   │
│  │  │ ├─────────────────────┤ │  │ └─────────────────────┘ │   │   │
│  │  │ │ 0x7fff0004 │ 0x5600 │─┼──┼──────────▶              │   │   │
│  │  │ └─────────────────────┘ │  │                         │   │   │
│  │  └─────────────────────────┘  └─────────────────────────┘   │   │
│  │                                                              │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────┐   │   │
│  │  │ Data (전역/static)      │  │ Code (함수)             │   │   │
│  │  │ (Phase 2)               │  │ (Phase 2)               │   │   │
│  │  └─────────────────────────┘  └─────────────────────────┘   │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 18.2 컴포넌트 트리 (C)

```typescript
// features/visualizers/c/

CMemoryView                    // 메인 컨테이너
├── VariablesPanel             // 변수 영역
│   └── VariableTag            // 개별 변수 태그
│       ├── name               // 변수명
│       ├── segment badge      // Stack/Heap/Data
│       └── pointer indicator  // 포인터 표시 (*)
│
├── MemoryPanel                // 메모리 영역
│   ├── SegmentSection         // 세그먼트 섹션
│   │   ├── SegmentHeader      // "Stack", "Heap" 등
│   │   └── MemoryBlockList    // 블록 목록
│   │       └── MemoryBlock    // 개별 블록
│   │           ├── address    // 주소
│   │           ├── value      // 값
│   │           └── size       // 크기
│   │
│   └── PointerArrow           // 포인터 화살표 (SVG)
│
└── ConnectionOverlay          // 변수-메모리 연결선 (SVG)
```

### 18.3 Python 참조 시각화 컴포넌트

```
┌─────────────────────────────────────────────────────────────────────┐
│ PyReferenceView                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────┐          ┌────────────────────────────┐    │
│  │ NamesPanel         │          │ ObjectsPanel               │    │
│  │                    │          │                            │    │
│  │  ┌──────────────┐  │          │  ┌──────────────────────┐  │    │
│  │  │     a        │──┼──────────┼─▶│ int                  │  │    │
│  │  │   (local)    │  │          │  │ value: 10            │  │    │
│  │  └──────────────┘  │          │  │ id: obj_1            │  │    │
│  │                    │          │  └──────────────────────┘  │    │
│  │  ┌──────────────┐  │          │           ▲                │    │
│  │  │     b        │──┼──────────┼───────────┘ (같은 객체)    │    │
│  │  │   (local)    │  │          │                            │    │
│  │  └──────────────┘  │          │  ┌──────────────────────┐  │    │
│  │                    │          │  │ list                 │  │    │
│  │  ┌──────────────┐  │          │  │ ┌────┬────┬────┐     │  │    │
│  │  │    lst       │──┼──────────┼─▶│ │ ●  │ ●  │ ●  │     │  │    │
│  │  │   (local)    │  │          │  │ └─┼──┴─┼──┴─┼──┘     │  │    │
│  │  └──────────────┘  │          │  │   │    │    │        │  │    │
│  │                    │          │  │   ▼    ▼    ▼        │  │    │
│  │                    │          │  │ int:1 int:2 int:3    │  │    │
│  │                    │          │  │ id:obj_2,3,4         │  │    │
│  │                    │          │  └──────────────────────┘  │    │
│  │                    │          │                            │    │
│  └────────────────────┘          └────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 18.4 컴포넌트 트리 (Python)

```typescript
// features/visualizers/python/

PyReferenceView                // 메인 컨테이너
├── NamesPanel                 // 이름 공간 (왼쪽)
│   └── NameTag                // 개별 이름 태그
│       ├── name               // 변수명
│       └── scope badge        // local/global
│
├── ObjectsPanel               // 객체 공간 (오른쪽)
│   └── ObjectCard             // 개별 객체 카드
│       ├── TypeBadge          // int, list, dict 등
│       ├── ValueDisplay       // 값 표시
│       │   ├── PrimitiveValue // 기본값 (숫자, 문자열)
│       │   ├── ListValue      // 리스트 내부 참조
│       │   ├── DictValue      // dict key-value
│       │   └── SetValue       // set 요소
│       ├── ObjectId           // id: obj_1
│       └── MutableBadge       // 🔒 (immutable) or ✏️ (mutable)
│
└── ReferenceArrows            // 참조 화살표 (SVG 오버레이)
    ├── NameToObjectArrow      // 이름 → 객체
    └── ObjectToObjectArrow    // 리스트/dict 내부 참조
```

---

## 19. 상태 관리 설계

### 19.1 Zustand Store 구조

```typescript
// stores/playgroundStore.ts

interface PlaygroundState {
  // 언어 선택
  language: 'c' | 'python' | 'java';
  setLanguage: (lang: 'c' | 'python' | 'java') => void;

  // 코드
  code: string;
  setCode: (code: string) => void;

  // 시뮬레이션 상태
  steps: Step[];              // CStep[] | PyStep[]
  currentStepIndex: number;
  isSimulating: boolean;
  error: string | null;

  // 액션
  simulate: () => void;       // 시뮬레이션 실행
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
}

// 언어별 서브스토어
interface CSimulatorState {
  context: CSimContext | null;
  // C 전용 상태
}

interface PySimulatorState {
  context: PySimContext | null;
  // Python 전용 상태
}
```

### 19.2 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Data Flow                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Action                                                        │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────┐                                                    │
│  │ CodeEditor  │ onChange                                           │
│  └──────┬──────┘                                                    │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────┐                                                    │
│  │ setCode()   │ ← Zustand action                                   │
│  └──────┬──────┘                                                    │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │ simulate()  │────▶│ Simulator   │────▶│ steps[]     │           │
│  │  (action)   │     │  .simulate()│     │  (state)    │           │
│  └─────────────┘     └─────────────┘     └──────┬──────┘           │
│                                                  │                  │
│         ┌────────────────────────────────────────┘                  │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │currentStep  │────▶│ Selector    │────▶│ Visualizer  │           │
│  │  Index      │     │             │     │  (render)   │           │
│  └─────────────┘     └─────────────┘     └─────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 20. 파일 구조 최종

```
features/
├── playground/
│   ├── PlaygroundPage.tsx         # 메인 페이지
│   ├── components/
│   │   ├── CodeEditor.tsx         # Monaco 에디터
│   │   ├── LanguageTabs.tsx       # C/Python/Java 탭
│   │   ├── StepControls.tsx       # ◀ ▶ 컨트롤
│   │   └── StepExplanation.tsx    # 현재 스텝 설명
│   ├── hooks/
│   │   └── usePlayground.ts       # 페이지 훅
│   └── stores/
│       └── playgroundStore.ts     # Zustand 스토어
│
├── visualizers/
│   ├── shared/
│   │   ├── Arrow.tsx              # 공통 화살표 SVG
│   │   ├── colors.ts              # 공통 색상
│   │   └── animations.ts          # Framer Motion 프리셋
│   │
│   ├── c/
│   │   ├── index.ts               # exports
│   │   ├── CMemoryView.tsx        # 메인 컴포넌트
│   │   ├── components/
│   │   │   ├── VariablesPanel.tsx
│   │   │   ├── MemoryPanel.tsx
│   │   │   ├── MemoryBlock.tsx
│   │   │   └── PointerArrow.tsx
│   │   ├── simulator/
│   │   │   ├── CSimulator.ts      # 시뮬레이터 클래스
│   │   │   ├── CContext.ts        # 컨텍스트
│   │   │   └── handlers/
│   │   │       ├── index.ts       # 레지스트리
│   │   │       ├── int.handler.ts
│   │   │       ├── pointer.handler.ts
│   │   │       ├── array.handler.ts
│   │   │       ├── malloc.handler.ts
│   │   │       ├── io.handler.ts
│   │   │       ├── global.handler.ts    # Phase 2
│   │   │       ├── static.handler.ts    # Phase 2
│   │   │       ├── call.handler.ts      # Phase 2
│   │   │       ├── return.handler.ts    # Phase 2
│   │   │       └── struct.handler.ts    # Phase 2
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   ├── python/
│   │   ├── index.ts               # exports
│   │   ├── PyReferenceView.tsx    # 메인 컴포넌트
│   │   ├── components/
│   │   │   ├── NamesPanel.tsx
│   │   │   ├── ObjectsPanel.tsx
│   │   │   ├── NameTag.tsx
│   │   │   ├── ObjectCard.tsx
│   │   │   └── ReferenceArrow.tsx
│   │   ├── simulator/
│   │   │   ├── PySimulator.ts     # 시뮬레이터 클래스
│   │   │   ├── PyContext.ts       # 컨텍스트
│   │   │   └── handlers/
│   │   │       ├── index.ts       # 레지스트리
│   │   │       ├── assign.handler.ts
│   │   │       ├── list.handler.ts
│   │   │       ├── tuple.handler.ts
│   │   │       ├── dict.handler.ts
│   │   │       ├── set.handler.ts
│   │   │       ├── method.handler.ts
│   │   │       ├── function.handler.ts  # Phase 2
│   │   │       └── class.handler.ts     # Phase 2
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   └── java/                      # Future
│       └── ...
│
└── types/
    ├── simulator.ts               # 공통 인터페이스
    ├── c-simulator.ts             # C 전용 타입
    └── py-simulator.ts            # Python 전용 타입
```

---

## 21. 구현 우선순위 (통합)

### 21.1 Phase 1: 기반 + C MVP (2주)

| 주차 | 작업 |
|------|------|
| 1주 | 공통 인터페이스, Zustand 스토어, PlaygroundPage 기본 |
| 2주 | C 시뮬레이터 (기존 핸들러), CMemoryView 컴포넌트 |

### 21.2 Phase 2: Python MVP (2주)

| 주차 | 작업 |
|------|------|
| 3주 | Python 시뮬레이터 기반, 기본 타입 핸들러 |
| 4주 | PyReferenceView, 컬렉션 핸들러 (list, dict, set) |

### 21.3 Phase 3: C 확장 (3주)

| 주차 | 작업 |
|------|------|
| 5주 | 전역변수, static, Data 세그먼트 |
| 6주 | 함수 정의, 함수 호출, 콜스택 |
| 7주 | 구조체, 함수 포인터 |

### 21.4 Phase 4: Python 확장 (2주)

| 주차 | 작업 |
|------|------|
| 8주 | 함수 정의/호출, Call Frame |
| 9주 | 클래스/인스턴스 |
