import { useMemo } from 'react';
import type { LessonStep, MemoryState, StackFrame as NewStackFrame, Variable, HeapObject } from '@codeinsight/shared';
import { processMemoryChanges } from '../utils/memoryUtils';
import {
  JSVisualizationState,
  JSVisualizationType,
} from '@/features/visualizers/js/types';
import { MemoryBlock } from '@/types/memory';


// The return type of the hook
interface UseLessonVisualizationResult {
  memoryState: {
      stack: MemoryBlock[];
      heap: MemoryBlock[];
      frames: {name: string}[];
  } | null;
  changedBlocks: { stack: string[]; heap: string[] };
  visualizationType: JSVisualizationType | 'python' | 'java' | 'memory' | string;
  visualizationState: any; // More specific types can be used here
}

const INITIAL_MEMORY_STATE = { stack: [], heap: [], frames: [] };
const INITIAL_CHANGED_BLOCKS = { stack: [], heap: [] };

function adaptMemoryState(memoryState: MemoryState): { stack: MemoryBlock[], heap: MemoryBlock[], frames: {name: string}[]} {
    const newStack: MemoryBlock[] = [];
    memoryState.stack.forEach(frame => {
        frame.variables.forEach(variable => {
            newStack.push({
                name: `${frame.name}.${variable.name}`,
                address: variable.address || '???',
                value: String(variable.value),
                type: variable.type,
                points_to: variable.ref
            });
        });
    });

    const newHeap: MemoryBlock[] = memoryState.heap.map(heapObj => ({
        name: heapObj.id,
        address: heapObj.address || '???',
        value: String(heapObj.value),
        type: heapObj.type,
    }));

    const frames = memoryState.stack.map(f => ({name: f.name}));

    return { stack: newStack, heap: newHeap, frames };
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

    const vizType = currentStep.visualizationType || 'memory';

    if (vizType === 'js' || vizType === 'javascript') {
      return {
        memoryState: null,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'js',
        visualizationState: currentStep.visualizationState as JSVisualizationState,
      };
    }
    
    if (vizType === 'python' && currentStep.pythonMemoryState) {
        return {
            memoryState: null,
            changedBlocks: INITIAL_CHANGED_BLOCKS,
            visualizationType: 'python',
            visualizationState: currentStep.pythonMemoryState,
        };
    }
    
    if (vizType === 'java' && currentStep.memoryState) {
      return {
          memoryState: null,
          changedBlocks: INITIAL_CHANGED_BLOCKS,
          visualizationType: 'java',
          visualizationState: currentStep.memoryState,
      };
    }

    if (currentStep.stack && currentStep.heap) {
      const memoryState = {
        stack: currentStep.stack,
        heap: currentStep.heap,
        frames: [{name: 'main'}]
      };
      return {
        memoryState,
        changedBlocks: INITIAL_CHANGED_BLOCKS,
        visualizationType: 'memory',
        visualizationState: null,
      };
    }

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
