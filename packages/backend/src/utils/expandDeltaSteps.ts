/**
 * Delta Format Step Expander
 *
 * Lesson JSON의 delta 형식을 full state로 확장합니다.
 *
 * 규칙:
 * 1. 첫 스텝 = 전체 스냅샷 (현재와 동일)
 * 2. 이후 스텝 = 변경된 필드만 기술
 * 3. 없는 필드 = 이전 스텝에서 자동 상속
 * 4. 중첩 객체 (pythonMemoryState 등) = 서브필드 단위 상속
 * 5. 배열 = 항상 전체 교체 (append 아님)
 * 6. null = 명시적으로 제거 (상속하지 않음)
 * 7. visualizationType 변경 시 이전 viz 상태 리셋
 */

/** 시각화 필드 목록 (상속 대상) */
const VIZ_FIELDS = [
  'stack', 'heap', 'stdout',
  'pythonMemoryState', 'javaMemoryState', 'memoryState',
  'eventLoopState', 'scopeState', 'promiseState',
  'thisState', 'prototypeState',
  'memoryChanges', 'callStackState',
  'algorithmState',
] as const;

/** deep merge 대상 (서브필드 단위 상속) */
const DEEP_MERGE_FIELDS = new Set([
  'pythonMemoryState', 'javaMemoryState', 'memoryState',
  'eventLoopState', 'scopeState', 'promiseState',
  'thisState', 'prototypeState',
  'algorithmState',
]);

/**
 * 1단계 shallow merge: 서브필드 단위 상속, 배열은 전체 교체
 */
function shallowMerge(
  prev: Record<string, unknown>,
  curr: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...prev };
  for (const key of Object.keys(curr)) {
    if (curr[key] === null) {
      // null = 명시적 제거
      delete result[key];
    } else {
      result[key] = curr[key];
    }
  }
  return result;
}

/**
 * Delta 형식의 스텝 배열을 full state로 확장합니다.
 */
export function expandDeltaSteps(
  steps: Record<string, unknown>[],
  deltaFormat: boolean,
): Record<string, unknown>[] {
  if (!deltaFormat) return steps;

  const result: Record<string, unknown>[] = [];
  const prevExpanded: Record<string, unknown> = {};
  let prevVizType: unknown = undefined;

  for (const step of steps) {
    const expanded: Record<string, unknown> = { ...step };

    // visualizationType 변경 시 이전 viz 상태 리셋
    if (step.visualizationType !== undefined && step.visualizationType !== prevVizType) {
      for (const field of VIZ_FIELDS) {
        delete prevExpanded[field];
      }
      prevVizType = step.visualizationType;
    }

    for (const field of VIZ_FIELDS) {
      if (expanded[field] === null) {
        // null = 명시적 제거 → 상속하지 않고 expanded에서도 제거
        delete expanded[field];
        delete prevExpanded[field];
      } else if (expanded[field] !== undefined) {
        // 필드가 있음 → deep merge 대상이면 merge, 아니면 교체
        if (
          DEEP_MERGE_FIELDS.has(field) &&
          typeof expanded[field] === 'object' &&
          !Array.isArray(expanded[field])
        ) {
          expanded[field] = shallowMerge(
            (prevExpanded[field] as Record<string, unknown>) || {},
            expanded[field] as Record<string, unknown>,
          );
        }
        prevExpanded[field] = expanded[field];
      } else if (prevExpanded[field] !== undefined) {
        // 필드 없음 → 이전 스텝에서 상속
        expanded[field] = prevExpanded[field];
      }
    }

    result.push(expanded);
  }

  return result;
}
