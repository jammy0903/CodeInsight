import React from 'react';
import Editor from '@monaco-editor/react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from 'react-resizable-panels';
import { JSMemoryFlowView } from './components/JSMemoryFlowView';
import { useJsVisualizerStore } from './stores/useJsVisualizerStore';

function JSCodeEditor() {
  const { code, setCode } = useJsVisualizerStore();

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
  const { runVisualization } = useJsVisualizerStore();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] m-4">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">JavaScript Memory & Flow Visualizer</h1>
        <p className="text-muted-foreground">코드를 입력하고 실행하여 메모리와 실행 흐름을 시각적으로 확인하세요.</p>
      </header>
      
      <div className="flex-grow my-4">
        <ResizablePanelGroup direction="horizontal" className="h-full border rounded-md">
          <ResizablePanel defaultSize={50}>
            <div className="h-full p-4">
              <h2 className="text-lg font-semibold mb-2">Code</h2>
               <div className="h-[calc(100%-2rem)] border rounded-md overflow-hidden">
                 <JSCodeEditor />
               </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="h-full p-4">
              <h2 className="text-lg font-semibold mb-2">Visualization</h2>
              <div className="h-[calc(100%-2rem)] border rounded-md">
                <JSMemoryFlowView />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <footer className="p-4 border-t flex items-center justify-center gap-4">
        <button onClick={runVisualization} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Run
        </button>
        {/* TODO: Add step controls (slider, next/prev buttons) */}
        <div className="w-1/2">
          <p className="text-center">Step Controls Placeholder</p>
        </div>
      </footer>
    </div>
  );
}
