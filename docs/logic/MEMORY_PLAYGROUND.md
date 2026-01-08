# Memory Playground 설계

> 사용자가 자유롭게 C 코드를 입력하고 메모리 상태를 확인하는 페이지

---

## 1. 개요

```
┌─────────────────────────────────────────────────────────────┐
│  Memory Playground                              [C ▼]       │
│  코드를 직접 써보고 메모리 상태를 확인해보세요               │
├─────────────────────────────┬───────────────────────────────┤
│                             │                               │
│      CodeEditor             │     MemoryView                │
│      (Monaco, 편집 가능)    │     (기존 컴포넌트 재사용)    │
│                             │                               │
│   #include <stdio.h>        │   ┌─ 변수 영역 ──────────┐   │
│   int main() {              │   │  a  p*              │   │
│     int a = 10;             │   └────────────────────┘   │
│     int *p = &a;            │                               │
│   }                         │   ┌─ Stack ─────────────┐   │
│                             │   │  0x1000: 10         │   │
│                             │   │  0x1004: 0x1000 →   │   │
│                             │   └────────────────────┘   │
├─────────────────────────────┴───────────────────────────────┤
│  [▶ 실행]  [↺ 리셋]  │  [◀ Prev] Step 2/5 [Next ▶]        │
├─────────────────────────────────────────────────────────────┤
│  Output: stdout / stderr                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 페이지 비교

| 페이지 | 코드 컴포넌트 | 편집 | 용도 |
|--------|--------------|------|------|
| **LessonPage** | CodeViewer | ❌ 읽기 전용 | 학습용 |
| **PlaygroundPage** | CodeEditor (Monaco) | ✅ 편집 가능 | 자유 실습 |

---

## 3. 컴포넌트 구조 (옵션 C: CSS Grid + SVG 오버레이)

### 3.1 왜 이 구조인가?

| 대안 | 장점 | 단점 | 결론 |
|------|------|------|------|
| Canvas/SVG 전체 | 위치 계산 쉬움 | React 장점 포기, 접근성 X | ❌ |
| React Flow | 검증된 라이브러리 | +200KB, 러닝커브 | ❌ |
| **CSS Grid + SVG** | 구조 단순, React 그대로 | 화살표 위치 직접 계산 | ✅ |
| Leader Line | 화살표 쉬움 | DOM 직접 조작, 리렌더링 이슈 | ❌ |

### 3.2 폴더 구조

```
features/playground/
├── index.ts
├── PlaygroundPage.tsx              # 메인 페이지
│
├── components/
│   ├── CodeEditor.tsx              # Monaco Editor 래퍼
│   ├── PlaygroundControls.tsx      # 실행/리셋/스텝 버튼
│   ├── OutputPanel.tsx             # stdout/stderr
│   │
│   └── MemoryLayout/               # 🆕 메모리 시각화 (새 디자인)
│       ├── index.ts
│       ├── MemoryLayout.tsx        # 전체 레이아웃 (Grid 컨테이너)
│       ├── SymbolColumn.tsx        # 왼쪽: 심볼 목록 (변수명/함수명)
│       ├── MemoryColumn.tsx        # 오른쪽: 4개 세그먼트
│       ├── MemorySegment.tsx       # Stack/Heap/Data/Code 개별 블록
│       ├── MemoryCell.tsx          # 주소 + 값 셀
│       ├── SymbolTag.tsx           # 개별 심볼 태그
│       └── PointerOverlay.tsx      # SVG 화살표 레이어
│
├── hooks/
│   ├── usePlaygroundMemory.ts      # API 호출 + 스텝 상태
│   ├── useColorMapping.ts          # 심볼별 색상 할당
│   └── usePositionTracker.ts       # ref 위치 추적 (화살표용)
│
├── context/
│   └── MemoryLayoutContext.tsx     # 호버 상태, 위치 공유
│
└── types.ts
```

### 3.3 컴포넌트 계층 구조

```
PlaygroundPage
├── CodeEditor (Monaco)
├── PlaygroundControls (실행/스텝)
├── MemoryLayoutProvider (Context)
│   └── MemoryLayout (Grid)
│       ├── SymbolColumn
│       │   └── SymbolTag × N (변수명, 함수명)
│       ├── MemoryColumn
│       │   ├── MemorySegment (STACK)
│       │   │   └── MemoryCell × N
│       │   ├── MemorySegment (HEAP)
│       │   │   └── MemoryCell × N
│       │   ├── MemorySegment (DATA)
│       │   │   └── MemoryCell × N
│       │   └── MemorySegment (CODE)
│       │       └── MemoryCell × N
│       └── PointerOverlay (SVG 절대 위치)
│           └── <path> × N (화살표들)
└── OutputPanel (stdout/stderr)
```

### 3.4 레이아웃 그리드

```
┌─────────────────────────────────────────────────────────────────┐
│  PlaygroundPage                                                  │
├───────────────────────────┬─────────────────────────────────────┤
│                           │                                      │
│      CodeEditor           │     MemoryLayout                     │
│      (Monaco)             │     ┌────────┬──────────────────┐   │
│                           │     │ Symbol │    Memory        │   │
│   #include <stdio.h>      │     │ Column │    Column        │   │
│   int main() {            │     ├────────┼──────────────────┤   │
│     int a = 10;           │     │   a    │ ┌─ STACK ──────┐ │   │
│     int *p = &a;          │     │   b    │ │ 0x1000 │ 10  │ │   │
│     ...                   │     │   p ═══════▶ ...        │ │   │
│   }                       │     │        │ └──────────────┘ │   │
│                           │     │  main  │ ┌─ CODE ───────┐ │   │
│                           │     │        │ │ 0x0040 │ ... │ │   │
│                           │     │        │ └──────────────┘ │   │
│                           │     └────────┴──────────────────┘   │
├───────────────────────────┴─────────────────────────────────────┤
│  [▶ 실행]  [↺ 리셋]  │  [◀ Prev] Step 2/5 [Next ▶]             │
├─────────────────────────────────────────────────────────────────┤
│  Output: stdout / stderr                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 기존 컴포넌트 vs 새로 만들기

### 4.1 결론: 기존 컴포넌트 재사용 불가

| 기존 컴포넌트 | 재사용? | 이유 |
|--------------|---------|------|
| VariablesPanel | ❌ 불가 | 태그 나열 방식 ≠ 심볼-메모리 연결 디자인 |
| MemoryPanel | ❌ 불가 | Stack/Heap만 지원, 4세그먼트 필요 |
| CourseMemoryView | ❌ 불가 | LessonPage 전용, 구조 다름 |

**기존 컴포넌트는 LessonPage 전용으로 유지.**
**PlaygroundPage는 MemoryLayout 새로 만듦.**

### 4.2 새로 만들 컴포넌트

| 컴포넌트 | 역할 | 복잡도 |
|----------|------|--------|
| **MemoryLayout** | Grid 컨테이너, Context Provider | 🟡 중간 |
| **SymbolColumn** | 심볼 목록 렌더링 | 🟢 쉬움 |
| **SymbolTag** | 개별 심볼 (호버, 색상) | 🟢 쉬움 |
| **MemoryColumn** | 4개 세그먼트 배치 | 🟢 쉬움 |
| **MemorySegment** | Stack/Heap/Data/Code 박스 | 🟢 쉬움 |
| **MemoryCell** | 주소 + 값 (호버, 색상) | 🟢 쉬움 |
| **PointerOverlay** | SVG 화살표 그리기 | 🔴 어려움 |
| **usePositionTracker** | ref 위치 계산 | 🔴 어려움 |
| **useColorMapping** | 심볼별 색상 할당 | 🟡 중간 |
| **MemoryLayoutContext** | 호버/위치 상태 공유 | 🟡 중간 |

---

## 5. 데이터 흐름

```mermaid
flowchart TD
    A[사용자 코드 입력] --> B[실행 버튼 클릭]
    B --> C[POST /api/memory/trace]
    C --> D[백엔드 시뮬레이터]
    D --> E[Step[] 반환]
    E --> F[usePlaygroundMemory]
    F --> G[MemoryView 렌더링]

    F --> H[스텝 네비게이션]
    H --> G
```

---

## 6. API 확장 설계

### 6.1 지원 범위 (Phase 2)

| 기능 | 현재 | 확장 후 |
|------|------|---------|
| 지역변수 (Stack) | ✅ | ✅ |
| 동적할당 (Heap) | ✅ | ✅ |
| 포인터 | ✅ | ✅ |
| 배열 | ✅ | ✅ |
| **전역변수** | ❌ | ✅ |
| **여러 함수** | ❌ | ✅ |
| **함수 호출** | ❌ | ✅ |
| **문자열 리터럴** | ❌ | ✅ |
| **구조체** | ❌ | ✅ |
| **static 변수** | ❌ | ✅ |

### 6.2 확장된 API 응답

```typescript
// POST /api/memory/trace (확장)
interface TraceResponse {
  success: boolean;
  steps: Step[];
  source_lines: string[];

  // 🆕 정적 정보 (코드 전체에서 불변)
  static_info: {
    functions: FunctionInfo[];    // 함수 목록 (Code 세그먼트)
    globals: GlobalInfo[];        // 전역변수 (Data 세그먼트)
    literals: LiteralInfo[];      // 문자열 리터럴 (Data 세그먼트)
    structs: StructInfo[];        // 구조체 정의
  };
}
```

### 6.3 정적 정보 타입

```typescript
// 🆕 함수 정보 (Code 세그먼트)
interface FunctionInfo {
  name: string;           // "main", "helper"
  address: string;        // "0x0000_1000"
  size: number;           // 바이트 크기
  return_type: string;    // "int", "void"
  params: ParamInfo[];    // 매개변수 목록
}

interface ParamInfo {
  name: string;
  type: string;
}

// 🆕 전역변수 정보 (Data 세그먼트)
interface GlobalInfo {
  name: string;           // "g_count"
  address: string;        // "0x0000_2000"
  type: string;           // "int"
  size: number;
  is_static: boolean;     // static 여부
}

// 🆕 문자열 리터럴 정보 (Data 세그먼트)
interface LiteralInfo {
  id: string;             // "str_0", "str_1"
  address: string;        // "0x0000_2100"
  value: string;          // "hello"
  size: number;           // 6 (null 포함)
}

// 🆕 구조체 정의
interface StructInfo {
  name: string;           // "Point"
  size: number;           // 8
  fields: FieldInfo[];
}

interface FieldInfo {
  name: string;           // "x"
  type: string;           // "int"
  offset: number;         // 0
  size: number;           // 4
}
```

### 6.4 확장된 Step

```typescript
interface Step {
  line: number;
  code: string;
  explanation: string;

  // 레지스터 (Stack 관련)
  rsp: string;
  rbp: string;

  // 🆕 현재 실행 중인 함수
  current_function: string;  // "main", "helper"

  // 메모리 세그먼트별 스냅샷
  stack: MemoryBlock[];      // 지역변수
  heap: MemoryBlock[];       // 동적할당
  data: MemoryBlock[];       // 🆕 전역변수 현재 값

  // 🆕 콜스택 (함수 호출 추적)
  call_stack: CallFrame[];
}

// 🆕 콜스택 프레임
interface CallFrame {
  function_name: string;
  return_address: string;
  local_vars: string[];     // 이 프레임의 지역변수 이름들
}
```

### 6.5 확장된 MemoryBlock

```typescript
interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to: string | null;

  // 🆕 추가 필드
  segment: 'stack' | 'heap' | 'data' | 'code';
  is_static?: boolean;       // static 변수 여부
  struct_type?: string;      // 구조체면 타입명
  fields?: MemoryBlock[];    // 구조체 필드들
}
```

---

## 7. 프론트엔드 타입 변환

### 7.1 UI용 통합 타입

```typescript
// 프론트엔드에서 사용하는 통합 메모리 상태
interface MemoryState {
  // 4개 세그먼트
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  data: MemoryBlock[];
  code: MemoryBlock[];

  // 심볼 목록 (왼쪽 컬럼용)
  symbols: Symbol[];

  // 콜스택
  callStack: CallFrame[];
}

// 심볼 (변수명/함수명)
interface Symbol {
  id: string;                    // 고유 ID
  name: string;                  // "a", "main", "g_count"
  type: 'variable' | 'function' | 'literal' | 'struct';
  segment: 'stack' | 'heap' | 'data' | 'code';
  address: string;               // 가리키는 메모리 주소
  data_type: string;             // "int", "int*", "char[]"
  is_pointer: boolean;           // 포인터 여부
  points_to?: string;            // 포인터가 가리키는 주소
  color: string;                 // 할당된 색상 (형광펜)
}
```

### 7.2 변환 함수

```typescript
// API 응답 → UI 상태 변환
function buildMemoryState(
  response: TraceResponse,
  stepIndex: number,
  colorMap: Map<string, string>
): MemoryState {
  const step = response.steps[stepIndex];
  const { functions, globals, literals } = response.static_info;

  // Code 세그먼트: 함수들
  const code: MemoryBlock[] = functions.map(f => ({
    name: f.name,
    address: f.address,
    type: f.return_type,
    size: f.size,
    bytes: [],
    value: '(code)',
    points_to: null,
    segment: 'code',
  }));

  // Data 세그먼트: 전역변수 + 리터럴
  const data: MemoryBlock[] = [
    ...step.data,
    ...literals.map(l => ({
      name: l.id,
      address: l.address,
      type: 'char[]',
      size: l.size,
      bytes: [],
      value: `"${l.value}"`,
      points_to: null,
      segment: 'data' as const,
    })),
  ];

  // 심볼 목록 생성
  const symbols = buildSymbols(step, response.static_info, colorMap);

  return {
    stack: step.stack.map(b => ({ ...b, segment: 'stack' as const })),
    heap: step.heap.map(b => ({ ...b, segment: 'heap' as const })),
    data,
    code,
    symbols,
    callStack: step.call_stack,
  };
}

// 심볼 목록 생성
function buildSymbols(
  step: Step,
  staticInfo: StaticInfo,
  colorMap: Map<string, string>
): Symbol[] {
  const symbols: Symbol[] = [];

  // Stack 변수들
  for (const block of step.stack) {
    symbols.push({
      id: `stack_${block.name}`,
      name: block.name,
      type: 'variable',
      segment: 'stack',
      address: block.address,
      data_type: block.type,
      is_pointer: block.points_to !== null,
      points_to: block.points_to || undefined,
      color: colorMap.get(block.name) || '#60A5FA',
    });
  }

  // 전역변수
  for (const g of staticInfo.globals) {
    symbols.push({
      id: `global_${g.name}`,
      name: g.name,
      type: 'variable',
      segment: 'data',
      address: g.address,
      data_type: g.type,
      is_pointer: false,
      color: colorMap.get(g.name) || '#FB923C',
    });
  }

  // 함수들
  for (const f of staticInfo.functions) {
    symbols.push({
      id: `func_${f.name}`,
      name: f.name,
      type: 'function',
      segment: 'code',
      address: f.address,
      data_type: f.return_type,
      is_pointer: false,
      color: colorMap.get(f.name) || '#A78BFA',
    });
  }

  return symbols;
}
```

---

## 8. 백엔드 확장 작업 목록

| # | 작업 | 파일 | 난이도 |
|---|------|------|--------|
| 1 | `static_info` 응답 구조 추가 | `types.ts` | 🟢 |
| 2 | 전역변수 파싱 | `simulator.ts` | 🟡 |
| 3 | 문자열 리터럴 감지 | `simulator.ts` | 🟡 |
| 4 | 여러 함수 파싱 | `simulator.ts` | 🔴 |
| 5 | 함수 호출 시뮬레이션 | `handlers/call.handler.ts` | 🔴 |
| 6 | 콜스택 관리 | `simulator.ts` | 🔴 |
| 7 | 구조체 파싱 | `handlers/struct.handler.ts` | 🔴 |
| 8 | static 변수 처리 | `handlers/static.handler.ts` | 🟡 |
| 9 | Data 세그먼트 주소 관리 | `simulator.ts` | 🟡 |

---

## 9. usePlaygroundMemory 훅

```typescript
interface UsePlaygroundMemoryReturn {
  // 상태
  steps: Step[];
  currentStepIndex: number;
  isLoading: boolean;
  error: string | null;
  output: { stdout: string; stderr: string };

  // 메모리 상태 (MemoryView용)
  memoryState: {
    stack: MemoryBlock[];
    heap: MemoryBlock[];
  };
  changedBlocks: string[];

  // 액션
  execute: (code: string) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  reset: () => void;
}
```

---

## 10. 작업 순서 (Phase별)

### Phase 1: MVP (현재 API 활용)

> 목표: 현재 백엔드(stack/heap만)로 동작하는 Playground 완성

#### 프론트엔드 (Phase 1)

| # | 작업 | 파일 | 의존성 | 난이도 |
|---|------|------|--------|--------|
| F1 | Monaco Editor 설치 | `pnpm add @monaco-editor/react` | - | 🟢 |
| F2 | services/tracer.ts | API 클라이언트 | - | 🟢 |
| F3 | CodeEditor 컴포넌트 | `components/CodeEditor.tsx` | F1 | 🟢 |
| F4 | usePlaygroundMemory 훅 | `hooks/usePlaygroundMemory.ts` | F2 | 🟡 |
| F5 | useColorMapping 훅 | `hooks/useColorMapping.ts` | - | 🟢 |
| F6 | MemoryLayoutContext | `context/MemoryLayoutContext.tsx` | - | 🟡 |
| F7 | SymbolTag 컴포넌트 | `MemoryLayout/SymbolTag.tsx` | F5, F6 | 🟢 |
| F8 | MemoryCell 컴포넌트 | `MemoryLayout/MemoryCell.tsx` | F5, F6 | 🟢 |
| F9 | MemorySegment 컴포넌트 | `MemoryLayout/MemorySegment.tsx` | F8 | 🟢 |
| F10 | SymbolColumn 컴포넌트 | `MemoryLayout/SymbolColumn.tsx` | F7 | 🟢 |
| F11 | MemoryColumn 컴포넌트 | `MemoryLayout/MemoryColumn.tsx` | F9 | 🟢 |
| F12 | usePositionTracker 훅 | `hooks/usePositionTracker.ts` | - | 🔴 |
| F13 | PointerOverlay 컴포넌트 | `MemoryLayout/PointerOverlay.tsx` | F12 | 🔴 |
| F14 | MemoryLayout 컴포넌트 | `MemoryLayout/MemoryLayout.tsx` | F10, F11, F13 | 🟡 |
| F15 | PlaygroundControls | `components/PlaygroundControls.tsx` | - | 🟢 |
| F16 | OutputPanel | `components/OutputPanel.tsx` | - | 🟢 |
| F17 | PlaygroundPage | `PlaygroundPage.tsx` | F3, F4, F14, F15, F16 | 🟡 |
| F18 | 라우팅 추가 | `App.tsx` | F17 | 🟢 |
| F19 | Sidebar 메뉴 | `Sidebar.tsx` | F18 | 🟢 |

#### Phase 1 의존성 그래프

```
F1 ──▶ F3 ──────────────────────────────┐
                                         │
F2 ──▶ F4 ──────────────────────────────┤
                                         │
F5 ──┬▶ F7 ──▶ F10 ──┐                  │
     │               │                   │
F6 ──┤               ├──▶ F14 ──────────┼──▶ F17 ──▶ F18 ──▶ F19
     │               │                   │
     └▶ F8 ──▶ F9 ──▶ F11 ──┘           │
                                         │
F12 ──▶ F13 ────────────────────────────┤
                                         │
F15 ────────────────────────────────────┤
F16 ────────────────────────────────────┘
```

#### 추천 작업 순서 (Phase 1)

```
Week 1: 기반
├── Day 1: F1, F2 (설치, API 클라이언트)
├── Day 2: F3, F5, F6 (CodeEditor, 색상, Context)
└── Day 3: F4 (usePlaygroundMemory)

Week 2: 메모리 컴포넌트
├── Day 1: F7, F8 (SymbolTag, MemoryCell)
├── Day 2: F9, F10, F11 (Segment, Column들)
└── Day 3: F12, F13 (위치 추적, 화살표) 🔴 난관

Week 3: 조합 & 완성
├── Day 1: F14, F15, F16 (MemoryLayout, Controls, Output)
├── Day 2: F17 (PlaygroundPage)
└── Day 3: F18, F19 (라우팅, 메뉴)
```

---

### Phase 2: API 확장 (전역변수, 함수 등)

> 목표: 전역변수, 여러 함수, 구조체 등 지원

#### 백엔드 (Phase 2)

| # | 작업 | 파일 | 의존성 | 난이도 |
|---|------|------|--------|--------|
| B1 | 타입 정의 확장 | `handlers/types.ts` | - | 🟢 |
| B2 | Data 세그먼트 주소 관리 | `simulator.ts` | B1 | 🟡 |
| B3 | 전역변수 파싱 | `simulator.ts` | B2 | 🟡 |
| B4 | 문자열 리터럴 감지 | `simulator.ts` | B2 | 🟡 |
| B5 | static 변수 핸들러 | `handlers/static.handler.ts` | B2 | 🟡 |
| B6 | 여러 함수 파싱 | `simulator.ts` | B1 | 🔴 |
| B7 | 콜스택 관리 | `simulator.ts` | B6 | 🔴 |
| B8 | 함수 호출 핸들러 | `handlers/call.handler.ts` | B7 | 🔴 |
| B9 | 구조체 파싱 | `handlers/struct.handler.ts` | B1 | 🔴 |
| B10 | static_info 응답 추가 | `simulator.ts` | B3, B4, B6 | 🟡 |

#### 프론트엔드 (Phase 2)

| # | 작업 | 파일 | 의존성 | 난이도 |
|---|------|------|--------|--------|
| F20 | 타입 업데이트 | `types.ts` | B1 | 🟢 |
| F21 | buildMemoryState 함수 | `hooks/usePlaygroundMemory.ts` | B10, F20 | 🟡 |
| F22 | Data/Code 세그먼트 UI | `MemoryLayout/MemoryColumn.tsx` | F21 | 🟡 |
| F23 | 콜스택 표시 | `MemoryLayout/CallStackPanel.tsx` | B7, F21 | 🟡 |
| F24 | 구조체 필드 펼침 | `MemoryLayout/MemoryCell.tsx` | B9 | 🟡 |

#### Phase 2 의존성 그래프

```
Backend:
B1 ──┬▶ B2 ──┬▶ B3 ──┐
     │       │       │
     │       ├▶ B4 ──┼──▶ B10
     │       │       │
     │       └▶ B5   │
     │               │
     ├▶ B6 ──▶ B7 ──▶ B8
     │
     └▶ B9

Frontend:
B1 ──▶ F20 ──┐
             │
B10 ─────────┼──▶ F21 ──┬▶ F22
             │          │
             │          └▶ F23
B9 ──────────────────────▶ F24
```

---

### 전체 로드맵

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Phase 1 (MVP)                    Phase 2 (확장)                │
│  ═══════════════                  ═══════════════               │
│                                                                  │
│  [프론트엔드]                      [백엔드]     [프론트엔드]     │
│                                                                  │
│  F1~F19                           B1~B10       F20~F24          │
│  (3주)                            (2주)        (1주)            │
│                                                                  │
│  ────────────────▶ ────────────────▶ ────────────────▶          │
│                                                                  │
│  현재 API로 동작    API 확장        확장된 API 연동             │
│  Stack/Heap만       +Data/Code      4개 세그먼트                │
│                     +함수/구조체     +콜스택                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 핵심 난관 (🔴)

| 작업 | 왜 어려운가 | 해결 전략 |
|------|------------|----------|
| **F12 usePositionTracker** | DOM 위치 계산, 리사이즈 대응 | ResizeObserver + getBoundingClientRect |
| **F13 PointerOverlay** | SVG path 계산, 곡선 그리기 | Bezier curve, 시작/끝점 계산 |
| **B6 여러 함수 파싱** | AST 수준 파싱 필요 | 정규식 → 간단한 파서 |
| **B7 콜스택 관리** | 스택 프레임 추적 | 함수 진입/종료 이벤트 |
| **B8 함수 호출** | 인자 전달, 리턴값 | 스택에 인자 push/pop |
| **B9 구조체** | 필드 오프셋 계산 | 타입별 크기 테이블 |

---

## 11. 메모리 시각화 디자인

### 11.1 핵심 개념

**심볼 vs 메모리 분리**
- 변수명/함수명은 메모리에 저장되지 않음 (컴파일러 심볼)
- 메모리에는 주소 + 값만 존재
- 심볼은 메모리 바깥에 표시, 같은 색으로 연결

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MEMORY LAYOUT                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│     심볼명                         실제 메모리                                │
│   (컴파일러만 앎)                  (런타임에 존재)                            │
│                                                                               │
│                         ┌──────────────────────────────┐                     │
│                         │     STACK (↓ grows down)     │                     │
│                         ├──────────────────────────────┤                     │
│  ┌─────┐                │              ┌─────────────┐ │                     │
│  │  p  │ ═══════════════════════════▶  │ 0x7FFF_1000 │ │ (포인터: 화살표)   │
│  └─────┘                │              └─────────────┘ │                     │
│   🟡노랑                 ├──────────────────────────────┤                     │
│                         │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │                     │
│  ░░░░░░░                │ ░ 0x7FFF_1004 │      20    ░ │ (같은색 = 같은것)  │
│  ░  b  ░                │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │                     │
│  ░░░░░░░                ├──────────────────────────────┤                     │
│   🟢초록                 │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                     │
│                         │ ▓ 0x7FFF_1000 │      10    ▓ │ ◀── p가 가리킴     │
│  ▓▓▓▓▓▓▓                │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │                     │
│  ▓  a  ▓                └──────────────────────────────┘                     │
│  ▓▓▓▓▓▓▓                                                                      │
│   🔵파랑                                                                       │
│                                                                               │
│                         ┌──────────────────────────────┐                     │
│                         │            CODE              │                     │
│                         ├──────────────────────────────┤                     │
│  ▒▒▒▒▒▒▒▒               │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │                     │
│  ▒ main ▒               │ ▒ 0x0000_1000 │ 55 48 89.. ▒ │                     │
│  ▒▒▒▒▒▒▒▒               │ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │                     │
│   🟣보라                 └──────────────────────────────┘                     │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 전체 메모리 레이아웃

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           MEMORY LAYOUT                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│     심볼명                         실제 메모리                                │
│                                                                               │
│                         ┌──────────────────────────────┐                     │
│                         │     STACK (↓ grows down)     │                     │
│                         ├──────────────────────────────┤                     │
│       fp ─────────────▶ │ 0x7FFF_1010 │ 0x0000_1000    │ ──────────────────┐ │
│                         ├──────────────────────────────┤                   │ │
│      msg ─────────────▶ │ 0x7FFF_100C │ 0x0000_2000    │ ────────────────┐ │ │
│                         ├──────────────────────────────┤                 │ │ │
│        q ─────────────▶ │ 0x7FFF_1008 │ 0x7FFF_3000    │ ──────────┐     │ │ │
│                         ├──────────────────────────────┤           │     │ │ │
│        p ─────────────▶ │ 0x7FFF_1004 │ 0x7FFF_1000    │ ──┐       │     │ │ │
│                         ├──────────────────────────────┤   │       │     │ │ │
│        a ─────────────▶ │ 0x7FFF_1000 │      10        │ ◀─┘       │     │ │ │
│                         └──────────────────────────────┘           │     │ │ │
│                                                          p→Stack   │     │ │ │
│                                                                     │     │ │ │
│                         ┌──────────────────────────────┐           │     │ │ │
│                         │      HEAP (↑ grows up)       │           │     │ │ │
│                         ├──────────────────────────────┤           │     │ │ │
│                         │ 0x7FFF_3000 │      42        │ ◀─────────┘     │ │ │
│                         └──────────────────────────────┘                 │ │ │
│                                                          q→Heap          │ │ │
│                                                                           │ │ │
│                         ┌──────────────────────────────┐                 │ │ │
│                         │            DATA              │                 │ │ │
│                         ├──────────────────────────────┤                 │ │ │
│      str ─────────────▶ │ 0x0000_2000 │ "hello\0"      │ ◀───────────────┘ │ │
│                         └──────────────────────────────┘                   │ │
│                                                          msg→Data          │ │
│                                                                             │ │
│                         ┌──────────────────────────────┐                   │ │
│                         │            CODE              │                   │ │
│                         ├──────────────────────────────┤                   │ │
│     main ─────────────▶ │ 0x0000_1000 │ 55 48 89 E5... │ ◀─────────────────┘ │
│                         ├──────────────────────────────┤                     │
│    func1 ─────────────▶ │ 0x0000_1050 │ 48 83 EC 10... │                     │
│                         └──────────────────────────────┘                     │
│                                                          fp→Code             │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 11.3 인터랙션 규칙

#### 기본 상태 → 호버 상태

```
[ 기본 상태 ]

  a                    │ 0x7FFF_1000 │   10   │
 ───                   └─────────────────────┘
(평평함)                    (평평함)


[ a 호버 시 ]

╔═══════╗              ╔═══════════════════════╗
║   a   ║   ◀──────▶   ║ 0x7FFF_1000 │   10   ║
╚═══════╝              ╚═══════════════════════╝
 ↑ 튀어나옴                  ↑ 같이 튀어나옴
 + 그림자                    + 그림자
 + 밝아짐                    + 밝아짐


[ 포인터 p 호버 시 ]

╔═══════╗
║   p   ║ ════════════════════════════════════▶ 타겟 메모리 하이라이트
╚═══════╝
    │
    └─ 화살표가 애니메이션으로 강조됨
```

### 11.4 색상 규칙

| 요소 | 색상 | Hex | 의미 |
|------|------|-----|------|
| 🔵 파랑 | Stack 변수 | `#60A5FA` / `#DBEAFE` | 일반 변수 |
| 🟢 초록 | Heap 데이터 | `#34D399` / `#D1FAE5` | 동적 할당 |
| 🟣 보라 | Code 함수 | `#A78BFA` / `#EDE9FE` | 함수 |
| 🟠 주황 | Data 영역 | `#FB923C` / `#FED7AA` | 전역/리터럴 |
| 🟡 노랑 | 포인터 | `#FBBF24` / `#FEF3C7` | 포인터 변수 |
| 🔴 빨강 | 변경됨 | `#F87171` / `#FEE2E2` | 값 변경 |

### 11.5 포인터 화살표 규칙

| 포인터 종류 | 가리키는 영역 | 예시 |
|------------|--------------|------|
| `int *p = &a` | Stack | 지역변수 주소 |
| `int *p = malloc()` | Heap | 동적 할당 |
| `char *s = "hello"` | Data | 문자열 리터럴 |
| `void (*fp)() = main` | Code | 함수 포인터 |

### 11.6 애니메이션

| 이벤트 | 애니메이션 | 시간 |
|--------|-----------|------|
| 호버 | scale(1.05) + shadow | 150ms |
| 값 변경 | flash-yellow → fade | 300ms |
| 새 블록 | slide-in + fade-in | 400ms |
| 포인터 화살표 | dash-animation | 무한 |
| 블록 삭제 | fade-out + shrink | 300ms |
