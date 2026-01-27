import type {
  LessonStep,
  MemoryChangeAction,
  StackFrame,
  Variable,
  HeapObject,
  StepMemoryState,
} from '@codeinsight/shared';

interface ProcessedMemoryState {
  memoryState: StepMemoryState;
  changedBlocks: {
    stack: string[];
    heap: string[];
  };
}

const INITIAL_MEMORY_STATE: StepMemoryState = {
  stack: [],
  heap: [],
};

export function processMemoryChanges(
  steps: LessonStep[],
  currentStepIndex: number
): ProcessedMemoryState {
  
  const currentState = calculateStateForStep(steps, currentStepIndex);
  const prevState = currentStepIndex > 0 ? calculateStateForStep(steps, currentStepIndex - 1) : INITIAL_MEMORY_STATE;

  const changedBlocks = diffStates(prevState, currentState);

  return {
    memoryState: currentState,
    changedBlocks,
  };
}

function calculateStateForStep(steps: LessonStep[], stepIndex: number): StepMemoryState {
    const slicedSteps = steps.slice(0, stepIndex + 1);
    const finalState = slicedSteps.reduce((currentState, step) => {
        if (!step.memoryChanges || step.memoryChanges.length === 0) {
        return currentState;
        }
        return applyMemoryChanges(currentState, step.memoryChanges);
    }, INITIAL_MEMORY_STATE);
    return finalState;
}


function applyMemoryChanges(
  state: StepMemoryState,
  changes: MemoryChangeAction[]
): StepMemoryState {
  const newState = structuredClone(state);

  for (const change of changes) {
    switch (change.action) {
      case 'frame': {
        if (change.name) {
          newState.stack.push({ name: change.name, variables: [] });
        }
        break;
      }

      case 'frame_end': {
        newState.stack.pop();
        break;
      }

      case 'allocate': {
        if (!change.name || !change.frame) break;

        const variable: Variable = {
          name: change.name,
          type: change.type || 'unknown',
          value: change.value ?? '?',
          address: change.address,
        };

        if (change.area === 'stack') {
          const frame = newState.stack.find(f => f.name === change.frame);
          if (frame) {
            frame.variables.push(variable);
          }
        } else if (change.area === 'heap') {
          const heapObject: HeapObject = {
            id: change.address,
            address: change.address,
            type: change.type || 'unknown',
            value: change.value,
          };
          newState.heap.push(heapObject);

          const frame = newState.stack.find(f => f.name === change.frame);
          if (frame) {
            const pointerVar: Variable = {
              name: change.name,
              type: `${change.type}*`,
              value: change.address || '?',
              ref: change.address,
            };
            frame.variables.push(pointerVar);
          }
        }
        break;
      }

      case 'update': {
        if (!change.name) break;

        if (change.area === 'stack') {
          for (const frame of newState.stack) {
            const variable = frame.variables.find(v => v.name === change.name);
            if (variable) {
              variable.value = change.value ?? '?';
              break;
            }
          }
        } else if (change.area === 'heap' && change.address) {
          const heapObject = newState.heap.find(h => h.address === change.address);
          if (heapObject) {
            heapObject.value = change.value;
          }
        }
        break;
      }
      
      case 'deallocate':
      case 'free': {
        if (change.area === 'heap' && change.address) {
          newState.heap = newState.heap.filter(h => h.address !== change.address);
        }
        
        if (change.name) {
           for (const frame of newState.stack) {
              const variable = frame.variables.find(v => v.name === change.name);
              if (variable) {
                frame.variables = frame.variables.filter(v => v.name !== change.name);
                break;
              }
           }
        }
        break;
      }
    }
  }
  return newState;
}

function diffStates(prevState: StepMemoryState, currentState: StepMemoryState): ProcessedMemoryState['changedBlocks'] {
    const changedBlocks: ProcessedMemoryState['changedBlocks'] = {
        stack: [],
        heap: []
    };

    // Diff stack
    const prevStackVars = new Map<string, any>();
    prevState.stack.forEach(frame => frame.variables.forEach(v => prevStackVars.set(`${frame.name}-${v.name}`, v.value)));

    currentState.stack.forEach(frame => {
        frame.variables.forEach(v => {
            const key = `${frame.name}-${v.name}`;
            if (!prevStackVars.has(key) || prevStackVars.get(key) !== v.value) {
                changedBlocks.stack.push(v.name);
            }
        });
    });

    // Diff heap
    const prevHeapVars = new Map<string, any>();
    prevState.heap.forEach(h => h.address && prevHeapVars.set(h.address, h.value));

    currentState.heap.forEach(h => {
        if (h.address && (!prevHeapVars.has(h.address) || prevHeapVars.get(h.address) !== h.value)) {
            changedBlocks.heap.push(h.address);
        }
    });

    return changedBlocks;
}