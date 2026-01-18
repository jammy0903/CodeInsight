# 🎬 Flow Visualizer 설계서 v2

> "코드가 살아 움직이는 시각화" - 개선된 설계
> 마지막 업데이트: 2026-01-18

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1 | 2026-01-18 | 초기 설계 |
| v2 | 2026-01-18 | 타입/성능/확장성 개선 |

---

## v1 대비 개선 사항

| 영역 | v1 문제점 | v2 해결책 |
|------|----------|----------|
| 타입 | `any` 사용, Position 미정의 | Zod 스키마, 엄격한 타입 |
| 성능 | 전체 재계산, 동시 애니메이션 충돌 | 변경 추적, 애니메이션 큐 |
| 아키텍처 | 어댑터 책임 과다 | 책임 분리 (Transformer/Styler/Animator) |
| 확장성 | 하드코딩 enum | 플러그인 레지스트리 |
| 일관성 | 기존 패턴 무시 | Zod, theme prop, 색상 토큰 재사용 |

---

## 🏗️ 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        FlowVisualizer                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FlowCanvas (SVG)                      │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐              │   │
│  │  │ Variable  │ │ Variable  │ │ Terminal  │              │   │
│  │  │   Box     │ │   Box     │ │  Output   │              │   │
│  │  └───────────┘ └───────────┘ └───────────┘              │   │
│  │                                                          │   │
│  │  ┌───────────────────────────────────────┐              │   │
│  │  │       ControlFlow (if/for/func)       │              │   │
│  │  └───────────────────────────────────────┘              │   │
│  │                                                          │   │
│  │  ┌───────────────────────────────────────┐              │   │
│  │  │       AnimationLayer (overlay)        │              │   │
│  │  └───────────────────────────────────────┘              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ Transformer │     │   Styler    │     │  Animator   │
   │ (데이터)    │     │  (시각화)   │     │ (애니메이션)│
   └─────────────┘     └─────────────┘     └─────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  FlowAdapter    │
                    │ (언어별 조합)   │
                    └─────────────────┘
```

---

## 📦 타입 정의 (Zod 스키마)

### 위치: `packages/shared/src/schemas/flow.ts`

```typescript
import { z } from 'zod';

// =============================================
// 기본 타입
// =============================================

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export type Position = z.infer<typeof PositionSchema>;

// 값 타입 (any 대신 명시적 union)
export const FlowValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string(), z.number()])),  // 배열
  z.record(z.string(), z.unknown()),           // 객체 (Python dict 등)
]);

export type FlowValue = z.infer<typeof FlowValueSchema>;

// =============================================
// 변수 (Variable)
// =============================================

export const FlowVariableStateSchema = z.enum([
  'idle',      // 기본 상태
  'creating',  // 생성 중 (애니메이션)
  'updating',  // 값 변경 중
  'reading',   // 읽기 중 (다른 곳에서 참조)
  'deleting',  // 삭제 중 (스코프 종료)
]);

export type FlowVariableState = z.infer<typeof FlowVariableStateSchema>;

export const FlowVariableSchema = z.object({
  id: z.string(),           // 고유 ID (uuid)
  name: z.string(),         // 변수명
  value: FlowValueSchema,   // 값
  type: z.string(),         // 타입 (int, str, etc.)

  // 상태 (애니메이션용)
  state: FlowVariableStateSchema.default('idle'),

  // 스코프 (함수 프레임)
  scope: z.string().default('main'),

  // 언어별 특성 (선택적)
  isReference: z.boolean().optional(),  // Python/Java 참조
  isPointer: z.boolean().optional(),    // C 포인터
  pointsTo: z.string().optional(),      // 가리키는 변수 ID
  address: z.string().optional(),       // C 메모리 주소
});

export type FlowVariable = z.infer<typeof FlowVariableSchema>;

// =============================================
// 애니메이션 (Animation)
// =============================================

// 애니메이션 타입 (확장 가능한 구조)
export const FlowAnimationTypeSchema = z.enum([
  // 값 관련
  'value-appear',   // 값이 나타남
  'value-drop',     // 값이 떨어짐
  'value-copy',     // 값 복사
  'value-fly',      // 값이 날아감 (printf)

  // 박스 관련
  'box-create',     // 박스 생성
  'box-destroy',    // 박스 소멸
  'box-highlight',  // 박스 하이라이트

  // 화살표 관련
  'arrow-draw',     // 화살표 그리기
  'arrow-remove',   // 화살표 제거
  'arrow-redirect', // 화살표 방향 변경

  // 제어 흐름
  'branch-decide',  // 분기 결정
  'loop-iterate',   // 루프 반복
  'frame-enter',    // 함수 진입
  'frame-exit',     // 함수 종료
]);

export type FlowAnimationType = z.infer<typeof FlowAnimationTypeSchema>;

export const FlowAnimationSchema = z.object({
  id: z.string(),
  type: FlowAnimationTypeSchema,

  // 타겟 요소
  targetId: z.string().optional(),      // 애니메이션 대상 변수/요소 ID

  // 위치 (선택적 - 레이아웃에서 계산 가능)
  from: PositionSchema.optional(),
  to: PositionSchema.optional(),

  // 값 (값 이동 애니메이션용)
  value: FlowValueSchema.optional(),

  // 타이밍
  duration: z.number().default(300),    // ms
  delay: z.number().default(0),         // ms
  easing: z.string().default('easeOut'),
});

export type FlowAnimation = z.infer<typeof FlowAnimationSchema>;

// =============================================
// 제어 흐름 (Control Flow)
// =============================================

export const ControlFlowTypeSchema = z.enum([
  'if',
  'else',
  'else-if',
  'for',
  'while',
  'do-while',
  'switch',
  'function-call',
  'function-return',
]);

export type ControlFlowType = z.infer<typeof ControlFlowTypeSchema>;

export const ControlFlowSchema = z.object({
  type: ControlFlowTypeSchema,

  // 조건문
  condition: z.string().optional(),
  conditionResult: z.boolean().optional(),

  // 반복문
  loopIndex: z.number().optional(),
  loopTotal: z.number().optional(),

  // 함수
  functionName: z.string().optional(),
  arguments: z.array(FlowValueSchema).optional(),
  returnValue: FlowValueSchema.optional(),
});

export type ControlFlow = z.infer<typeof ControlFlowSchema>;

// =============================================
// 터미널 출력
// =============================================

export const TerminalOutputSchema = z.object({
  text: z.string(),
  fromVariableId: z.string().optional(),  // 출력 소스
  timestamp: z.number().optional(),
});

export type TerminalOutput = z.infer<typeof TerminalOutputSchema>;

// =============================================
// FlowStep (한 스텝의 전체 정보)
// =============================================

export const FlowStepSchema = z.object({
  id: z.string(),
  line: z.number(),
  code: z.string(),

  // 현재 상태
  variables: z.array(FlowVariableSchema),

  // 이번 스텝의 애니메이션들
  animations: z.array(FlowAnimationSchema),

  // 제어 흐름 (선택적)
  controlFlow: ControlFlowSchema.optional(),

  // 터미널 출력 (선택적)
  terminalOutput: TerminalOutputSchema.optional(),

  // 함수 프레임들 (콜스택)
  frames: z.array(z.object({
    name: z.string(),
    variableIds: z.array(z.string()),  // 이 프레임의 변수 ID들
  })).default([{ name: 'main', variableIds: [] }]),
});

export type FlowStep = z.infer<typeof FlowStepSchema>;
```

---

## 🎨 스타일 시스템

### 위치: `packages/frontend/src/features/visualizers/flow/styles.ts`

```typescript
// 기존 CMemoryView의 색상 체계와 일관성 유지

export const FLOW_THEMES = {
  light: {
    // 변수 박스
    box: {
      background: '#ffffff',
      border: '#e5d5c7',
      label: '#6b5a4a',
      value: '#2563eb',
      type: '#9ca3af',
    },

    // 상태별 색상
    states: {
      idle: { border: '#e5d5c7' },
      creating: { border: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' },
      updating: { border: '#eab308', glow: 'rgba(234, 179, 8, 0.3)' },
      reading: { border: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
      deleting: { border: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
    },

    // 제어 흐름
    control: {
      truePath: '#22c55e',
      falsePath: '#ef4444',
      loop: '#8b5cf6',
      function: '#f97316',
    },

    // 터미널
    terminal: {
      background: '#1e1e1e',
      text: '#d4d4d4',
      cursor: '#ffffff',
    },

    // 화살표
    arrow: {
      stroke: '#6b5a4a',
      head: '#6b5a4a',
    },
  },

  dark: {
    // Playground용 다크 테마
    box: {
      background: '#2d3748',
      border: '#4a5568',
      label: '#e2e8f0',
      value: '#63b3ed',
      type: '#a0aec0',
    },
    // ... (생략, light와 동일 구조)
  },
} as const;

export type FlowTheme = keyof typeof FLOW_THEMES;

// 크기 상수
export const FLOW_SIZES = {
  box: {
    width: 80,
    height: 60,
    padding: 8,
    borderRadius: 8,
  },
  arrow: {
    strokeWidth: 2,
    headSize: 8,
  },
  font: {
    label: 12,
    value: 18,
    type: 10,
  },
  spacing: {
    boxGap: 16,
    frameGap: 24,
  },
} as const;
```

---

## 🔄 애니메이션 시스템

### 애니메이션 큐 (순차 실행)

```typescript
// hooks/useAnimationQueue.ts

interface QueuedAnimation {
  id: string;
  animation: FlowAnimation;
  status: 'pending' | 'playing' | 'completed';
}

export function useAnimationQueue() {
  const [queue, setQueue] = useState<QueuedAnimation[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const add = useCallback((animation: FlowAnimation) => {
    setQueue(prev => [...prev, {
      id: crypto.randomUUID(),
      animation,
      status: 'pending',
    }]);
  }, []);

  const addBatch = useCallback((animations: FlowAnimation[]) => {
    // 같은 시점에 실행될 애니메이션들
    const batched = animations.map(a => ({
      id: crypto.randomUUID(),
      animation: a,
      status: 'pending' as const,
    }));
    setQueue(prev => [...prev, ...batched]);
  }, []);

  const play = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);

    // delay 기준으로 그룹화하여 순차 실행
    const grouped = groupByDelay(queue);

    for (const group of grouped) {
      await Promise.all(
        group.map(item => playAnimation(item.animation))
      );
    }

    setIsPlaying(false);
    setQueue([]);
  }, [queue, isPlaying]);

  const clear = useCallback(() => {
    setQueue([]);
  }, []);

  return { queue, add, addBatch, play, clear, isPlaying };
}
```

### 변경 감지 최적화

```typescript
// hooks/useFlowDiff.ts

export function useFlowDiff(
  prevStep: FlowStep | null,
  currentStep: FlowStep
): FlowDiff {
  return useMemo(() => {
    if (!prevStep) {
      // 첫 스텝: 모든 변수가 새로 생성
      return {
        created: currentStep.variables.map(v => v.id),
        updated: [],
        deleted: [],
        unchanged: [],
      };
    }

    const prevIds = new Set(prevStep.variables.map(v => v.id));
    const currIds = new Set(currentStep.variables.map(v => v.id));

    const created: string[] = [];
    const updated: string[] = [];
    const deleted: string[] = [];
    const unchanged: string[] = [];

    // 생성된 변수
    currentStep.variables.forEach(v => {
      if (!prevIds.has(v.id)) {
        created.push(v.id);
      } else {
        const prev = prevStep.variables.find(p => p.id === v.id);
        if (prev && prev.value !== v.value) {
          updated.push(v.id);
        } else {
          unchanged.push(v.id);
        }
      }
    });

    // 삭제된 변수
    prevStep.variables.forEach(v => {
      if (!currIds.has(v.id)) {
        deleted.push(v.id);
      }
    });

    return { created, updated, deleted, unchanged };
  }, [prevStep, currentStep]);
}
```

---

## 🔌 어댑터 시스템 (책임 분리)

### 디렉토리 구조

```
features/visualizers/flow/
├── adapters/
│   ├── base/
│   │   ├── IFlowTransformer.ts    # 데이터 변환 인터페이스
│   │   ├── IFlowStyler.ts         # 스타일 인터페이스
│   │   └── IFlowAnimator.ts       # 애니메이션 생성 인터페이스
│   ├── c/
│   │   ├── CTransformer.ts        # LessonStep → FlowStep
│   │   ├── CStyler.ts             # C 전용 스타일
│   │   └── CAnimator.ts           # C 전용 애니메이션
│   ├── python/
│   │   ├── PythonTransformer.ts
│   │   ├── PythonStyler.ts
│   │   └── PythonAnimator.ts
│   └── java/
│       └── ...
```

### 인터페이스 정의

```typescript
// adapters/base/IFlowTransformer.ts

import type { LessonStep } from '@codeinsight/shared';
import type { FlowStep, FlowVariable } from '../../../types';

export interface IFlowTransformer {
  /**
   * LessonStep → FlowStep 변환
   * @param step 현재 스텝
   * @param prevStep 이전 스텝 (변경 감지용)
   */
  transform(step: LessonStep, prevStep?: LessonStep): FlowStep;

  /**
   * 메모리 변경 → FlowVariable 변환
   */
  toVariable(memoryChange: MemoryChange): FlowVariable;
}

// adapters/base/IFlowStyler.ts

export interface IFlowStyler {
  /**
   * 변수의 시각적 스타일 결정
   */
  getBoxStyle(variable: FlowVariable, state: FlowVariableState): BoxStyle;

  /**
   * 화살표 스타일 (포인터/참조용)
   */
  getArrowStyle(from: FlowVariable, to: FlowVariable): ArrowStyle;

  /**
   * 언어별 특수 표시 (예: Python은 모든 변수에 화살표)
   */
  shouldShowArrow(variable: FlowVariable): boolean;
}

// adapters/base/IFlowAnimator.ts

export interface IFlowAnimator {
  /**
   * 변수 생성 시 애니메이션
   */
  createVariableAnimations(variable: FlowVariable): FlowAnimation[];

  /**
   * 값 변경 시 애니메이션
   */
  updateVariableAnimations(
    variable: FlowVariable,
    oldValue: FlowValue,
    newValue: FlowValue
  ): FlowAnimation[];

  /**
   * 출력 시 애니메이션 (printf 등)
   */
  outputAnimations(variable: FlowVariable, output: string): FlowAnimation[];
}
```

### C 언어 구현 예시

```typescript
// adapters/c/CTransformer.ts

export class CTransformer implements IFlowTransformer {
  transform(step: LessonStep, prevStep?: LessonStep): FlowStep {
    const variables: FlowVariable[] = [];

    // Stack 변수 처리
    step.stack?.forEach(block => {
      variables.push({
        id: `stack-${block.name}`,
        name: block.name,
        value: this.parseValue(block.value),
        type: block.type || 'int',
        state: 'idle',
        scope: 'main',  // TODO: 함수별 스코프 파싱
        isPointer: block.type?.includes('*'),
        pointsTo: block.points_to || undefined,
        address: block.address,
      });
    });

    // Heap 변수 처리
    step.heap?.forEach(block => {
      variables.push({
        id: `heap-${block.address}`,
        name: block.name || `*ptr`,
        value: this.parseValue(block.value),
        type: block.type || 'void*',
        state: 'idle',
        scope: 'heap',
        address: block.address,
      });
    });

    return {
      id: `step-${step.step}`,
      line: step.line,
      code: step.code || '',
      variables,
      animations: [],  // Animator가 채움
      frames: [{ name: 'main', variableIds: variables.map(v => v.id) }],
    };
  }

  private parseValue(value: string): FlowValue {
    // "10" → 10, "hello" → "hello"
    const num = Number(value);
    return isNaN(num) ? value : num;
  }

  toVariable(change: MemoryChange): FlowVariable {
    // memoryChanges 형식 처리
    return {
      id: `var-${change.name}`,
      name: change.name,
      value: change.value ?? 'undefined',
      type: change.type || 'unknown',
      state: this.mapActionToState(change.action),
      scope: change.scope || 'main',
    };
  }

  private mapActionToState(action: string): FlowVariableState {
    switch (action) {
      case 'allocate': return 'creating';
      case 'update': return 'updating';
      case 'free':
      case 'deallocate': return 'deleting';
      default: return 'idle';
    }
  }
}
```

---

## 🧩 컴포넌트 구조

### 메인 컴포넌트

```typescript
// FlowVisualizer.tsx

interface FlowVisualizerProps {
  step: LessonStep;
  prevStep?: LessonStep;
  language: 'c' | 'python' | 'java';
  theme?: FlowTheme;
  onVariableClick?: (variable: FlowVariable) => void;
}

export const FlowVisualizer = memo(function FlowVisualizer({
  step,
  prevStep,
  language,
  theme = 'light',
  onVariableClick,
}: FlowVisualizerProps) {
  // 1. 어댑터 선택
  const adapter = useMemo(() => getAdapter(language), [language]);

  // 2. 데이터 변환
  const flowStep = useMemo(
    () => adapter.transformer.transform(step, prevStep),
    [adapter, step, prevStep]
  );

  // 3. 변경 감지
  const diff = useFlowDiff(
    prevStep ? adapter.transformer.transform(prevStep) : null,
    flowStep
  );

  // 4. 애니메이션 생성
  const animations = useMemo(
    () => adapter.animator.createAnimationsFromDiff(diff, flowStep),
    [adapter, diff, flowStep]
  );

  // 5. 애니메이션 큐
  const animQueue = useAnimationQueue();

  useEffect(() => {
    animQueue.addBatch(animations);
    animQueue.play();
  }, [animations]);

  // 6. 레이아웃 계산 (CSS Grid 기반, JS 계산 최소화)
  const layout = useFlowLayout(flowStep);

  return (
    <div className={cn('flow-visualizer', `theme-${theme}`)}>
      <FlowCanvas>
        {/* 함수 프레임들 */}
        {flowStep.frames.map(frame => (
          <FunctionFrame key={frame.name} frame={frame} theme={theme}>
            {/* 변수 박스들 */}
            {frame.variableIds.map(id => {
              const variable = flowStep.variables.find(v => v.id === id);
              if (!variable) return null;

              return (
                <VariableBox
                  key={id}
                  variable={variable}
                  style={adapter.styler.getBoxStyle(variable, variable.state)}
                  isNew={diff.created.includes(id)}
                  isUpdated={diff.updated.includes(id)}
                  isDeleting={diff.deleted.includes(id)}
                  onClick={() => onVariableClick?.(variable)}
                />
              );
            })}
          </FunctionFrame>
        ))}

        {/* 화살표 (포인터/참조) */}
        <ArrowLayer
          variables={flowStep.variables}
          styler={adapter.styler}
        />

        {/* 터미널 출력 */}
        {flowStep.terminalOutput && (
          <TerminalOutput output={flowStep.terminalOutput} theme={theme} />
        )}

        {/* 제어 흐름 시각화 */}
        {flowStep.controlFlow && (
          <ControlFlowOverlay
            controlFlow={flowStep.controlFlow}
            theme={theme}
          />
        )}

        {/* 애니메이션 레이어 */}
        <AnimationLayer
          animations={animQueue.queue}
          isPlaying={animQueue.isPlaying}
        />
      </FlowCanvas>
    </div>
  );
});
```

### 변수 박스 컴포넌트

```typescript
// components/VariableBox.tsx

interface VariableBoxProps {
  variable: FlowVariable;
  style: BoxStyle;
  isNew: boolean;
  isUpdated: boolean;
  isDeleting: boolean;
  onClick?: () => void;
}

export const VariableBox = memo(function VariableBox({
  variable,
  style,
  isNew,
  isUpdated,
  isDeleting,
  onClick,
}: VariableBoxProps) {
  // 상태에 따른 애니메이션 variants
  const variants = {
    initial: isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    highlight: {
      boxShadow: `0 0 12px ${style.glow}`,
      transition: { repeat: 2, duration: 0.3 },
    },
  };

  return (
    <motion.div
      className="variable-box"
      style={{
        backgroundColor: style.background,
        borderColor: style.border,
      }}
      variants={variants}
      initial="initial"
      animate={isUpdated ? 'highlight' : 'animate'}
      exit="exit"
      onClick={onClick}
      layout  // 위치 변경 시 자동 애니메이션
    >
      {/* 변수명 (라벨) */}
      <span className="variable-label" style={{ color: style.label }}>
        {variable.name}
      </span>

      {/* 값 */}
      <AnimatePresence mode="wait">
        <motion.span
          key={String(variable.value)}
          className="variable-value"
          style={{ color: style.value }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
        >
          {formatValue(variable.value)}
        </motion.span>
      </AnimatePresence>

      {/* 타입 (선택적) */}
      <span className="variable-type" style={{ color: style.type }}>
        {variable.type}
      </span>

      {/* 주소 (C언어, 선택적) */}
      {variable.address && (
        <span className="variable-address">
          {variable.address}
        </span>
      )}
    </motion.div>
  );
});
```

---

## 📋 구현 순서 (개선)

### Phase 1: 기반 + 타입 (1주)

| 작업 | 산출물 | 의존성 |
|------|--------|--------|
| Zod 스키마 정의 | `shared/schemas/flow.ts` | - |
| 스타일 토큰 | `flow/styles.ts` | - |
| FlowVisualizer 기본 | `FlowVisualizer.tsx` | 스키마 |
| VariableBox | `components/VariableBox.tsx` | 스타일 |
| useAnimationQueue | `hooks/useAnimationQueue.ts` | - |
| useFlowDiff | `hooks/useFlowDiff.ts` | 스키마 |

### Phase 2: C언어 어댑터 (1주)

| 작업 | 산출물 | 의존성 |
|------|--------|--------|
| CTransformer | `adapters/c/CTransformer.ts` | Phase 1 |
| CStyler | `adapters/c/CStyler.ts` | Phase 1 |
| CAnimator | `adapters/c/CAnimator.ts` | Phase 1 |
| 포인터 화살표 | `components/ArrowLayer.tsx` | CStyler |
| 테스트 | `__tests__/CAdapter.test.ts` | - |

### Phase 3: 제어 흐름 (1주)

| 작업 | 산출물 | 의존성 |
|------|--------|--------|
| FunctionFrame | `components/FunctionFrame.tsx` | Phase 1 |
| ControlFlowOverlay | `components/ControlFlowOverlay.tsx` | Phase 1 |
| TerminalOutput | `components/TerminalOutput.tsx` | Phase 1 |
| LoopTrack (for/while) | `components/LoopTrack.tsx` | Phase 1 |

### Phase 4: Python + Java (2주)

| 작업 | 산출물 | 의존성 |
|------|--------|--------|
| PythonTransformer | `adapters/python/` | Phase 1 |
| PythonStyler (참조 화살표) | `adapters/python/` | Phase 1 |
| JavaTransformer | `adapters/java/` | Phase 1 |
| 원시/참조 구분 스타일 | `adapters/java/` | Phase 1 |

### Phase 5: 통합 + 최적화 (1주)

| 작업 | 산출물 | 의존성 |
|------|--------|--------|
| LessonPage 통합 | 뷰어 탭 전환 | Phase 1-4 |
| Playground 통합 | variant prop | Phase 1-4 |
| 성능 프로파일링 | 벤치마크 결과 | - |
| 메모이제이션 최적화 | - | 프로파일링 |

---

## 📊 성능 체크리스트

- [ ] `React.memo` 적용 (VariableBox, Arrow 등)
- [ ] `useMemo` 적용 (flowStep 변환, diff 계산)
- [ ] `useCallback` 적용 (이벤트 핸들러)
- [ ] AnimatePresence로 exit 애니메이션 처리
- [ ] layout prop으로 CSS 기반 위치 애니메이션
- [ ] 변수 20개 이상 시 가상화 고려 (react-window)
- [ ] SVG 최적화 (will-change, transform3d)

---

## 🧪 테스트 계획

```typescript
// __tests__/CTransformer.test.ts

describe('CTransformer', () => {
  it('should transform stack variables', () => {
    const step: LessonStep = {
      step: 1,
      line: 5,
      stack: [
        { name: 'a', value: '10', type: 'int', address: '0x7fff' },
      ],
      heap: [],
    };

    const result = transformer.transform(step);

    expect(result.variables).toHaveLength(1);
    expect(result.variables[0].name).toBe('a');
    expect(result.variables[0].value).toBe(10);  // 숫자로 변환됨
  });

  it('should detect variable creation', () => {
    const prev: FlowStep = { variables: [] };
    const curr: FlowStep = { variables: [{ id: 'a', ... }] };

    const diff = calculateDiff(prev, curr);

    expect(diff.created).toContain('a');
  });
});
```

---

## 📚 참고 자료

- [Framer Motion - 성능 최적화](https://www.framer.com/motion/guide-reduce-bundle-size/)
- [React 렌더링 최적화](https://react.dev/reference/react/memo)
- [SVG 애니메이션 성능](https://css-tricks.com/tips-for-smooth-svg-animation/)
