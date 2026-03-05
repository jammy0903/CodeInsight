# Viz Tab Data-Driven Visibility Plan
Date: 2026-03-05

## 목표

LessonUnifiedView의 시각화 탭(Flow / Memory / JS Memory)을
언어 하드코딩이 아닌 **실제 데이터 유무**로 노출 여부를 결정한다.

---

## 현황 및 문제점

```ts
// LessonUnifiedView.tsx:78-80 (현재)
const showMemoryTab   = languageId === 'c' || languageId === 'cpp'; // 언어만 봄
const showJsMemoryTab = languageId === 'javascript';                 // 언어만 봄
```

- C/C++ 레슨이라도 메모리 데이터가 없으면 Memory 탭이 떠서 텅 빔
- JS 레슨이라도 eventLoop/scope만 있는 레슨(js-1-3 등)에 JS Memory 탭이 불필요하게 노출됨
- 탭이 1개뿐일 때도 탭 바 UI가 표시됨

---

## 데이터 구조 확인 결과

### JS 레슨 필드 분류

| 필드 위치 | 레슨 유형 | 예시 |
|-----------|-----------|------|
| `step.eventLoopState` | event loop (js-1-x, js-4-3 등) | js-1-3 |
| `step.scopeState` | 스코프 체인 (js-2-x 등) | js-2-1 |
| `step.promiseState` | Promise (js-4-x 등) | js-4-1 |
| `step.thisState` | this 바인딩 | js-3-x |
| `step.prototypeState` | 프로토타입 체인 | js-3-x |
| `step.memoryState` (nested stack/heap) | 참조값/객체 레슨 | js-5-x, js-7-x, js-9-x |

→ **JS Memory 탭 필요**: `step.memoryState`가 있는 레슨만 (js-5-x, js-7-1, js-7-3, js-9-1, js-9-2)
→ **Flow 탭만 필요**: 나머지 (eventLoopState/scopeState 등만 있는 레슨)

### C/C++ 레슨 필드

- `step.stack`: top-level 배열 (메모리 스택 프레임)
- `step.heap`: top-level 배열 (힙 변수)
- `step.memoryChanges`: 변경 추적 (있을 수 있음)

---

## 변경 범위

**파일 2개만 수정**

1. `packages/frontend/src/features/courses/utils/visualizationData.ts`
2. `packages/frontend/src/features/courses/components/LessonUnifiedView.tsx`

---

## 구현 명세

### Step 1: visualizationData.ts에 함수 추가

```ts
/**
 * C/C++ Memory 탭 노출 여부 판단
 * - step.stack (top-level 배열, 비어있지 않음)
 * - step.heap (top-level 배열)
 * - step.memoryChanges
 */
export function hasClassicMemoryData(steps: LessonStep[]): boolean {
  return steps.some(step => {
    const s = step as Record<string, unknown>;
    return (
      (Array.isArray(s.stack) && (s.stack as unknown[]).length > 0) ||
      (Array.isArray(s.heap)  && (s.heap  as unknown[]).length > 0) ||
      hasMeaningfulValue(s.memoryChanges)
    );
  });
}

/**
 * JS Memory 탭 노출 여부 판단
 * - step.memoryState (nested {stack, heap}) 가 있으면 참조 그래프 탭 필요
 * - eventLoopState/scopeState 등만 있으면 false
 */
export function hasJsMemoryData(steps: LessonStep[]): boolean {
  return steps.some(step => {
    const s = step as Record<string, unknown>;
    return hasMeaningfulValue(s.memoryState);
  });
}
```

### Step 2: LessonUnifiedView.tsx 수정

```ts
// 추가 import
import { hasMeaningfulValue, hasClassicMemoryData, hasJsMemoryData } from '../utils/visualizationData';

// 기존 (78-80줄)
const showMemoryTab   = languageId === 'c' || languageId === 'cpp';
const showJsMemoryTab = languageId === 'javascript';

// 변경 후 — useMemo로 감싸서 불필요한 재계산 방지
// (nav.vizStepIndices는 useRoundNavigation 내부에서 이미 useMemo로 안정적)
const showMemoryTab = useMemo(
  () => (languageId === 'c' || languageId === 'cpp')
    && hasClassicMemoryData(nav.vizStepIndices.map(i => steps[i])),
  [languageId, nav.vizStepIndices, steps]
);
const showJsMemoryTab = useMemo(
  () => languageId === 'javascript'
    && hasJsMemoryData(nav.vizStepIndices.map(i => steps[i])),
  [languageId, nav.vizStepIndices, steps]
);
```

기존 `useEffect` fallback (130-137줄)은 그대로 유지:
```ts
useEffect(() => {
  if (activeVizTab === 'memory'   && !showMemoryTab)   setActiveVizTab('flow');
  if (activeVizTab === 'jsMemory' && !showJsMemoryTab) setActiveVizTab('flow');
}, [activeVizTab, showMemoryTab, showJsMemoryTab]);
```

---

## 검증 케이스

| 레슨 | 데이터 | 예상 탭 |
|------|--------|---------|
| js-1-3 | eventLoopState만 | Flow 탭만 (탭 바 숨김) |
| js-1-1~1-4, js-4-3 | eventLoopState만 | Flow 탭만 (탭 바 숨김) |
| js-5-1~5-3 | memoryState(stack/heap) | Flow + JS Memory |
| js-7-1, js-7-3, js-9-1, js-9-2 | memoryState(stack/heap) | Flow + JS Memory |
| C 메모리 레슨 | step.stack/heap 있음 | Flow + Memory |
| C 순수 flow 레슨 | step.stack 비어있거나 없음 | Flow 탭만 (탭 바 숨김) |
| C++ 메모리 레슨 | step.stack/heap 있음 | Flow + Memory |
| C 개념 전용 레슨 (전처리기 등) | 모든 viz 스텝 stack/heap 비어있음 | Flow 탭만 (**현재보다 개선**) |
| js-7-2 | memoryState.heap만 있음 (stack 없음) | Flow + JS Memory |

---

## 코드베이스 정밀검사 결과 (2026-03-05)

검사 범위: `useLessonVisualization.ts`, `useRoundNavigation.ts`, 전체 lesson JSON

| 항목 | 결과 |
|------|------|
| `memoryChanges` 필드 존재 여부 | `useLessonVisualization:407`에 분기 존재. 현재 JSON에는 없으나 미래 대비 유지 |
| JS 레슨 top-level `stack` 사용 여부 | 없음. 전부 `step.memoryState.stack` (nested) |
| C/C++ `memoryState` nested 사용 여부 | 없음. 전부 top-level `step.stack`/`step.heap` |
| js-7-2 데이터 구조 | `memoryState.heap` 만 있음. `hasMeaningfulValue(memoryState)` → true ✓ |
| C 개념 전용 레슨 (빈 stack/heap) | Memory 탭 숨김 — 현재보다 나은 동작 |
| Delta format 영향 | 백엔드 seed 시 확장 완료 → 프론트엔드는 항상 완전한 스텝 수신 |
| Carry-forward 영향 | `useLessonVisualization` 내부에서만 동작 → 판별 함수에 무관 |
| `nav.vizStepIndices` 안정성 | `useRoundNavigation` 내 `useMemo([steps])` → 안정적 |
| 성능 | `useMemo` 추가로 스텝 이동마다 불필요한 재계산 제거 |

---

## 완료 기준

- [ ] `hasClassicMemoryData`, `hasJsMemoryData` 함수 추가
- [ ] LessonUnifiedView `showMemoryTab`, `showJsMemoryTab` 데이터 기반으로 교체
- [ ] js-1-3 접속 시 탭 바 없음 확인
- [ ] js-5-1 접속 시 Flow + JS Memory 탭 확인
- [ ] C 메모리 레슨 접속 시 Flow + Memory 탭 확인
- [ ] activeVizTab fallback 정상 동작 확인 (탭 사라질 때 flow로 복귀)
