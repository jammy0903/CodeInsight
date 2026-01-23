import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Group,
  Panel,
  Separator,
} from 'react-resizable-panels';
import { JSVisualizerView } from './components/JSVisualizerView';
import { useLessonVisualization } from '@/features/courses/hooks/useLessonVisualization';
import type { LessonStep } from '@codeinsight/shared';
import type { EventLoopState } from './types';

// Placeholder code for the editor
const initialCode = `console.log('Start');

setTimeout(() => {
  console.log('Timeout!');
}, 1000);

Promise.resolve().then(() => {
  console.log('Promise!');
});

console.log('End');
`;

// Mock data conforming to the LessonStep schema
const mockEventLoopState: EventLoopState = {
  callStack: ["console.log('Start')"],
  webApis: [],
  taskQueue: [],
  microtaskQueue: [],
  output: ['Start'],
  currentPhase: 'executing',
  highlightArea: 'callStack',
};

const mockSteps: LessonStep[] = [
  {
    line: 1,
    explanation: "The first console.log is added to the call stack and executed.",
    visualizationType: 'eventLoop',
    visualizationState: {
      type: 'eventLoop',
      data: mockEventLoopState,
    },
  },
  // Add more mock steps here to test stepping
];


function JSCodeEditor() {
  const [code, setCode] = useState(initialCode);

  return (
    <Editor
      height="100%"
      language="javascript"
      value={code}
      onChange={(value) => setCode(value || '')}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        padding: { top: 16, bottom: 16 },
      }}
    />
  );
}

export function JSVisualizerPage() {
  const [steps, setSteps] = useState<LessonStep[]>(mockSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { visualizationType, visualizationState } = useLessonVisualization(steps, currentStepIndex);

  const runVisualization = () => {
    // In a real scenario, this would fetch or compute the steps
    console.log('Running visualization...');
    setCurrentStepIndex(0); // Reset to the first step
  };
  
  const goToNextStep = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goToPrevStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };


  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] m-4">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">JavaScript Memory & Flow Visualizer</h1>
        <p className="text-muted-foreground">코드를 입력하고 실행하여 메모리와 실행 흐름을 시각적으로 확인하세요.</p>
      </header>
      
      <div className="flex-grow my-4">
        <Group direction="horizontal" className="h-full border rounded-md">
          <Panel defaultSize={50}>
            <div className="h-full p-4">
              <h2 className="text-lg font-semibold mb-2">Code</h2>
               <div className="h-[calc(100%-2rem)] border rounded-md overflow-hidden">
                 <JSCodeEditor />
               </div>
            </div>
          </Panel>
          <Separator className="w-2 bg-gray-300 hover:bg-gray-400 cursor-ew-resize" />
          <Panel defaultSize={50}>
            <div className="h-full p-4">
              <h2 className="text-lg font-semibold mb-2">Visualization</h2>
              <div className="h-[calc(100%-2rem)] border rounded-md">
                <JSVisualizerView state={visualizationState} type={visualizationType} />
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      <footer className="p-4 border-t flex items-center justify-center gap-4">
        <button onClick={runVisualization} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Run
        </button>
        <div className="w-1/2 flex items-center justify-center gap-4">
          <button onClick={goToPrevStep} className="px-3 py-1 border rounded">Prev</button>
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <button onClick={goToNextStep} className="px-3 py-1 border rounded">Next</button>
        </div>
      </footer>
    </div>
  );
}
