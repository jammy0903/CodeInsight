# Wasm + 하이브리드 C 시뮬레이터 구현 계획

**작성일:** 2026-01-27
**예상 기간:** 2-3주
**목표:** Emscripten 검증 + 현재 인터프리터 실행 하이브리드 방식

---

## 🎯 핵심 전략

**"컴파일은 Emscripten, 실행은 인터프리터"**

- ✅ Emscripten으로 문법/의미 정확성 검증
- ✅ 현재 인터프리터로 실행 (메모리 시각화 유지)
- ✅ 점진적 기능 확장 (함수 포인터, 이중 포인터 등)

---

## 📐 시스템 아키텍처

### Before (현재)
```
C 코드 → 인터프리터 파싱 → 실행 → JSON 스냅샷
```

### After (하이브리드)
```
                    ┌─────────────────┐
                    │   C 코드 입력    │
                    └────────┬─────────┘
                             │
                  ┌──────────▼──────────┐
                  │  Emscripten 검증    │
                  │  emcc -fsyntax-only │
                  └──────────┬──────────┘
                             │
                    ┌────────▼────────┐
                    │  검증 성공?      │
                    └────┬────────┬────┘
                         │        │
                      ✅ YES    ❌ NO
                         │        │
                         │        └─→ 컴파일 에러 반환
                         │
                    ┌────▼──────────────────┐
                    │ 현재 인터프리터 실행   │
                    │ (메모리 시각화 유지)   │
                    └───────────┬───────────┘
                                │
                           ┌────▼────┐
                           │ 스냅샷   │
                           └─────────┘
```

---

## 📦 Phase별 구현 계획

### Phase 1: Emscripten 통합 (Week 1)

#### 1.1 Emscripten 설치 및 환경 설정

**설치:**
```bash
# Emscripten SDK 설치
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

**Docker 이미지 (프로덕션용):**
```dockerfile
FROM node:18-alpine

# Emscripten 설치
RUN apk add --no-cache python3 cmake ninja git
RUN git clone https://github.com/emscripten-core/emsdk.git /emsdk && \
    cd /emsdk && \
    ./emsdk install 3.1.50 && \
    ./emsdk activate 3.1.50

ENV PATH="/emsdk:/emsdk/upstream/emscripten:${PATH}"

WORKDIR /app
COPY . .
RUN pnpm install
CMD ["pnpm", "dev"]
```

#### 1.2 검증 서비스 구현

**파일:** `packages/backend/src/modules/simulators/c/services/emscripten-validator.service.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export class EmscriptenValidatorService {
  private readonly tempDir = '/tmp/c-simulator';

  constructor() {
    // 임시 디렉토리 생성
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Emscripten으로 C 코드 문법 검증
   * @param code C 소스 코드
   * @returns 검증 결과
   */
  async validate(code: string): Promise<ValidationResult> {
    const sessionId = uuidv4();
    const tempFile = path.join(this.tempDir, `${sessionId}.c`);

    try {
      // 1. 임시 파일 작성
      await fs.writeFile(tempFile, code, 'utf-8');

      // 2. Emscripten 검증 (컴파일은 하지 않고 문법만)
      const { stdout, stderr } = await execAsync(
        `emcc -fsyntax-only -Wall -Wextra ${tempFile}`,
        {
          timeout: 5000, // 5초 타임아웃
          maxBuffer: 1024 * 1024, // 1MB
        }
      );

      // 3. 경고 파싱
      const warnings = this.parseWarnings(stderr);

      return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error: any) {
      // 4. 에러 파싱
      const errors = this.parseErrors(error.stderr || error.message);

      return {
        isValid: false,
        errors,
      };
    } finally {
      // 5. 임시 파일 정리
      try {
        await fs.unlink(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
    }
  }

  /**
   * Emscripten 에러 메시지 파싱
   */
  private parseErrors(stderr: string): string[] {
    const errors: string[] = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      // 에러 메시지 형식: "file.c:line:col: error: message"
      const errorMatch = line.match(/:\d+:\d+:\s*error:\s*(.+)/);
      if (errorMatch) {
        errors.push(errorMatch[1].trim());
      }
    }

    // 에러가 파싱되지 않으면 전체 stderr 반환
    return errors.length > 0 ? errors : [stderr];
  }

  /**
   * Emscripten 경고 메시지 파싱
   */
  private parseWarnings(stderr: string): string[] {
    const warnings: string[] = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      const warningMatch = line.match(/:\d+:\d+:\s*warning:\s*(.+)/);
      if (warningMatch) {
        warnings.push(warningMatch[1].trim());
      }
    }

    return warnings;
  }

  /**
   * Emscripten 설치 확인
   */
  async checkInstallation(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('emcc --version', { timeout: 3000 });
      console.log('Emscripten version:', stdout.split('\n')[0]);
      return true;
    } catch (error) {
      console.error('Emscripten not found:', error);
      return false;
    }
  }
}
```

#### 1.3 기존 시뮬레이터 통합

**파일:** `packages/backend/src/modules/simulators/c/c-simulation.service.ts`

```typescript
import { EmscriptenValidatorService } from './services/emscripten-validator.service';
import { CSimulator } from './simulator';

export class CSimulationService {
  private validator: EmscriptenValidatorService;

  constructor() {
    this.validator = new EmscriptenValidatorService();
  }

  async simulate(code: string) {
    try {
      // 1. Emscripten 검증
      const validation = await this.validator.validate(code);

      if (!validation.isValid) {
        return {
          success: false,
          error: {
            type: 'COMPILATION_ERROR',
            message: '컴파일 에러가 발생했습니다.',
            details: validation.errors,
          },
        };
      }

      // 2. 경고가 있으면 로그 (에러는 아님)
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('Compilation warnings:', validation.warnings);
      }

      // 3. 현재 인터프리터 실행
      const simulator = new CSimulator();
      const steps = await simulator.run(code);

      return {
        success: true,
        steps,
        warnings: validation.warnings,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'RUNTIME_ERROR',
          message: error.message,
        },
      };
    }
  }
}
```

#### 1.4 API 엔드포인트 수정

**파일:** `packages/backend/src/modules/simulators/c/routes.ts`

```typescript
import { Router } from 'express';
import { CSimulationService } from './c-simulation.service';

const router = Router();
const simulationService = new CSimulationService();

router.post('/simulate', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const result = await simulationService.simulate(code);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

export default router;
```

---

### Phase 2: 인터프리터 확장 (Week 2)

#### 2.1 함수 포인터 지원

**목표:** `void (*callback)(int) = &myFunc;` 패턴 지원

**파일:** `packages/backend/src/modules/simulators/c/handlers/function-pointer.handler.ts`

```typescript
import type { CodeHandler, SimContext, Step } from './types';

// 함수 포인터 선언: void (*callback)(int) = &myFunc;
const FUNC_PTR_DECL_PATTERN = /^(\w+)\s*\(\*(\w+)\)\(([^)]*)\)\s*=\s*&(\w+)$/;

// 함수 포인터 호출: callback(10);
const FUNC_PTR_CALL_PATTERN = /^(\w+)\(([^)]*)\)$/;

export const FunctionPointerHandler: CodeHandler = {
  name: 'function-pointer',
  priority: 15, // 일반 함수 호출보다 우선

  canHandle(code: string): boolean {
    return FUNC_PTR_DECL_PATTERN.test(code) || this.isFunctionPointerCall(code);
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // 1. 함수 포인터 선언
    const declMatch = code.match(FUNC_PTR_DECL_PATTERN);
    if (declMatch) {
      return this.handleDeclaration(ctx, lineNum, code, declMatch);
    }

    // 2. 함수 포인터 호출
    const callMatch = code.match(FUNC_PTR_CALL_PATTERN);
    if (callMatch && this.isFunctionPointerCall(code)) {
      return this.handleCall(ctx, lineNum, code, callMatch);
    }

    return null;
  },

  isFunctionPointerCall(code: string): boolean {
    const match = code.match(FUNC_PTR_CALL_PATTERN);
    if (!match) return false;

    const [, funcName] = match;
    const variable = ctx.variables.get(funcName);
    return variable?.type === 'function_pointer';
  },

  handleDeclaration(
    ctx: SimContext,
    lineNum: number,
    code: string,
    match: RegExpMatchArray
  ): Step {
    const [, returnType, ptrName, params, targetFunc] = match;

    // 함수가 존재하는지 확인
    if (!ctx.functions.has(targetFunc)) {
      throw new Error(`Function '${targetFunc}' not found`);
    }

    // 함수 주소 생성 (가상)
    const funcAddress = `0xF${Math.floor(Math.random() * 0xfff)
      .toString(16)
      .toUpperCase()
      .padStart(3, '0')}`;

    // 변수로 저장
    ctx.variables.set(ptrName, {
      name: ptrName,
      type: 'function_pointer',
      value: funcAddress,
      address: ctx.allocateStack(8), // 포인터 크기
      pointsTo: targetFunc,
      returnType,
      params,
    });

    const explanation = `🔗 함수 포인터 선언: ${ptrName}

📌 ${ptrName}는 ${targetFunc} 함수를 가리키는 포인터입니다.
   주소: ${funcAddress}

💡 함수 포인터란?
   • 함수의 주소를 저장하는 변수
   • ${ptrName}()를 호출하면 ${targetFunc}()가 실행됨
   • 콜백, 함수 배열 등에 활용

⚡ 선언 형식:
   ${returnType} (*${ptrName})(${params}) = &${targetFunc};`;

    return ctx.createStep(lineNum, code, explanation);
  },

  handleCall(
    ctx: SimContext,
    lineNum: number,
    code: string,
    match: RegExpMatchArray
  ): Step {
    const [, ptrName, argsStr] = match;

    const funcPtr = ctx.variables.get(ptrName);
    if (!funcPtr || funcPtr.type !== 'function_pointer') {
      throw new Error(`'${ptrName}' is not a function pointer`);
    }

    const targetFunc = funcPtr.pointsTo as string;

    const explanation = `📞 함수 포인터 호출: ${ptrName}()

🔀 ${ptrName}이 가리키는 함수: ${targetFunc}
   실제로 실행되는 함수: ${targetFunc}(${argsStr})

💡 동작 원리:
   1. ${ptrName}에 저장된 주소(${funcPtr.value}) 참조
   2. 해당 주소의 함수(${targetFunc}) 찾기
   3. 함수 실행

⚡ 이것이 바로 간접 호출(Indirect Call)입니다!`;

    // 실제 함수 호출 (기존 함수 호출 핸들러 위임)
    const actualCall = `${targetFunc}(${argsStr})`;
    // TODO: 실제 함수 실행 로직 추가

    return ctx.createStep(lineNum, code, explanation);
  },
};
```

#### 2.2 이중 포인터 지원

**목표:** `int **pp` 패턴 지원

**파일:** `packages/backend/src/modules/simulators/c/handlers/double-pointer.handler.ts`

```typescript
import type { CodeHandler, SimContext, Step } from './types';

// 이중 포인터 선언: int **pp;
const DOUBLE_PTR_DECL_PATTERN = /^(\w+)\s+\**(\w+)$/;

// 이중 포인터 할당: pp = &p;
const DOUBLE_PTR_ASSIGN_PATTERN = /^(\w+)\s*=\s*&(\w+)$/;

// 이중 역참조: **pp
const DOUBLE_DEREF_PATTERN = /^\**(\w+)$/;

export const DoublePointerHandler: CodeHandler = {
  name: 'double-pointer',
  priority: 20,

  canHandle(code: string): boolean {
    return (
      DOUBLE_PTR_DECL_PATTERN.test(code) ||
      DOUBLE_PTR_ASSIGN_PATTERN.test(code) ||
      DOUBLE_DEREF_PATTERN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // 1. 선언
    const declMatch = code.match(DOUBLE_PTR_DECL_PATTERN);
    if (declMatch) {
      return this.handleDeclaration(ctx, lineNum, code, declMatch);
    }

    // 2. 할당
    const assignMatch = code.match(DOUBLE_PTR_ASSIGN_PATTERN);
    if (assignMatch) {
      const [, lhs, rhs] = assignMatch;
      const lhsVar = ctx.variables.get(lhs);

      // 이중 포인터에 포인터 주소 할당
      if (lhsVar?.type === 'pointer*') {
        return this.handleAssignment(ctx, lineNum, code, assignMatch);
      }
    }

    // 3. 이중 역참조
    const derefMatch = code.match(DOUBLE_DEREF_PATTERN);
    if (derefMatch) {
      return this.handleDoubleDeref(ctx, lineNum, code, derefMatch);
    }

    return null;
  },

  handleDeclaration(
    ctx: SimContext,
    lineNum: number,
    code: string,
    match: RegExpMatchArray
  ): Step {
    const [, baseType, varName] = match;

    const address = ctx.allocateStack(8); // 포인터 크기

    ctx.variables.set(varName, {
      name: varName,
      type: `${baseType}**`, // 이중 포인터 타입
      value: 0, // 초기화되지 않음
      address,
    });

    const explanation = `🔗🔗 이중 포인터 선언: ${varName}

📌 ${varName}는 포인터의 포인터입니다.
   타입: ${baseType}**
   주소: ${address}

💡 이중 포인터란?
   • 포인터 변수의 주소를 저장하는 포인터
   • *${varName} → 첫 번째 포인터 값
   • **${varName} → 최종 값

⚡ 메모리 구조:
   ${varName} → [포인터 주소] → [실제 값]`;

    return ctx.createStep(lineNum, code, explanation);
  },

  handleAssignment(
    ctx: SimContext,
    lineNum: number,
    code: string,
    match: RegExpMatchArray
  ): Step {
    const [, ppName, pName] = match;

    const pp = ctx.variables.get(ppName);
    const p = ctx.variables.get(pName);

    if (!pp || !p) {
      throw new Error('Variable not found');
    }

    // pp가 p의 주소를 가리킴
    pp.value = p.address;
    pp.pointsTo = p.address;
    pp.indirectTarget = pName;

    const explanation = `🔗 이중 포인터 할당: ${ppName} = &${pName}

📌 ${ppName}이 ${pName}의 주소를 가리킵니다.

메모리 상태:
   ${ppName}(${pp.address}) → ${p.address} (${pName}의 주소)
   ${pName}(${p.address}) → ${p.value} (최종 값)

💡 이제 **${ppName}로 ${p.value}에 접근 가능합니다!`;

    return ctx.createStep(lineNum, code, explanation);
  },

  handleDoubleDeref(
    ctx: SimContext,
    lineNum: number,
    code: string,
    match: RegExpMatchArray
  ): Step {
    const [, ppName] = match;

    const pp = ctx.variables.get(ppName);
    if (!pp || !pp.pointsTo) {
      throw new Error(`${ppName} is not initialized`);
    }

    // 1단계: *pp → 첫 번째 포인터
    const firstPtr = ctx.findVariableByAddress(pp.pointsTo);
    if (!firstPtr) {
      throw new Error('Invalid pointer');
    }

    // 2단계: **pp → 최종 값
    let finalValue: any;
    if (firstPtr.pointsTo) {
      const finalVar = ctx.findVariableByAddress(firstPtr.pointsTo);
      finalValue = finalVar?.value || firstPtr.value;
    } else {
      finalValue = firstPtr.value;
    }

    const explanation = `🔍🔍 이중 역참조: **${ppName}

📌 역참조 과정:
   1단계: *${ppName} = ${firstPtr.name} (주소: ${firstPtr.address})
   2단계: **${ppName} = ${finalValue}

메모리 추적:
   ${ppName} → ${pp.pointsTo} → ${finalValue}

💡 결과: **${ppName} = ${finalValue}`;

    return ctx.createStep(lineNum, code, explanation);
  },
};
```

#### 2.3 핸들러 등록

**파일:** `packages/backend/src/modules/simulators/c/handlers/index.ts`

```typescript
import { FunctionPointerHandler } from './function-pointer.handler';
import { DoublePointerHandler } from './double-pointer.handler';
// ... 기존 핸들러들

export const ALL_HANDLERS = [
  DoublePointerHandler,        // 우선순위 20
  FunctionPointerHandler,      // 우선순위 15
  // ... 기존 핸들러들 (우선순위 낮음)
];
```

---

### Phase 3: 테스트 및 문서화 (Week 3)

#### 3.1 단위 테스트

**파일:** `packages/backend/src/modules/simulators/c/services/emscripten-validator.service.test.ts`

```typescript
import { EmscriptenValidatorService } from './emscripten-validator.service';

describe('EmscriptenValidatorService', () => {
  let validator: EmscriptenValidatorService;

  beforeEach(() => {
    validator = new EmscriptenValidatorService();
  });

  describe('validate()', () => {
    it('should validate correct C code', async () => {
      const code = `
        #include <stdio.h>
        int main() {
          printf("Hello, World!\n");
          return 0;
        }
      `;

      const result = await validator.validate(code);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject syntax errors', async () => {
      const code = `
        int main() {
          printf("Missing semicolon")
          return 0;
        }
      `;

      const result = await validator.validate(code);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('expected');
    });

    it('should detect undeclared variables', async () => {
      const code = `
        int main() {
          x = 10;
          return 0;
        }
      `;

      const result = await validator.validate(code);
      expect(result.isValid).toBe(false);
      expect(result.errors![0]).toContain('undeclared');
    });

    it('should return warnings for unused variables', async () => {
      const code = `
        int main() {
          int unused = 10;
          return 0;
        }
      `;

      const result = await validator.validate(code);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('unused');
    });
  });

  describe('checkInstallation()', () => {
    it('should detect Emscripten installation', async () => {
      const isInstalled = await validator.checkInstallation();
      expect(isInstalled).toBe(true);
    });
  });
});
```

#### 3.2 통합 테스트

**파일:** `packages/backend/src/modules/simulators/c/c-simulation.service.test.ts`

```typescript
import { CSimulationService } from './c-simulation.service';

describe('CSimulationService - Hybrid Mode', () => {
  let service: CSimulationService;

  beforeEach(() => {
    service = new CSimulationService();
  });

  it('should validate before execution', async () => {
    const code = `
      int main() {
        int x = 10
        return 0;
      }
    `;

    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('COMPILATION_ERROR');
  });

  it('should execute valid code', async () => {
    const code = `
      int main() {
        int x = 10;
        int y = 20;
        int sum = x + y;
        return 0;
      }
    `;

    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();
    expect(result.steps!.length).toBeGreaterThan(0);
  });

  it('should support function pointers', async () => {
    const code = `
      void greet(int n) {
        printf("Hello %d\n", n);
      }

      int main() {
        void (*callback)(int) = &greet;
        callback(42);
        return 0;
      }
    `;

    const result = await service.simulate(code);

    expect(result.success).toBe(true);

    // 함수 포인터 선언 단계 확인
    const fpDecl = result.steps!.find(s => s.code.includes('(*callback)'));
    expect(fpDecl).toBeDefined();
    expect(fpDecl!.explanation).toContain('함수 포인터');
  });

  it('should support double pointers', async () => {
    const code = `
      int main() {
        int x = 42;
        int *p = &x;
        int **pp = &p;

        printf("**pp = %d\n", **pp);
        return 0;
      }
    `;

    const result = await service.simulate(code);

    expect(result.success).toBe(true);

    // 이중 포인터 선언 확인
    const ppDecl = result.steps!.find(s => s.code.includes('**pp'));
    expect(ppDecl).toBeDefined();
  });
});
```

#### 3.3 프론트엔드 통합

**파일:** `packages/frontend/src/services/simulator.service.ts`

```typescript
// 이미 구현되어 있지만, 에러 처리 개선

async simulate(language: string, code: string) {
  try {
    const response = await fetch(`/api/simulators/${language}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const result = await response.json();

    if (!result.success) {
      // 컴파일 에러 Toast 표시
      if (result.error?.type === 'COMPILATION_ERROR') {
        notifySimulator.compilationError(language, result.error.details);
      } else {
        notifySimulator.runtimeError(language, result.error?.message);
      }
      return null;
    }

    // 경고가 있으면 표시 (에러는 아님)
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Compilation warnings:', result.warnings);
    }

    return result.steps;
  } catch (error) {
    notifySimulator.backendDisconnected();
    return null;
  }
}
```

**파일:** `packages/frontend/src/components/common/Toast.ts`

```typescript
// 새로운 컴파일 에러 알림 추가
export const notifySimulator = {
  // ... 기존 알림들

  compilationError: (language: string, errors: string[]) => {
    toast.error(
      <div>
        <strong>컴파일 에러 ({language})</strong>
        <ul className="mt-2 text-sm">
          {errors.slice(0, 3).map((err, i) => (
            <li key={i}>• {err}</li>
          ))}
        </ul>
      </div>,
      { duration: 6000 }
    );
  },
};
```

#### 3.4 문서화

**파일:** `.claude/context/c-simulator-hybrid.md`

```markdown
# C 시뮬레이터 - Wasm + 하이브리드 아키텍처

## 개요

C 시뮬레이터는 Emscripten 검증 + 인터프리터 실행 하이브리드 방식을 사용합니다.

## 동작 방식

1. **검증 단계 (Emscripten)**
   - 사용자 코드를 `emcc -fsyntax-only`로 검증
   - 문법 에러, 타입 에러, 미선언 변수 등 감지
   - 경고도 함께 수집

2. **실행 단계 (인터프리터)**
   - 검증 통과 시 현재 인터프리터로 실행
   - 메모리 시각화, 라인별 추적 유지
   - 새로운 기능: 함수 포인터, 이중 포인터 지원

## 새로운 기능

### 함수 포인터
```c
void greet(int n) {
  printf("Hello %d\n", n);
}

int main() {
  void (*callback)(int) = &greet;  // ✅ 지원
  callback(42);                     // ✅ 간접 호출
  return 0;
}
```

### 이중 포인터
```c
int main() {
  int x = 42;
  int *p = &x;
  int **pp = &p;    // ✅ 이중 포인터

  printf("%d\n", **pp);  // ✅ 이중 역참조
  return 0;
}
```

## 에러 처리

### 컴파일 에러
```json
{
  "success": false,
  "error": {
    "type": "COMPILATION_ERROR",
    "message": "컴파일 에러가 발생했습니다.",
    "details": [
      "expected '; before 'return'",
      "undeclared identifier 'x'"
    ]
  }
}
```

### 런타임 에러
```json
{
  "success": false,
  "error": {
    "type": "RUNTIME_ERROR",
    "message": "Segmentation fault"
  }
}
```

## 제한사항

현재 **미지원** 기능:
- 다중 파일 컴파일
- 외부 라이브러리 (#include <math.h> 등)
- 파일 I/O (fopen, fread 등)
- 네트워크 소켓
```

---

## 🚀 배포 계획

### 개발 환경 설정

**1. Emscripten 설치**
```bash
# 개발자 로컬
./scripts/install-emscripten.sh
source ~/.bashrc
```

**2. Docker 이미지 빌드**
```bash
docker build -t codeinsight-backend:wasm .
docker run -p 3002:3002 codeinsight-backend:wasm
```

### CI/CD 파이프라인

**.github/workflows/test.yml**
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Emscripten
        run: |
          git clone https://github.com/emscripten-core/emsdk.git
          cd emsdk
          ./emsdk install 3.1.50
          ./emsdk activate 3.1.50
          source ./emsdk_env.sh
          echo "$EMSDK/upstream/emscripten" >> $GITHUB_PATH

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test
```

### Render.com 배포

**render.yaml**
```yaml
services:
  - type: web
    name: codeinsight-backend
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3002
```

---

## 📋 체크리스트

### Week 1: Emscripten 통합
- [ ] Emscripten SDK 설치 및 테스트
- [ ] EmscriptenValidatorService 구현
- [ ] CSimulationService 통합
- [ ] 단위 테스트 작성
- [ ] 에러 파싱 로직 검증

### Week 2: 인터프리터 확장
- [ ] FunctionPointerHandler 구현
- [ ] DoublePointerHandler 구현
- [ ] 핸들러 우선순위 조정
- [ ] 통합 테스트 작성
- [ ] 프론트엔드 Toast 통합

### Week 3: 테스트 및 배포
- [ ] E2E 테스트 (Playwright)
- [ ] 문서화 완료
- [ ] Docker 이미지 빌드
- [ ] CI/CD 파이프라인 구축
- [ ] Render.com 배포 및 검증

---

## 🎯 성공 지표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **검증 정확도** | 95% 이상 | Emscripten 에러와 실제 gcc 에러 비교 |
| **응답 시간** | < 2초 | Emscripten 검증 + 인터프리터 실행 |
| **메모리 사용** | < 100MB/세션 | 임시 파일 + 프로세스 메모리 |
| **동시 사용자** | 50명 | 부하 테스트 (k6) |

---

## 🔮 향후 확장 계획

### v2.0: 선택적 Wasm 실행
```
IF (복잡한 기능 감지) {
  Wasm으로 실행  // 함수 포인터 배열, 구조체 재귀 등
} ELSE {
  인터프리터 실행  // 기본 기능
}
```

### v3.0: 실시간 협업
```
사용자 A 코드 변경 → WebSocket → 사용자 B 실시간 반영
```

---

## 📚 참고 자료

- [Emscripten 공식 문서](https://emscripten.org/docs/porting/Debugging.html)
- [Wasmtime DWARF](https://docs.wasmtime.dev/examples-debugging.html)
- [Chrome DevTools Wasm](https://developer.chrome.com/docs/devtools/wasm)

---

**작성자:** Claude & Jammy
**최종 수정:** 2026-01-27
```