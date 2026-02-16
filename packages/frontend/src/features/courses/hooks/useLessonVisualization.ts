import { useMemo } from 'react';
import type { LessonStep, StepMemoryState, StackFrame, Variable, HeapObject } from '@/types';
import { processMemoryChanges } from '../utils/memoryUtils';
import type { MemoryBlock } from '@/types/memory';
import { extractCFrames, normalizeCValue, isStructValue, isCharArrayValue } from '../components/memory/utils/memoryHelpers';

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
  visualizationState: any; // More specific types can be used here
}

const INITIAL_MEMORY_STATE = { stack: [], heap: [], frames: [] };
const INITIAL_CHANGED_BLOCKS = { stack: [], heap: [] };

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

// 시각화 데이터 존재 여부 확인
export const VIZ_DATA_FIELDS = [
  'stack', 'memoryState', 'scopeState', 'eventLoopState',
  'promiseState', 'thisState', 'prototypeState', 'callStackState',
  'pythonMemoryState', 'pyNames', 'javaMemoryState', 'memoryChanges',
  'algorithmState',
] as const;

export function hasVisualizationData(step: LessonStep): boolean {
  return VIZ_DATA_FIELDS.some(field => (step as any)[field] != null);
}

// 이전 스텝에서 시각화 데이터 상속 (캐리포워드)
function resolveStepWithInheritance(steps: LessonStep[], currentIndex: number): LessonStep {
  const currentStep = steps[currentIndex];
  if (!currentStep || hasVisualizationData(currentStep)) return currentStep;

  const currentVizType = currentStep.visualizationType || 'memory';

  // 같은 vizType을 가진 가장 가까운 이전 스텝에서 상속
  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevStep = steps[i];
    const prevVizType = prevStep.visualizationType || 'memory';
    if (prevVizType === currentVizType && hasVisualizationData(prevStep)) {
      const vizFields: Record<string, unknown> = {};
      for (const field of VIZ_DATA_FIELDS) {
        if ((prevStep as any)[field] != null) {
          vizFields[field] = (prevStep as any)[field];
        }
      }
      // heap도 함께 상속 (stack과 쌍)
      if ((prevStep as any).heap != null) {
        vizFields.heap = (prevStep as any).heap;
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

      if (resolvedStep.stack && Array.isArray(resolvedStep.stack)) {
        resolvedStep.stack.forEach((frame: any) => {
          // 백엔드는 methodName을 사용함 (functionName이 아님!)
          const frameName = frame.methodName || frame.functionName || '__main__';
          frames.push({ name: frameName });

          if (frame.variables) {
            Object.entries(frame.variables).forEach(([name, value]: [string, any]) => {
              stack.push({
                name: `${frameName}.${name}`,
                address: '',
                value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                type: typeof value,
              });
            });
          }
        });
      }

      const heap: MemoryBlock[] = (resolvedStep.heap || []).map((item: any) => ({
        name: item.id || '?',
        address: item.address || '',
        value: typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value ?? ''),
        type: item.type || 'object',
      }));

      const memoryState = (stack.length > 0 || heap.length > 0) ? { stack, heap, frames } : null;

      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'javascript',
        visualizationState: (resolvedStep as any).visualizationState as JSVisualizationState,
      };
    }

    // Python (정적 JSON or 실시간 시뮬레이션)
    if (vizType === 'python' || resolvedStep.pythonMemoryState || resolvedStep.pyNames) {
      const pyState = resolvedStep.pythonMemoryState || {
        names: resolvedStep.pyNames,
        objects: resolvedStep.pyObjects
      };

      // Memory 탭에서도 표시되도록 memoryState 구조 제공
      const memoryState = pyState ? {
        stack: (pyState.names || []).map((item: any) => ({
          name: item.name || '?',
          address: item.pointsTo || 'ref',
          value: item.pointsTo || 'None',
          type: item.scope || 'local',
        })),
        heap: (pyState.objects || []).map((item: any) => ({
          name: item.id || '?',
          address: item.id || '???',
          value: String(item.value ?? ''),
          type: item.type || 'unknown',
        })),
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
      const stack: MemoryBlock[] = [];
      const frames: { name: string }[] = [{ name: 'main' }];

      // Java 레슨 JSON 형태: stack: [{name, value, type?}]
      // Java 시뮬레이터 형태: stack: [{methodName, variables: {...}}]
      const stackData = javaMemoryState?.stack || (resolvedStep.stack as any[]) || [];

      stackData.forEach((item: any) => {
        // 단순 형태: {name, value, type?} - 레슨 JSON
        if (item.name && (item.value !== undefined || item.value === null)) {
          stack.push({
            name: item.name,
            value: String(item.value ?? ''),
            type: item.type || 'unknown',
            address: '',
            points_to: undefined,
          });
        }
        // 복잡한 형태: {methodName, variables: {...}} - 시뮬레이터
        else if (item.methodName || item.variables) {
          const frameName = item.methodName || item.name || 'main';
          if (!frames.find(f => f.name === frameName)) {
            frames.push({ name: frameName });
          }

          if (item.variables) {
            Object.entries(item.variables).forEach(([name, val]: [string, any]) => {
              let value = '';
              let type = 'unknown';
              let address = '';

              if (val && typeof val === 'object') {
                if ('value' in val) {
                  value = String(val.value);
                  type = val.type || typeof val.value;
                  address = val.id || '';
                } else if (val.type === 'Reference' || val.id) {
                  value = val.id ? `@${val.id}` : 'null';
                  type = val.class || val.type || 'Reference';
                  address = val.id || '';
                } else {
                  value = JSON.stringify(val);
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

      const heap: MemoryBlock[] = (javaMemoryState?.heap || resolvedStep.heap || []).map((item: any) => ({
        name: item.id || item.name || item.address || '?',
        address: item.address || '',
        value: String(item.content ?? item.value ?? ''),
        type: item.type || 'Object',
      }));

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
      const ms = resolvedStep.memoryState as any;
      const stack: MemoryBlock[] = (ms.stack || []).map((item: any) => ({
        name: item.name || '?',
        address: item.address || '',
        value: String(item.value ?? item.content ?? ''),
        type: item.type || 'unknown',
      }));
      const heap: MemoryBlock[] = (ms.heap || []).map((item: any) => ({
        name: item.address || item.name || '?',
        address: item.address || '',
        value: String(item.content ?? item.value ?? ''),
        type: item.type || 'Object',
      }));
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
      const rawStack = resolvedStep.stack as any[];
      const rawHeap = (resolvedStep.heap || []) as any[];

      const { frames, variables } = extractCFrames(rawStack);

      const stack: MemoryBlock[] = variables.map((item: any) => {
        const frameName = item.frame || frames[0]?.name || 'main';
        const rawValue = item.value;

        const block: MemoryBlock = {
          name: frames.length > 1 ? `${frameName}.${item.name}` : item.name,
          address: item.address || '???',
          value: normalizeCValue(rawValue),
          type: item.type,
          points_to: item.points_to ?? undefined,
          highlight: item.highlight,
          dangling: item.dangling,
        };

        if (isStructValue(rawValue)) {
          block.structMembers = rawValue;
        }
        if (isCharArrayValue(rawValue)) {
          block.charElements = rawValue;
        }

        return block;
      });

      const heap: MemoryBlock[] = rawHeap.map((item: any) => {
        const rawValue = item.value;
        const block: MemoryBlock = {
          name: item.name || item.label || '',
          address: item.address || '???',
          value: normalizeCValue(rawValue),
          type: item.type,
          size: item.size ? parseInt(String(item.size), 10) || undefined : undefined,
          highlight: item.highlight,
          label: item.label,
          dangling: item.dangling,
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
    const resolvedVizState = (resolvedStep as any).scopeState
      || (resolvedStep as any).eventLoopState
      || (resolvedStep as any).promiseState
      || (resolvedStep as any).thisState
      || (resolvedStep as any).prototypeState
      || (resolvedStep as any).callStackState
      || (resolvedStep as any).algorithmState
      || (resolvedStep as any).memoryState
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
