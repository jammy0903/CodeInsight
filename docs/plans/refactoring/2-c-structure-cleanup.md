# C 모듈 구조 정리 (Python 스타일 적용)

> 작성일: 2026-01-12
> 우선순위: 높음
> 예상 소요: 3-5일

---

## 📋 목표

- Python 시뮬레이터처럼 명확한 모듈 구조 적용
- executors/c와 simulators/c 역할 명확화 또는 통합
- Handler 패턴 개선 (Registry 패턴)
- 테스트 코드 정리 및 확장

---

## 🔍 현재 문제점

### 1. 모듈 경계 불명확

```
packages/backend/src/modules/
├── executors/c/           # C 코드 실행 (Docker)
│   ├── c-executor.ts      # exec() 호출
│   └── security.ts        # 보안 검사
├── simulators/c/          # C 메모리 시뮬레이션
│   ├── handlers/          # 메모리 핸들러
│   └── runtime/           # 런타임 상태
└── memory/                # 메모리 관련 공통 로직?
    ├── handlers/          # ⚠️ simulators/c/handlers와 중복?
    └── types/
```

**문제**:
- `memory/handlers/`와 `simulators/c/handlers/` 역할 중복
- `executors`는 실행만, `simulators`는 시뮬레이션만 하는지 불명확
- 새로운 언어(Python, Java) 추가 시 어디에 넣어야 할지 모름

---

### 2. Handler 구조 산재

```
memory/handlers/
├── array.handler.ts       # 배열 처리
├── int.handler.ts         # 정수 처리
├── io.handler.ts          # 입출력 처리
├── malloc.handler.ts      # 동적 메모리
├── pointer.handler.ts     # 포인터 처리
├── types.ts
└── index.ts               # 수동 export
```

**문제**:
- Registry 패턴 없음 (수동으로 import)
- 새 핸들러 추가 시 index.ts 수동 수정 필요
- 핸들러 우선순위/체이닝 로직 없음
- Python처럼 자동 발견(auto-discovery) 불가

---

### 3. Python 시뮬레이터와 일관성 부족

**Python 구조 (예상)**:
```python
backend/simulators/python/
├── __init__.py
├── executor.py           # Python 코드 실행
├── tracer.py             # 메모리 추적
├── handlers/
│   ├── __init__.py       # 자동 등록
│   ├── list_handler.py
│   ├── dict_handler.py
│   └── class_handler.py
└── runtime/
    ├── state.py          # 런타임 상태
    └── memory.py         # 메모리 모델
```

**C 구조 (현재)**:
```
backend/modules/
├── executors/c/          # ⚠️ 분산됨
├── simulators/c/         # ⚠️ 분산됨
└── memory/               # ⚠️ C 전용인데 공통처럼 보임
```

**불일치**:
- Python은 한 곳에 집중, C는 3곳에 분산
- 네이밍 불일치 (executor vs executors)
- 공통 인터페이스 없음

---

## 🎯 해결 방안: Python 스타일 적용

### 목표 구조 (Python처럼)

```
packages/backend/src/modules/
├── c/                     # ✨ C 전용 모듈 (통합)
│   ├── index.ts           # Public API
│   ├── executor.ts        # C 코드 실행 (Docker)
│   ├── simulator.ts       # 메모리 시뮬레이션
│   ├── tracer.ts          # 메모리 추적
│   ├── security.ts        # 보안 검사
│   ├── handlers/          # 메모리 핸들러
│   │   ├── index.ts       # Handler Registry
│   │   ├── array.handler.ts
│   │   ├── malloc.handler.ts
│   │   ├── pointer.handler.ts
│   │   └── ...
│   ├── runtime/           # 런타임 상태 관리
│   │   ├── state.ts
│   │   └── memory.ts
│   └── types/             # C 전용 타입
│       ├── memory.ts
│       └── ast.ts
├── python/                # 🐍 Python 모듈 (미래)
│   ├── index.ts
│   ├── executor.ts
│   ├── simulator.ts
│   └── ...
└── shared/                # 🔗 언어 공통 로직
    ├── executor-base.ts   # 실행기 인터페이스
    ├── simulator-base.ts  # 시뮬레이터 인터페이스
    └── types/             # 공통 타입
        └── memory.ts      # MemoryBlock, MemoryState 등
```

---

## 📝 상세 작업 계획

### Task 1: 모듈 통합 (executors/c + simulators/c → c/)

#### 1.1 새 디렉토리 생성
```bash
mkdir -p packages/backend/src/modules/c/{handlers,runtime,types}
```

#### 1.2 파일 이동
```bash
# executors/c/ → c/
mv packages/backend/src/modules/executors/c/c-executor.ts \
   packages/backend/src/modules/c/executor.ts

mv packages/backend/src/modules/executors/c/security.ts \
   packages/backend/src/modules/c/security.ts

# simulators/c/ → c/
mv packages/backend/src/modules/simulators/c/handlers/* \
   packages/backend/src/modules/c/handlers/

mv packages/backend/src/modules/simulators/c/runtime/* \
   packages/backend/src/modules/c/runtime/

# memory/ → c/ (C 전용이므로)
mv packages/backend/src/modules/memory/handlers/* \
   packages/backend/src/modules/c/handlers/

mv packages/backend/src/modules/memory/types/* \
   packages/backend/src/modules/c/types/
```

#### 1.3 Import 경로 수정
```typescript
// Before
import { CExecutor } from '../executors/c';
import { CSimulator } from '../simulators/c';

// After
import { CExecutor, CSimulator } from '../c';
```

---

### Task 2: Handler Registry 패턴 도입

#### 2.1 Registry 인터페이스
```typescript
// modules/c/handlers/registry.ts
export interface Handler {
  name: string;
  priority: number;
  canHandle(code: string): boolean;
  handle(code: string, state: RuntimeState): MemoryChange[];
}

export class HandlerRegistry {
  private handlers: Handler[] = [];

  register(handler: Handler) {
    this.handlers.push(handler);
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  getHandler(code: string): Handler | undefined {
    return this.handlers.find(h => h.canHandle(code));
  }

  getAll(): Handler[] {
    return [...this.handlers];
  }
}
```

#### 2.2 핸들러 자동 등록
```typescript
// modules/c/handlers/index.ts
import { HandlerRegistry } from './registry';
import { ArrayHandler } from './array.handler';
import { MallocHandler } from './malloc.handler';
import { PointerHandler } from './pointer.handler';
import { IntHandler } from './int.handler';

export const cHandlerRegistry = new HandlerRegistry();

// 자동 등록 (우선순위 기반)
cHandlerRegistry.register(new MallocHandler());   // priority: 100
cHandlerRegistry.register(new ArrayHandler());    // priority: 90
cHandlerRegistry.register(new PointerHandler());  // priority: 80
cHandlerRegistry.register(new IntHandler());      // priority: 10

export { HandlerRegistry };
export * from './registry';
```

#### 2.3 핸들러 사용
```typescript
// modules/c/simulator.ts
import { cHandlerRegistry } from './handlers';

export class CSimulator {
  simulate(code: string): MemoryChange[] {
    const handler = cHandlerRegistry.getHandler(code);

    if (!handler) {
      throw new Error(`No handler found for: ${code}`);
    }

    return handler.handle(code, this.state);
  }
}
```

---

### Task 3: 공통 인터페이스 추출

#### 3.1 언어 공통 베이스 클래스
```typescript
// modules/shared/executor-base.ts
export interface ExecutorConfig {
  timeout: number;
  memoryLimit: number;
  securityChecks: boolean;
}

export abstract class ExecutorBase {
  protected config: ExecutorConfig;

  abstract execute(code: string): Promise<ExecutionResult>;
  abstract validate(code: string): ValidationResult;

  protected abstract setupSandbox(): void;
  protected abstract cleanup(): void;
}
```

#### 3.2 C Executor 구현
```typescript
// modules/c/executor.ts
import { ExecutorBase, ExecutorConfig } from '../shared/executor-base';

export class CExecutor extends ExecutorBase {
  constructor(config: ExecutorConfig) {
    super(config);
  }

  async execute(code: string): Promise<ExecutionResult> {
    // Docker 실행 로직
  }

  validate(code: string): ValidationResult {
    // C 보안 검사
  }

  protected setupSandbox(): void {
    // Docker 컨테이너 준비
  }

  protected cleanup(): void {
    // 임시 파일 삭제
  }
}
```

#### 3.3 Python Executor 준비 (미래)
```typescript
// modules/python/executor.ts
import { ExecutorBase } from '../shared/executor-base';

export class PythonExecutor extends ExecutorBase {
  // Python 특화 구현
}
```

---

### Task 4: 모듈 Public API 정의

#### 4.1 명확한 Export
```typescript
// modules/c/index.ts
// ✅ Public API (외부에서 사용)
export { CExecutor } from './executor';
export { CSimulator } from './simulator';
export { CTracer } from './tracer';
export { validateCCode } from './security';

// ✅ 타입만 Export
export type {
  CMemoryBlock,
  CMemoryState,
  CMemoryChange,
} from './types';

// ❌ 내부 구현 숨김 (Private)
// - handlers/
// - runtime/
```

#### 4.2 사용 예시
```typescript
// API 라우터에서
import { CExecutor, CSimulator } from '@/modules/c';

const executor = new CExecutor(config);
const result = await executor.execute(code);

const simulator = new CSimulator();
const trace = simulator.simulate(code);
```

---

### Task 5: 테스트 구조 개선

#### 5.1 테스트 파일 위치
```
packages/backend/src/modules/c/
├── executor.ts
├── executor.test.ts        # ✅ 같은 위치
├── simulator.ts
├── simulator.test.ts       # ✅ 같은 위치
└── handlers/
    ├── array.handler.ts
    └── array.handler.test.ts
```

#### 5.2 통합 테스트
```typescript
// modules/c/__tests__/integration.test.ts
import { describe, it, expect } from 'vitest';
import { CExecutor, CSimulator } from '../index';

describe('C Module Integration', () => {
  it('should execute and simulate C code', async () => {
    const code = 'int main() { int x = 10; return 0; }';

    const executor = new CExecutor(config);
    const result = await executor.execute(code);

    const simulator = new CSimulator();
    const trace = simulator.simulate(code);

    expect(result.exitCode).toBe(0);
    expect(trace).toHaveLength(2); // main 진입, x 선언
  });
});
```

---

## 📁 기대 결과

### Before (현재)
```
modules/
├── executors/c/           # ⚠️ 분산
├── simulators/c/          # ⚠️ 분산
└── memory/                # ⚠️ C 전용인데 공통처럼 보임
```

### After (Python 스타일)
```
modules/
├── c/                     # ✨ C 모듈 (통합)
│   ├── index.ts           # Public API
│   ├── executor.ts
│   ├── simulator.ts
│   ├── handlers/
│   │   └── registry.ts    # ✨ 자동 등록
│   └── runtime/
├── python/                # 🐍 미래 확장
│   └── ...
└── shared/                # 🔗 공통 로직
    ├── executor-base.ts
    └── simulator-base.ts
```

---

## ✅ 체크리스트

### Phase 1: 조사 및 설계 (1일)
- [ ] 현재 모듈 의존성 분석 (import 그래프)
- [ ] memory/ 모듈이 C 전용인지 확인
- [ ] Python 구조 참고하여 인터페이스 설계
- [ ] 마이그레이션 순서 결정

### Phase 2: 모듈 통합 (1-2일)
- [ ] `modules/c/` 디렉토리 생성
- [ ] executors/c/ 파일 이동 → c/executor.ts
- [ ] simulators/c/ 파일 이동 → c/simulator.ts
- [ ] memory/ 파일 이동 → c/handlers/, c/types/
- [ ] Import 경로 수정 (전체 프로젝트)
- [ ] 기존 디렉토리 삭제 확인

### Phase 3: Handler Registry (1일)
- [ ] HandlerRegistry 클래스 구현
- [ ] Handler 인터페이스 정의
- [ ] 기존 핸들러를 인터페이스에 맞게 수정
- [ ] 자동 등록 로직 구현 (index.ts)
- [ ] 우선순위 기반 핸들러 선택 테스트

### Phase 4: 공통 인터페이스 (1일)
- [ ] ExecutorBase 추상 클래스 작성
- [ ] SimulatorBase 추상 클래스 작성
- [ ] CExecutor가 ExecutorBase 상속
- [ ] CSimulator가 SimulatorBase 상속
- [ ] modules/shared/ 디렉토리 생성

### Phase 5: 테스트 및 검증 (1일)
- [ ] 단위 테스트 이동 및 실행
- [ ] 통합 테스트 작성
- [ ] API 엔드포인트 테스트 (curl)
- [ ] 프론트엔드 연동 테스트

### Phase 6: 문서화 (반나절)
- [ ] modules/c/README.md 작성
- [ ] CLAUDE.md 업데이트 (디렉토리 구조)
- [ ] 리팩토링 히스토리 기록
- [ ] Python 모듈 확장 가이드 작성

---

## 🚨 주의사항

1. **단계별 커밋**: 각 Phase를 별도 커밋으로 분리
2. **테스트 필수**: 파일 이동 후 즉시 테스트 실행
3. **백업**: `executors/`, `simulators/`, `memory/` 백업 후 진행
4. **Import 일괄 수정**: VS Code 검색/교체 활용
5. **API 호환성**: 외부 API는 변경하지 않기 (내부 구조만)

---

## 📊 우선순위 및 리스크

| Task | 우선순위 | 리스크 | 소요 시간 |
|------|---------|--------|----------|
| 모듈 통합 | 🔴 높음 | 중간 | 1-2일 |
| Handler Registry | 🟡 중간 | 낮음 | 1일 |
| 공통 인터페이스 | 🟡 중간 | 낮음 | 1일 |
| 테스트 정리 | 🟢 낮음 | 낮음 | 1일 |

**총 예상 소요**: 3-5일

---

## 🎯 성공 기준

1. **모듈 명확성**: C 관련 코드가 `modules/c/` 한 곳에만 존재
2. **확장성**: Python 모듈 추가 시 동일한 패턴 적용 가능
3. **테스트 통과**: 모든 단위/통합 테스트 통과
4. **API 호환성**: 기존 API 엔드포인트 정상 작동
5. **문서화**: 새 구조에 대한 명확한 가이드 존재

---

## 🔗 관련 문서

- `.claude/rules/refactor/history.md` - 리팩토링 히스토리
- `docs/architecture/SYSTEM_OVERVIEW.md` - 시스템 구조
- `packages/backend/README.md` - 백엔드 가이드

---

## 💡 미래 확장 예시

### Python 모듈 추가 (Phase 2 이후)
```
modules/
├── c/                     # ✅ 완료
├── python/                # 🆕 추가
│   ├── index.ts
│   ├── executor.ts        # PythonExecutor extends ExecutorBase
│   ├── simulator.ts       # PythonSimulator extends SimulatorBase
│   ├── handlers/
│   │   ├── registry.ts
│   │   ├── list.handler.ts
│   │   └── dict.handler.ts
│   └── runtime/
└── shared/                # 재사용
    ├── executor-base.ts
    └── simulator-base.ts
```

**장점**:
- 공통 인터페이스 재사용
- 핸들러 패턴 동일
- 테스트 구조 일관성
