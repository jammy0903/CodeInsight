import React from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface JSMemoryFlowViewProps {
  nodes: Node[];
  edges: Edge[];
}

export function JSMemoryFlowView({ nodes, edges }: JSMemoryFlowViewProps) {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
