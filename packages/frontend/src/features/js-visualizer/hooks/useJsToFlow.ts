import { useMemo } from 'react';
import { Node, Edge } from 'reactflow';

const nodeDefaults = {
  sourcePosition: 'right' as const,
  targetPosition: 'left' as const,
  style: {
    borderRadius: '0.5rem',
    border: '1px solid #cbd5e1',
    padding: '1rem',
    backgroundColor: 'white',
  },
};

export function useJsToFlow(steps: any[], currentStepIndex: number) {
  return useMemo(() => {
    if (!steps || steps.length === 0) {
      return { nodes: [], edges: [] };
    }

    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
      return { nodes: [], edges: [] };
    }

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let yPos = 0;

    // Create nodes for stack frames
    currentStep.stack.forEach((frame: any, frameIndex: number) => {
      const frameId = `stack-${frameIndex}`;
      newNodes.push({
        id: frameId,
        position: { x: 50, y: yPos },
        data: { label: `${frame.functionName} Stack Frame` },
        ...nodeDefaults,
        style: { ...nodeDefaults.style, backgroundColor: '#f0f9ff', width: 250 },
      });

      yPos += 100;

      // Create nodes for variables in the stack frame
      Object.entries(frame.variables).forEach(([varName, varValue]) => {
        const varId = `${frameId}-${varName}`;
        newNodes.push({
          id: varId,
          position: { x: 100, y: yPos },
          data: { label: `${varName}: ${JSON.stringify(varValue)}` },
          ...nodeDefaults,
          parentNode: frameId,
          extent: 'parent',
           style: { ...nodeDefaults.style, fontSize: '0.8rem', width: 200 },
        });
        yPos += 60;
      });
      
      yPos += 50;
    });

    // TODO: Create nodes for heap objects and edges for references

    return { nodes: newNodes, edges: newEdges };
  }, [steps, currentStepIndex]);
}
