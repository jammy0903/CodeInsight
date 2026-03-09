import type { LessonStep } from '@/types';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

export function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item));
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return false;
    return entries.some(([, nested]) => hasMeaningfulValue(nested));
  }
  return true;
}

export const VIZ_DATA_FIELDS = [
  'stack', 'heap', 'data', 'memoryState', 'scopeState', 'eventLoopState',
  'promiseState', 'thisState', 'prototypeState', 'callStackState',
  'pythonMemoryState', 'pyNames', 'pyObjects', 'javaMemoryState', 'memoryChanges',
  'algorithmState', 'stdout', 'output', 'conceptVisualizationType', 'conceptState',
] as const;

/**
 * 실제 렌더링 가능한 시각화 payload가 있는지 판단
 * NOTE: navigation round 분기와 달리, visualizationType 문자열만으로는 true 처리하지 않음
 */
export function hasVisualizationPayload(step: LessonStep): boolean {
  const stepRecord = step as UnknownRecord;
  return VIZ_DATA_FIELDS.some((field) => hasMeaningfulValue(stepRecord[field]));
}

export function hasVisualizationData(step: LessonStep): boolean {
  const stepRecord = step as UnknownRecord;
  if (stepRecord.hideVisualization === true) {
    return false;
  }
  if (typeof step.visualizationType === 'string' && step.visualizationType.trim().length > 0) {
    return true;
  }
  return hasVisualizationPayload(step);
}

/**
 * C/C++ Memory 탭 노출 여부 판단
 * viz 스텝 중 하나라도 top-level stack/heap/memoryChanges가 있으면 true
 */
export function hasClassicMemoryData(steps: LessonStep[]): boolean {
  return steps.some(step => {
    const s = step as UnknownRecord;
    return (
      (Array.isArray(s.stack) && (s.stack as unknown[]).length > 0) ||
      (Array.isArray(s.heap)  && (s.heap  as unknown[]).length > 0) ||
      hasMeaningfulValue(s.memoryChanges)
    );
  });
}

/**
 * JS Memory 탭 노출 여부 판단
 * viz 스텝 중 하나라도 step.memoryState (nested {stack,heap})가 있으면 true
 * eventLoopState/scopeState 등만 있는 레슨은 false
 */
export function hasJsMemoryData(steps: LessonStep[]): boolean {
  return steps.some(step => {
    const s = step as UnknownRecord;
    return hasMeaningfulValue(s.memoryState);
  });
}

/**
 * Java Memory 탭 노출 여부 판단
 * viz 스텝 중 하나라도 step.javaMemoryState가 있으면 true
 */
export function hasJavaMemoryData(steps: LessonStep[]): boolean {
  return steps.some(step => {
    const s = step as UnknownRecord;
    return hasMeaningfulValue(s.javaMemoryState);
  });
}
