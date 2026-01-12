/**
 * PlaygroundPage - Code Simulator (Light Theme)
 * Left 50%: Code Editor + Output + Explanation
 * Right 50%: Memory Visualization
 */

import { useMemo, useEffect } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { Cpu, Github, Mail, GripVertical } from 'lucide-react';
import { LanguageTabs } from './components/LanguageTabs';
import { CodeEditor } from './components/CodeEditor';
import { StepControls } from './components/StepControls';
import { StepExplanation } from './components/StepExplanation';
import { MemoryPanel } from '@/features/courses/components/memory';
import { useLessonVisualization } from '@/features/courses/hooks/useLessonVisualization';
import { usePlaygroundStore, useCurrentCode } from './stores/playgroundStore';
import { useExplanationStore } from './stores/explanationStore';
import { TerminalOutput, type TerminalLine } from '@/features/visualizers/shared';
import { PyVisualizerView } from '@/features/visualizers/python';
import type { LessonStep } from '@/types';

const LINE_HEIGHT = 19;
const MIN_EDITOR_HEIGHT = 150;
const MAX_EDITOR_HEIGHT = 500;

export function PlaygroundPage() {
  const { steps, currentStepIndex, error, registers, language } = usePlaygroundStore();
  const code = useCurrentCode();
  const { startPrefetch, stopPrefetch } = useExplanationStore();

  const currentStep = steps[currentStepIndex];
  const hasSteps = steps.length > 0;

  // Calculate editor height based on code lines
  const editorHeight = useMemo(() => {
    const lineCount = code.split('\n').length;
    const calculated = lineCount * LINE_HEIGHT + 40; // 40px padding
    return Math.max(MIN_EDITOR_HEIGHT, Math.min(calculated, MAX_EDITOR_HEIGHT));
  }, [code]);

  // Start AI explanation prefetch when simulation steps change
  useEffect(() => {
    if (steps.length > 0 && code) {
      startPrefetch(steps as LessonStep[], code);
    }
    return () => {
      stopPrefetch();
    };
  }, [steps, code, startPrefetch, stopPrefetch]);

  // Use useLessonVisualization hook (unified Lesson and Playground)
  const { memoryState, changedBlocks } = useLessonVisualization(
    steps as LessonStep[],
    currentStepIndex
  );

  // Convert printf/scanf output to terminal lines
  const terminalLines = useMemo<TerminalLine[]>(() => {
    if (!hasSteps) return [];

    const lines: TerminalLine[] = [];
    for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
      const step = steps[i] as LessonStep;
      if (step.stdout) {
        lines.push({ type: 'output', content: step.stdout });
      }
    }
    return lines;
  }, [steps, currentStepIndex, hasSteps]);

  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
      }}
    >
      {/* Main area: Resizable 2-panel layout */}
      <PanelGroup
        orientation="horizontal"
        id="playground-main"
        style={{
          minHeight: 'calc(100vh - 64px - 32px)',
          alignItems: 'flex-start',
        }}
      >
        {/* ===== Left Panel: Code Editor + Output + Explanation ===== */}
        <Panel
          id="code-editor"
          defaultSize={50}
          minSize={30}
          maxSize={70}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            backgroundColor: '#ffffff',
          }}
        >
          {/* Code Header: Language tabs + Control buttons */}
          <div
            style={{
              height: '48px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e1e4e8',
              backgroundColor: '#ffffff',
              flexShrink: 0,
            }}
          >
            <LanguageTabs />
            <StepControls />
          </div>

          {/* Editor - dynamic height based on code lines */}
          <div style={{ height: `${editorHeight}px`, flexShrink: 0 }}>
            <CodeEditor />
          </div>

          {/* Terminal Output - right after code */}
          {terminalLines.length > 0 && (
            <div
              style={{
                flexShrink: 0,
                padding: '8px 12px',
                backgroundColor: '#ffffff',
                borderTop: '1px solid #e1e4e8',
              }}
            >
              <TerminalOutput
                lines={terminalLines}
                title="Output"
                maxHeight="100px"
              />
            </div>
          )}

          {/* Explanation Panel - after output (or code if no output) */}
          {currentStep && (
            <div
              style={{
                flexShrink: 0,
                padding: '8px 12px 12px',
                backgroundColor: '#ffffff',
                borderTop: terminalLines.length === 0 ? '1px solid #e1e4e8' : 'none',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)',
                  border: '1px solid #bbf7d0',
                }}
              >
                {/* Explanation Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    backgroundColor: '#dcfce7',
                    borderBottom: '1px solid #bbf7d0',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>💡</span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#166534',
                      fontWeight: 600,
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    Explanation
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#16a34a',
                      marginLeft: 'auto',
                      fontFamily: 'monospace',
                    }}
                  >
                    Line {currentStep.line}
                  </span>
                </div>
                {/* Explanation Content */}
                <div style={{ padding: '10px 14px' }}>
                  <StepExplanation step={currentStep} />
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* ===== Resize Handle ===== */}
        <PanelResizeHandle
          style={{
            width: '8px',
            backgroundColor: '#e1e4e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'col-resize',
            transition: 'background-color 0.15s ease',
          }}
          className="hover:bg-blue-200 active:bg-blue-300"
        >
          <GripVertical size={14} color="#9ca3af" />
        </PanelResizeHandle>

        {/* ===== Right Panel: Memory Visualization ===== */}
        <Panel
          id="memory-viewer"
          defaultSize={50}
          minSize={30}
          maxSize={70}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            backgroundColor: '#f8f9fa',
          }}
        >
          {/* Header */}
          <div
            style={{
              height: '48px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #e1e4e8',
              backgroundColor: '#ffffff',
              flexShrink: 0,
            }}
          >
            <Cpu size={18} color="#22c55e" />
            <span style={{ fontSize: '14px', color: '#1f2937', fontWeight: 600 }}>
              Memory Visualization
            </span>
            {hasSteps && (
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: '#22c55e',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  background: '#f0fdf4',
                  borderRadius: '6px',
                  border: '1px solid #bbf7d0',
                }}
              >
                Step {currentStepIndex + 1}/{steps.length}
              </span>
            )}
          </div>

          {/* Memory Panel */}
          <div style={{ minHeight: '400px', padding: '16px' }}>
            {error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : language === 'python' && hasSteps ? (
              <PyVisualizerView
                names={currentStep?.pyNames || []}
                objects={currentStep?.pyObjects || []}
                animate={true}
              />
            ) : language === 'c' && hasSteps ? (
              <MemoryPanel
                stack={memoryState.stack}
                heap={memoryState.heap}
                changedBlocks={changedBlocks}
                frames={memoryState.frames}
                showRegisters={!!registers?.rsp || !!registers?.rbp}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                {language === 'java'
                  ? 'Java simulation is not supported yet'
                  : 'Click Run button to execute code'}
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Footer - Compact */}
      <footer
        style={{
          padding: '8px 24px',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          CodeInsight 2026
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href="https://github.com/jammy0903"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#9ca3af', display: 'flex' }}
          >
            <Github size={14} />
          </a>
          <a
            href="mailto:l89192164@gmail.com"
            style={{ color: '#9ca3af', display: 'flex' }}
          >
            <Mail size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
