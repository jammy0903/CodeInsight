import { useMemo } from 'react';
import type { LessonStep, StepMemoryState, StackFrame, Variable, HeapObject } from '@/types';
import { processMemoryChanges } from '../utils/memoryUtils';
import type { MemoryBlock } from '@/types/memory';

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

// Memoize helper function to avoid recreating it
const getInitialState = () => ({
  memoryState: INITIAL_MEMORY_STATE,
  changedBlocks: INITIAL_CHANGED_BLOCKS,
  visualizationType: 'memory',
  visualizationState: null,
});

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

    const vizType = currentStep.visualizationType || 'memory';

    if (vizType === 'javascript') {
      const stack: MemoryBlock[] = [];
      const frames: { name: string }[] = [];

      if (currentStep.stack && Array.isArray(currentStep.stack)) {
        currentStep.stack.forEach((frame: any) => {
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

      const heap: MemoryBlock[] = (currentStep.heap || []).map((item: any) => ({
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
        visualizationState: (currentStep as any).visualizationState as JSVisualizationState,
      };
    }

    // Python (정적 JSON or 실시간 시뮬레이션)
    if (vizType === 'python' || currentStep.pythonMemoryState || currentStep.pyNames) {
      const pyState = currentStep.pythonMemoryState || {
        names: currentStep.pyNames,
        objects: currentStep.pyObjects
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
    if (vizType === 'java' || currentStep.memoryState) {
      const javaMemoryState = currentStep.memoryState;
      const stack: MemoryBlock[] = [];
      const frames: { name: string }[] = [{ name: 'main' }];

      // Java 레슨 JSON 형태: stack: [{name, value, type?}]
      // Java 시뮬레이터 형태: stack: [{methodName, variables: {...}}]
      const stackData = javaMemoryState?.stack || (currentStep.stack as any[]) || [];

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

      const heap: MemoryBlock[] = (javaMemoryState?.heap || currentStep.heap || []).map((item: any) => ({
        name: item.id || item.name || item.address || '?',
        address: item.address || '',
        value: String(item.content ?? item.value ?? ''),
        type: item.type || 'Object',
      }));

      const memoryState = (stack.length > 0 || heap.length > 0)
        ? { stack, heap, frames }
        : null;

      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'java',
        visualizationState: javaMemoryState,
      };
    }

    if (currentStep.stack && currentStep.heap) {
      const memoryState = {
        stack: currentStep.stack,
        heap: currentStep.heap,
        frames: [{ name: 'main' }]
      };
      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'memory',
        visualizationState: null,
      };
    }

    // 🚨 복구: memoryChanges가 있는 경우 (Diff 방식 지원)
    if (currentStep.memoryChanges) {
      const { memoryState, changedBlocks } = processMemoryChanges(steps, currentStepIndex);
      const adaptedState = adaptMemoryState(memoryState);
      return {
        memoryState: adaptedState,
        changedBlocks,
        visualizationType: 'memory',
        visualizationState: null,
      };
    }

    return {
      memoryState: INITIAL_MEMORY_STATE,
      changedBlocks: INITIAL_CHANGED_BLOCKS,
      visualizationType: 'memory',
      visualizationState: null,
    };
  }, [steps, currentStepIndex, currentStep]);

  return result;
}
