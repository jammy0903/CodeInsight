import { useMemo } from 'react';
import type { LessonStep, StepMemoryState, StackFrame, Variable, HeapObject } from '@/types';
import { processMemoryChanges } from '../utils/memoryUtils';
import type { MemoryBlock } from '@/types/memory';
import { extractCFrames, normalizeCValue, isStructValue, isCharArrayValue } from '../components/memory/utils/memoryHelpers';
import { hasMeaningfulValue, hasVisualizationData, VIZ_DATA_FIELDS } from '../utils/visualizationData';

// JavaScript visualization types (inlined from legacy - kept for backwards compatibility)
type JSVisualizationType = 'memory' | 'callStack' | 'scopeChain' | 'eventLoop' | 'closure' | 'prototype' | 'thisBind' | 'hoisting' | 'promise';
type JSVisualizationState = Record<string, unknown>; // Simplified - legacy visualization states no longer rendered

// The return type of the hook
interface UseLessonVisualizationResult {
  memoryState: {
    stack: MemoryBlock[];
    heap: MemoryBlock[];
    frames: { name: string }[];
  } | null;
  changedBlocks: { stack: string[]; heap: string[] };
  visualizationType: JSVisualizationType | 'python' | 'java' | 'memory' | string;
  visualizationState: unknown;
}

const INITIAL_MEMORY_STATE = { stack: [], heap: [], frames: [] };
const INITIAL_CHANGED_BLOCKS = { stack: [], heap: [] };
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function adaptMemoryState(memoryState: StepMemoryState): { stack: MemoryBlock[], heap: MemoryBlock[], frames: { name: string }[] } {
  const newStack: MemoryBlock[] = [];
  memoryState.stack.forEach((frame: StackFrame) => {
    frame.variables.forEach((variable: Variable) => {
      newStack.push({
        name: `${frame.name}.${variable.name}`,
        address: variable.address || '???',
        value: String(variable.value),
        type: variable.type,
        points_to: variable.ref
      });
    });
  });

  const newHeap: MemoryBlock[] = memoryState.heap.map((heapObj: HeapObject) => ({
    name: heapObj.id,
    address: heapObj.address || '???',
    value: String(heapObj.value),
    type: heapObj.type,
  }));

  const frames = memoryState.stack.map(f => ({ name: f.name }));

  return { stack: newStack, heap: newHeap, frames };
}

// 이전 스텝에서 시각화 데이터 상속 (캐리포워드)
function resolveStepWithInheritance(steps: LessonStep[], currentIndex: number): LessonStep {
  const currentStep = steps[currentIndex];
  if (!currentStep || hasVisualizationData(currentStep)) return currentStep;

  const currentVizType = currentStep.visualizationType || 'memory';
  const currentStepRecord = currentStep as UnknownRecord;

  // 같은 vizType을 가진 가장 가까운 이전 스텝에서 상속
  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevStep = steps[i];
    const prevVizType = prevStep.visualizationType || 'memory';
    if (prevVizType === currentVizType && hasVisualizationData(prevStep)) {
      const prevStepRecord = prevStep as UnknownRecord;
      const vizFields: Record<string, unknown> = {};
      for (const field of VIZ_DATA_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(currentStepRecord, field)) {
          continue;
        }
        if (hasMeaningfulValue(prevStepRecord[field])) {
          vizFields[field] = prevStepRecord[field];
        }
      }
      return { ...currentStep, ...vizFields };
    }
  }

  return currentStep;
}

export function useLessonVisualization(
  steps: LessonStep[],
  currentStepIndex: number
): UseLessonVisualizationResult {
  const currentStep = steps?.[currentStepIndex];

  const result = useMemo((): UseLessonVisualizationResult => {
    if (!steps || !currentStep) {
      return {
        memoryState: INITIAL_MEMORY_STATE,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'memory',
        visualizationState: null,
      };
    }

    // 캐리포워드: 시각화 데이터 없으면 이전 스텝에서 상속
    const resolvedStep = resolveStepWithInheritance(steps, currentStepIndex);
    const vizType = resolvedStep.visualizationType || 'memory';

    if (vizType === 'javascript') {
      const stack: MemoryBlock[] = [];
      const frames: { name: string }[] = [];
      const resolvedStepRecord = resolvedStep as UnknownRecord;
      const rawStack = asArray(resolvedStepRecord.stack);

      if (rawStack.length > 0) {
        rawStack.forEach(frame => {
          const frameRecord = isRecord(frame) ? frame : undefined;
          const variablesRecord = isRecord(frameRecord?.variables) ? frameRecord.variables : undefined;
          // 백엔드는 methodName을 사용함 (functionName이 아님!)
          const frameName = asString(frameRecord?.methodName) || asString(frameRecord?.functionName) || '__main__';
          frames.push({ name: frameName });

          if (variablesRecord) {
            Object.entries(variablesRecord).forEach(([name, value]) => {
              stack.push({
                name: `${frameName}.${name}`,
                address: '',
                value: stringifyValue(value),
                type: typeof value,
              });
            });
          }
        });
      }

      const heap: MemoryBlock[] = asArray(resolvedStepRecord.heap).map(item => {
        const itemRecord = isRecord(item) ? item : {};
        return {
          name: asString(itemRecord.id) || '?',
          address: asString(itemRecord.address) || '',
          value: stringifyValue(itemRecord.value),
          type: asString(itemRecord.type) || 'object',
        };
      });

      const memoryState = (stack.length > 0 || heap.length > 0) ? { stack, heap, frames } : null;

      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'javascript',
        visualizationState: (resolvedStepRecord.visualizationState as JSVisualizationState | undefined) || null,
      };
    }

    // Python (정적 JSON or 실시간 시뮬레이션)
    if (vizType === 'python' || resolvedStep.pythonMemoryState || resolvedStep.pyNames) {
      const pyState = resolvedStep.pythonMemoryState || {
        names: resolvedStep.pyNames,
        objects: resolvedStep.pyObjects
      };
      const pyStateRecord = isRecord(pyState) ? pyState : undefined;
      const pyNames = asArray(pyStateRecord?.names);
      const pyObjects = asArray(pyStateRecord?.objects);

      // Memory 탭에서도 표시되도록 memoryState 구조 제공
      const memoryState = pyState ? {
        stack: pyNames.map(item => {
          const itemRecord = isRecord(item) ? item : {};
          const pointsTo = asString(itemRecord.pointsTo);
          return {
            name: asString(itemRecord.name) || '?',
            address: pointsTo || 'ref',
            value: pointsTo || 'None',
            type: asString(itemRecord.scope) || 'local',
          };
        }),
        heap: pyObjects.map(item => {
          const itemRecord = isRecord(item) ? item : {};
          const objectId = asString(itemRecord.id);
          return {
            name: objectId || '?',
            address: objectId || '???',
            value: stringifyValue(itemRecord.value),
            type: asString(itemRecord.type) || 'unknown',
          };
        }),
        frames: [{ name: 'global' }],
      } : null;

      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'python',
        visualizationState: pyState,
      };
    }

    // Java (정적 JSON or 실시간 시뮬레이션)
    if (vizType === 'java' || vizType === 'javaMemory' || resolvedStep.javaMemoryState) {
      const javaMemoryState = resolvedStep.javaMemoryState || resolvedStep.memoryState;
      const javaStateRecord = isRecord(javaMemoryState) ? javaMemoryState : undefined;
      const resolvedStepRecord = resolvedStep as UnknownRecord;
      const stack: MemoryBlock[] = [];
      const frames: { name: string }[] = [{ name: 'main' }];

      // Java 레슨 JSON 형태: stack: [{name, value, type?}]
      // Java 시뮬레이터 형태: stack: [{methodName, variables: {...}}]
      const stackData = asArray(javaStateRecord?.stack ?? resolvedStepRecord.stack);

      stackData.forEach(item => {
        const itemRecord = isRecord(item) ? item : undefined;
        // 단순 형태: {name, value, type?} - 레슨 JSON
        if (itemRecord && typeof itemRecord.name === 'string' && ('value' in itemRecord)) {
          stack.push({
            name: itemRecord.name,
            value: stringifyValue(itemRecord.value),
            type: asString(itemRecord.type) || 'unknown',
            address: '',
            points_to: undefined,
          });
        }
        // 복잡한 형태: {methodName, variables: {...}} - 시뮬레이터
        else if (itemRecord && (typeof itemRecord.methodName === 'string' || isRecord(itemRecord.variables))) {
          const frameName = asString(itemRecord.methodName) || asString(itemRecord.name) || 'main';
          if (!frames.find(f => f.name === frameName)) {
            frames.push({ name: frameName });
          }

          if (isRecord(itemRecord.variables)) {
            Object.entries(itemRecord.variables).forEach(([name, val]) => {
              let value = '';
              let type = 'unknown';
              let address = '';

              if (isRecord(val)) {
                if ('value' in val) {
                  value = stringifyValue(val.value);
                  type = asString(val.type) || typeof val.value;
                  address = asString(val.id) || '';
                } else if (asString(val.type) === 'Reference' || val.id) {
                  const refId = asString(val.id);
                  value = refId ? `@${refId}` : 'null';
                  type = asString(val.class) || asString(val.type) || 'Reference';
                  address = refId || '';
                } else {
                  value = stringifyValue(val);
                  type = 'object';
                }
              } else {
                value = String(val);
                type = typeof val;
              }

              stack.push({
                name: `${frameName}.${name}`,
                value,
                type,
                address,
                points_to: address
              });
            });
          }
        }
      });

      const heap: MemoryBlock[] = asArray(javaStateRecord?.heap ?? resolvedStepRecord.heap).map(item => {
        const itemRecord = isRecord(item) ? item : {};
        return {
          name: asString(itemRecord.id) || asString(itemRecord.name) || asString(itemRecord.address) || '?',
          address: asString(itemRecord.address) || '',
          value: stringifyValue(itemRecord.content ?? itemRecord.value),
          type: asString(itemRecord.type) || 'Object',
        };
      });

      const memoryState = (stack.length > 0 || heap.length > 0 || frames.length > 0)
        ? { stack, heap, frames }
        : null;

      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'java',
        visualizationState: javaMemoryState,
      };
    }

    // 일반 memoryState 처리 (JS memory 레슨 등 — Java가 아닌 경우)
    if (resolvedStep.memoryState) {
      const ms = isRecord(resolvedStep.memoryState) ? resolvedStep.memoryState : undefined;
      const stack: MemoryBlock[] = asArray(ms?.stack).map(item => {
        const itemRecord = isRecord(item) ? item : {};
        return {
          name: asString(itemRecord.name) || '?',
          address: asString(itemRecord.address) || '',
          value: stringifyValue(itemRecord.value ?? itemRecord.content),
          type: asString(itemRecord.type) || 'unknown',
        };
      });
      const heap: MemoryBlock[] = asArray(ms?.heap).map(item => {
        const itemRecord = isRecord(item) ? item : {};
        return {
          name: asString(itemRecord.address) || asString(itemRecord.name) || '?',
          address: asString(itemRecord.address) || '',
          value: stringifyValue(itemRecord.content ?? itemRecord.value),
          type: asString(itemRecord.type) || 'Object',
        };
      });
      const memoryState = (stack.length > 0 || heap.length > 0)
        ? { stack, heap, frames: [{ name: 'main' }] }
        : null;
      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: vizType,
        visualizationState: ms,
      };
    }

    if (resolvedStep.stack && resolvedStep.heap) {
      const resolvedStepRecord = resolvedStep as UnknownRecord;
      const rawStack = asArray(resolvedStepRecord.stack);
      const rawHeap = asArray(resolvedStepRecord.heap);

      const { frames, variables } = extractCFrames(rawStack as Parameters<typeof extractCFrames>[0]);

      const stack: MemoryBlock[] = variables.map(item => {
        const itemRecord = item as UnknownRecord;
        const frameName = asString(itemRecord.frame) || frames[0]?.name || 'main';
        const rawValue = itemRecord.value;
        const itemName = asString(itemRecord.name) || '';

        const block: MemoryBlock = {
          name: frames.length > 1 ? `${frameName}.${itemName}` : itemName,
          address: asString(itemRecord.address) || '???',
          value: normalizeCValue(rawValue),
          type: asString(itemRecord.type),
          points_to: asString(itemRecord.points_to) ?? undefined,
          highlight: itemRecord.highlight as boolean | undefined,
          dangling: itemRecord.dangling as boolean | undefined,
        };

        if (isStructValue(rawValue)) {
          block.structMembers = rawValue;
        }
        if (isCharArrayValue(rawValue)) {
          block.charElements = rawValue;
        }

        return block;
      });

      const heap: MemoryBlock[] = rawHeap.map(item => {
        const itemRecord = isRecord(item) ? item : {};
        const rawValue = itemRecord.value;
        const block: MemoryBlock = {
          name: asString(itemRecord.name) || asString(itemRecord.label) || '',
          address: asString(itemRecord.address) || '???',
          value: normalizeCValue(rawValue),
          type: asString(itemRecord.type),
          size: itemRecord.size ? parseInt(String(itemRecord.size), 10) || undefined : undefined,
          highlight: itemRecord.highlight as boolean | undefined,
          label: asString(itemRecord.label),
          dangling: itemRecord.dangling as boolean | undefined,
        };

        if (isCharArrayValue(rawValue)) {
          block.charElements = rawValue;
        }

        return block;
      });

      const memoryState = (stack.length > 0 || heap.length > 0 || frames.length > 0)
        ? { stack, heap, frames }
        : null;

      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'memory',
        visualizationState: null,
      };
    }

    // 🚨 복구: memoryChanges가 있는 경우 (Diff 방식 지원)
    if (resolvedStep.memoryChanges) {
      const { memoryState, changedBlocks } = processMemoryChanges(steps, currentStepIndex);
      const adaptedState = adaptMemoryState(memoryState);
      return {
        memoryState: adaptedState,
        changedBlocks,
        visualizationType: 'memory',
        visualizationState: null,
      };
    }

    // JS 레슨의 비-메모리 타입 (scope, eventLoop, promise 등) 패스스루
    const resolvedStepRecord = resolvedStep as UnknownRecord;
    const resolvedVizState = resolvedStepRecord.scopeState
      || resolvedStepRecord.eventLoopState
      || resolvedStepRecord.promiseState
      || resolvedStepRecord.thisState
      || resolvedStepRecord.prototypeState
      || resolvedStepRecord.callStackState
      || resolvedStepRecord.algorithmState
      || resolvedStepRecord.memoryState
      || null;

    return {
      memoryState: INITIAL_MEMORY_STATE,
      changedBlocks: INITIAL_CHANGED_BLOCKS,
      visualizationType: vizType,
      visualizationState: resolvedVizState,
    };
  }, [steps, currentStepIndex, currentStep]);

  return result;
}
