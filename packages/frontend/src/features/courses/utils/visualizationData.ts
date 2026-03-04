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

export function hasVisualizationData(step: LessonStep): boolean {
  const stepRecord = step as UnknownRecord;
  if (step.visualizationType === 'terminal') {
    return true;
  }
  return VIZ_DATA_FIELDS.some((field) => hasMeaningfulValue(stepRecord[field]));
}

