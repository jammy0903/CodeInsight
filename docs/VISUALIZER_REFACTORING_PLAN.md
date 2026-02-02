# Visualizer Architecture Refactoring Plan

## 현재 구조 문제점

```
visualizers/
├── c/CMemoryView.tsx           # C 전용 (Playground용)
├── java/JavaMemoryView.tsx     # Java 전용
├── memory/                     # 또 다른 통합 시도
│   ├── LessonMemoryVisualizer  # switch문으로 분기
│   └── adapters/               # C, Java 어댑터
├── flow/                       # 잘 설계된 어댑터 패턴
│   └── adapters/               # 모든 언어 지원
└── shared/                     # 공유 컴포넌트
```

### 문제점 요약

1. **중복**: `c/`, `java/`, `memory/`에 유사한 로직 존재
2. **switch문**: `LessonMemoryVisualizer`에서 언어별 분기 (OCP 위반)
3. **비일관성**: Flow는 어댑터 패턴, Memory는 직접 분기
4. **확장성 부족**: 새 언어 추가 시 여러 곳 수정 필요

---

## 제안: 통합 아키텍처

```
visualizers/
├── core/                           # 시각화 엔진 (렌더링만 담당)
│   ├── FlowEngine/
│   │   ├── FlowVisualizer.tsx      # 범용 플로우 렌더러
│   │   ├── components/
│   │   │   ├── VariableBox.tsx
│   │   │   ├── FunctionFrame.tsx
│   │   │   ├── ArrowLayer.tsx
│   │   │   └── ControlFlowOverlay.tsx
│   │   └── hooks/
│   │
│   ├── MemoryEngine/
│   │   ├── MemoryVisualizer.tsx    # 범용 메모리 렌더러
│   │   └── components/
│   │       ├── StackSegment.tsx
│   │       ├── HeapBlock.tsx
│   │       ├── PointerArrow.tsx
│   │       └── RegisterView.tsx
│   │
│   └── shared/                     # 엔진 간 공유
│       ├── TerminalOutput.tsx
│       ├── CallStackView.tsx
│       └── animations/
│
├── adapters/                       # 데이터 변환 (언어별)
│   ├── types.ts                    # 공통 인터페이스
│   │   - IFlowAdapter
│   │   - IMemoryAdapter
│   │   - IVisualizerAdapter (Flow + Memory 통합)
│   │
│   ├── c/
│   │   ├── CFlowAdapter.ts
│   │   ├── CMemoryAdapter.ts
│   │   └── index.ts               # 통합 export
│   │
│   ├── java/
│   │   ├── JavaFlowAdapter.ts
│   │   ├── JavaMemoryAdapter.ts
│   │   └── index.ts
│   │
│   ├── python/
│   │   ├── PythonFlowAdapter.ts
│   │   ├── PythonMemoryAdapter.ts  # null 반환 또는 간소화 버전
│   │   └── index.ts
│   │
│   ├── javascript/
│   │   └── ...
│   │
│   └── registry.ts                 # 어댑터 레지스트리
│
├── presets/                        # 언어별 조합 (진입점)
│   ├── UnifiedVisualizer.tsx       # 단일 진입점 (권장)
│   ├── CVisualizer.tsx             # C: Flow + Memory
│   ├── JavaVisualizer.tsx          # Java: Flow + Memory
│   ├── PythonVisualizer.tsx        # Python: Flow only
│   └── JSVisualizer.tsx            # JS: Flow only
│
└── index.ts                        # 통합 export
```

---

## 핵심 설계 원칙

### 1. 단일 데이터 구조 (백엔드)

```typescript
// packages/shared/src/types/simulator.ts
interface SimulatorResult {
  language: string;
  steps: SimulatorStep[];
}

interface SimulatorStep {
  line: number;
  code: string;

  // 모든 언어 공통
  variables: Variable[];
  callStack: StackFrame[];
  stdout?: string;

  // 메모리 관리 언어만 (C, Java)
  memory?: {
    stack: MemoryBlock[];
    heap: MemoryBlock[];
    registers?: Register[];  // C only
  };

  // 제어 흐름
  controlFlow?: ControlFlow;
}
```

### 2. 어댑터 인터페이스

```typescript
// adapters/types.ts
interface IVisualizerAdapter {
  readonly language: string;

  // Flow 변환
  toFlowStep(step: SimulatorStep, prev?: SimulatorStep): FlowRenderData;

  // Memory 변환 (없으면 null)
  toMemoryState(step: SimulatorStep, prev?: SimulatorStep): MemoryRenderData | null;

  // 스타일
  getFlowStyles(): FlowStyleConfig;
  getMemoryStyles(): MemoryStyleConfig;

  // 애니메이션
  getAnimations(diff: StepDiff): Animation[];
}
```

### 3. 단일 진입점

```tsx
// presets/UnifiedVisualizer.tsx
interface UnifiedVisualizerProps {
  language: string;
  step: SimulatorStep;
  prevStep?: SimulatorStep;
  mode: 'flow' | 'memory' | 'split';  // 표시 모드
  theme: 'light' | 'dark';
}

export function UnifiedVisualizer({ language, step, prevStep, mode, theme }: Props) {
  const adapter = useAdapter(language, theme);

  const flowData = useMemo(() => adapter.toFlowStep(step, prevStep), [step, prevStep]);
  const memoryData = useMemo(() => adapter.toMemoryState(step, prevStep), [step, prevStep]);

  return (
    <div className="unified-visualizer">
      {(mode === 'flow' || mode === 'split') && (
        <FlowEngine data={flowData} styles={adapter.getFlowStyles()} />
      )}
      {(mode === 'memory' || mode === 'split') && memoryData && (
        <MemoryEngine data={memoryData} styles={adapter.getMemoryStyles()} />
      )}
    </div>
  );
}
```

---

## 확장성 이점

### 새 언어 추가 시 (예: Rust)

```typescript
// adapters/rust/index.ts
export const rustAdapter: IVisualizerAdapter = {
  language: 'rust',

  toFlowStep(step) {
    // Rust 특화: ownership, borrowing 시각화
    return { ... };
  },

  toMemoryState(step) {
    // Rust: Stack + Heap + Ownership 표시
    return { ... };
  },

  // ...
};

// registry.ts에 등록만 하면 끝
registerAdapter('rust', rustAdapter);
```

### 시각화 모드 추가 시

```typescript
// core/OwnershipEngine/ (Rust용 새 엔진)
// presets/RustVisualizer.tsx에서 조합
```

---

## 성능 최적화

### Lazy Loading

```typescript
// presets/index.ts
export const CVisualizer = lazy(() => import('./CVisualizer'));
export const JavaVisualizer = lazy(() => import('./JavaVisualizer'));
export const PythonVisualizer = lazy(() => import('./PythonVisualizer'));
export const JSVisualizer = lazy(() => import('./JSVisualizer'));

// 어댑터도 lazy
const adapterLoaders = {
  c: () => import('./adapters/c'),
  java: () => import('./adapters/java'),
  python: () => import('./adapters/python'),
  javascript: () => import('./adapters/javascript'),
};
```

### Memoization

```typescript
// 어댑터 결과 캐싱
const flowData = useMemo(
  () => adapter.toFlowStep(step, prevStep),
  [step.id, prevStep?.id]  // step 전체가 아닌 id만 의존성으로
);
```

---

## 마이그레이션 전략

### Phase 1: adapters/ 통합 (Week 1)

```
목표: 모든 어댑터를 단일 폴더로 통합

작업:
1. adapters/types.ts 생성 (공통 인터페이스)
2. flow/adapters/* → adapters/로 이동
3. memory/adapters/* → adapters/로 병합
4. registry.ts 생성

결과:
adapters/
├── types.ts
├── c/
├── java/
├── python/
├── javascript/
└── registry.ts
```

### Phase 2: core/ 엔진 분리 (Week 2)

```
목표: 렌더링 로직을 언어 독립적으로 분리

작업:
1. FlowVisualizer → core/FlowEngine/
2. 메모리 컴포넌트 → core/MemoryEngine/
3. 공유 컴포넌트 → core/shared/

결과:
core/
├── FlowEngine/
├── MemoryEngine/
└── shared/
```

### Phase 3: presets/ 생성 (Week 3)

```
목표: 언어별 진입점 생성

작업:
1. UnifiedVisualizer 구현
2. CVisualizer, JavaVisualizer 등 생성
3. 기존 페이지에서 점진적 교체

결과:
presets/
├── UnifiedVisualizer.tsx
├── CVisualizer.tsx
├── JavaVisualizer.tsx
├── PythonVisualizer.tsx
└── JSVisualizer.tsx
```

### Phase 4: 레거시 제거 (Week 4)

```
목표: 기존 중복 코드 삭제

작업:
1. c/, java/, memory/ 폴더 삭제
2. import 경로 전체 업데이트
3. 테스트 검증

최종 구조:
visualizers/
├── core/
├── adapters/
├── presets/
└── index.ts
```

---

## 설계 원칙 요약

| 원칙 | 적용 |
|------|------|
| **단일 책임 (SRP)** | 엔진(렌더링) / 어댑터(변환) / 프리셋(조합) 분리 |
| **개방-폐쇄 (OCP)** | 새 언어는 어댑터만 추가, 기존 코드 수정 불필요 |
| **의존성 역전 (DIP)** | 엔진은 인터페이스에 의존, 구체 어댑터에 의존 안 함 |
| **인터페이스 분리 (ISP)** | IFlowAdapter, IMemoryAdapter 분리 |

---

## 예상 효과

1. **코드 중복 제거**: ~40% 코드량 감소
2. **새 언어 추가 시간**: 2-3일 → 0.5일
3. **테스트 용이성**: 각 레이어 독립 테스트
4. **번들 크기**: 언어별 lazy loading으로 초기 로드 감소
5. **유지보수**: 버그 수정 시 한 곳만 수정

---

## 참고: 현재 파일 매핑

| 현재 | → | 새 위치 |
|------|---|---------|
| `flow/FlowVisualizer.tsx` | → | `core/FlowEngine/FlowVisualizer.tsx` |
| `flow/components/*` | → | `core/FlowEngine/components/` |
| `flow/adapters/c/*` | → | `adapters/c/` |
| `flow/adapters/python/*` | → | `adapters/python/` |
| `c/CMemoryView.tsx` | → | `core/MemoryEngine/` (통합) |
| `java/JavaMemoryView.tsx` | → | `core/MemoryEngine/` (통합) |
| `memory/adapters/*` | → | `adapters/` (병합) |
| `shared/*` | → | `core/shared/` |
