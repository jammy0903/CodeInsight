/**
 * PlaygroundPage - Code Simulator (Theme Support)
 * Left 50%: Code Editor + Output + Explanation
 * Right 50%: Memory Visualization
 */

import { useMemo, useEffect } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { useIsMobile } from '@/hooks';
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
import { useThemeStore } from '@/stores/themeStore';
import type { LessonStep } from '@/types';

// 테마별 Playground 색상
const playgroundColors = {
  dark: {
    // 배경
    pageBg: '#09090b',           // zinc-950
    panelBg: '#18181b',          // zinc-900
    headerBg: '#18181b',
    // 보더
    border: '#27272a',           // zinc-800
    resizeHandle: '#3f3f46',     // zinc-700
    resizeHover: '#52525b',      // zinc-600
    // 텍스트
    text: '#fafafa',             // zinc-50
    textMuted: '#a1a1aa',        // zinc-400
    textDim: '#71717a',          // zinc-500
    // 악센트
    accent: '#22d3ee',           // cyan-400
    accentBg: '#164e63',         // cyan-900
    accentBorder: '#0e7490',     // cyan-700
    // 설명 패널 (시안 계열)
    explanationBg: '#0c1a1e',
    explanationHeaderBg: '#134e4a',
    explanationBorder: '#115e59',
    explanationText: '#5eead4',
    explanationTextMuted: '#2dd4bf',
    // 에러
    errorBg: '#1c1917',
    errorBorder: '#7f1d1d',
    errorText: '#fca5a5',
    // 푸터
    footerBg: '#0f0f10',
    footerBorder: '#27272a',
    footerText: '#71717a',
  },
  soft: {
    pageBg: '#faf8fc',
    panelBg: '#ffffff',
    headerBg: '#ffffff',
    border: '#ebe4ed',
    resizeHandle: '#e9d5ff',
    resizeHover: '#d8b4fe',
    text: '#6b5a7a',
    textMuted: '#a08eb0',
    textDim: '#c4b5d0',
    accent: '#a855f7',
    accentBg: '#faf5ff',
    accentBorder: '#e9d5ff',
    explanationBg: '#f0fdf4',
    explanationHeaderBg: '#dcfce7',
    explanationBorder: '#bbf7d0',
    explanationText: '#166534',
    explanationTextMuted: '#16a34a',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    errorText: '#dc2626',
    footerBg: '#f3eef8',
    footerBorder: '#ebe4ed',
    footerText: '#a08eb0',
  },
  minimal: {
    pageBg: '#faf9f7',
    panelBg: '#fffffe',
    headerBg: '#fffffe',
    border: '#e5d5c7',
    resizeHandle: '#d6cfc5',
    resizeHover: '#c4b8a8',
    text: '#5c4a3d',
    textMuted: '#8a8279',
    textDim: '#a39585',
    accent: '#a08060',
    accentBg: '#fef3c7',
    accentBorder: '#fcd34d',
    explanationBg: '#fefce8',
    explanationHeaderBg: '#fef9c3',
    explanationBorder: '#fde047',
    explanationText: '#854d0e',
    explanationTextMuted: '#a16207',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    errorText: '#dc2626',
    footerBg: '#f5f3f0',
    footerBorder: '#e5d5c7',
    footerText: '#8a8279',
  },
};

const LINE_HEIGHT = 19;
const MIN_EDITOR_HEIGHT = 150;
const MAX_EDITOR_HEIGHT = 500;

export function PlaygroundPage() {
  const { steps, currentStepIndex, error, registers, language } = usePlaygroundStore();
  const code = useCurrentCode();
  const { startPrefetch, stopPrefetch } = useExplanationStore();
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = playgroundColors[currentTheme];
  const isMobile = useIsMobile();

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
        backgroundColor: colors.pageBg,
      }}
    >
      {/* Main area: Resizable 2-panel layout (모바일: 세로, 데스크톱: 가로) */}
      <PanelGroup
        orientation={isMobile ? 'vertical' : 'horizontal'}
        id="playground-main"
        style={{
          minHeight: isMobile ? 'auto' : 'calc(100vh - 64px - 32px)',
          alignItems: 'flex-start',
        }}
      >
        {/* ===== Left Panel: Code Editor + Output + Explanation ===== */}
        <Panel
          id="code-editor"
          defaultSize={isMobile ? 100 : 50}
          minSize={isMobile ? 100 : 30}
          maxSize={isMobile ? 100 : 70}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            backgroundColor: colors.panelBg,
          }}
        >
          {/* Code Header: Language tabs + Control buttons - 반응형 */}
          <div
            style={{
              height: isMobile ? '40px' : '48px',
              padding: isMobile ? '0 8px' : '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
              flexShrink: 0,
              gap: isMobile ? '4px' : '8px',
            }}
          >
            <LanguageTabs isMobile={isMobile} />
            <StepControls isMobile={isMobile} />
          </div>

          {/* Editor - dynamic height based on code lines - 모바일에서 더 작게 */}
          <div style={{ height: isMobile ? `${Math.min(editorHeight, 200)}px` : `${editorHeight}px`, flexShrink: 0 }}>
            <CodeEditor />
          </div>

          {/* Terminal Output - right after code - 반응형 */}
          {terminalLines.length > 0 && (
            <div
              style={{
                flexShrink: 0,
                padding: isMobile ? '6px 8px' : '8px 12px',
                backgroundColor: colors.panelBg,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <TerminalOutput
                lines={terminalLines}
                title="Output"
                maxHeight={isMobile ? '80px' : '100px'}
              />
            </div>
          )}

          {/* Explanation Panel - after output (or code if no output) - 반응형 */}
          {currentStep && (
            <div
              style={{
                flexShrink: 0,
                padding: isMobile ? '6px 8px 8px' : '8px 12px 12px',
                backgroundColor: colors.panelBg,
                borderTop: terminalLines.length === 0 ? `1px solid ${colors.border}` : 'none',
              }}
            >
              <div
                style={{
                  backgroundColor: colors.explanationBg,
                  borderRadius: isMobile ? '6px' : '8px',
                  overflow: 'hidden',
                  boxShadow: currentTheme === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(34, 197, 94, 0.12)',
                  border: `1px solid ${colors.explanationBorder}`,
                }}
              >
                {/* Explanation Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: isMobile ? '4px 8px' : '6px 12px',
                    backgroundColor: colors.explanationHeaderBg,
                    borderBottom: `1px solid ${colors.explanationBorder}`,
                    gap: isMobile ? '4px' : '8px',
                  }}
                >
                  <span style={{ fontSize: isMobile ? '12px' : '14px' }}>💡</span>
                  <span
                    style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: colors.explanationText,
                      fontWeight: 600,
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    Explanation
                  </span>
                  <span
                    style={{
                      fontSize: isMobile ? '9px' : '10px',
                      color: colors.explanationTextMuted,
                      marginLeft: 'auto',
                      fontFamily: 'monospace',
                    }}
                  >
                    Line {currentStep.line}
                  </span>
                </div>
                {/* Explanation Content */}
                <div style={{ padding: isMobile ? '8px 10px' : '10px 14px' }}>
                  <StepExplanation step={currentStep} isMobile={isMobile} />
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* ===== Resize Handle (모바일: 숨김) ===== */}
        {!isMobile && (
          <PanelResizeHandle
            style={{
              width: '8px',
              backgroundColor: colors.resizeHandle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'col-resize',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.resizeHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.resizeHandle)}
          >
            <GripVertical size={14} color={colors.textDim} />
          </PanelResizeHandle>
        )}

        {/* ===== Right Panel: Memory Visualization - 반응형 ===== */}
        <Panel
          id="memory-viewer"
          defaultSize={isMobile ? 100 : 50}
          minSize={isMobile ? 100 : 30}
          maxSize={isMobile ? 100 : 70}
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            backgroundColor: colors.panelBg,
          }}
        >
          {/* Header - 반응형 */}
          <div
            style={{
              height: isMobile ? '36px' : '48px',
              padding: isMobile ? '0 8px' : '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '8px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
              flexShrink: 0,
            }}
          >
            <Cpu size={isMobile ? 14 : 18} color={colors.accent} />
            <span style={{ fontSize: isMobile ? '12px' : '14px', color: colors.text, fontWeight: 600 }}>
              {isMobile ? 'Memory' : 'Memory Visualization'}
            </span>
            {hasSteps && (
              <span
                style={{
                  marginLeft: 'auto',
                  padding: isMobile ? '2px 6px' : '4px 10px',
                  fontSize: isMobile ? '10px' : '12px',
                  color: colors.accent,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  background: colors.accentBg,
                  borderRadius: isMobile ? '4px' : '6px',
                  border: `1px solid ${colors.accentBorder}`,
                }}
              >
                {currentStepIndex + 1}/{steps.length}
              </span>
            )}
          </div>

          {/* Memory Panel - 반응형 */}
          <div style={{ minHeight: isMobile ? '250px' : '400px', padding: isMobile ? '8px' : '16px' }}>
            {error ? (
              <div
                style={{
                  padding: isMobile ? '10px' : '16px',
                  backgroundColor: colors.errorBg,
                  border: `1px solid ${colors.errorBorder}`,
                  borderRadius: isMobile ? '6px' : '8px',
                }}
              >
                <p style={{ fontSize: isMobile ? '12px' : '14px', color: colors.errorText }}>{error}</p>
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontSize: isMobile ? '12px' : '14px',
                  color: colors.textMuted,
                  textAlign: 'center',
                  padding: isMobile ? '0 16px' : 0,
                }}
              >
                {language === 'java'
                  ? 'Java simulation is not supported yet'
                  : isMobile ? 'Run 버튼을 눌러 실행' : 'Click Run button to execute code'}
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Footer - Compact - 반응형 */}
      <footer
        style={{
          padding: isMobile ? '6px 12px' : '8px 24px',
          backgroundColor: colors.footerBg,
          borderTop: `1px solid ${colors.footerBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: isMobile ? '10px' : '11px', color: colors.footerText }}>
          CodeInsight 2026
        </span>
        <div style={{ display: 'flex', gap: isMobile ? '6px' : '8px' }}>
          <a
            href="https://github.com/jammy0903"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: colors.footerText, display: 'flex' }}
          >
            <Github size={isMobile ? 12 : 14} />
          </a>
          <a
            href="mailto:l89192164@gmail.com"
            style={{ color: colors.footerText, display: 'flex' }}
          >
            <Mail size={isMobile ? 12 : 14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
