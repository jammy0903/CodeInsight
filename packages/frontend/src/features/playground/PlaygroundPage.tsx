/**
 * PlaygroundPage - Code Simulator (Theme Support)
 * Left 50%: Code Editor + Explanation
 * Right 50%: Memory Visualization
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useIsMobile } from '@/hooks';
import { Cpu, Github, Mail, Play } from 'lucide-react';
import { LanguageTabs } from './components/LanguageTabs';
import { CodeEditor } from './components/CodeEditor';
import { StepControls } from './components/StepControls';
import { StepExplanation } from './components/StepExplanation';
import { MemoryPanel } from '@/features/courses/components/memory';
import { useLessonVisualization } from '@/features/courses/hooks/useLessonVisualization';
import { useStepGestures } from '@/features/courses/hooks/useStepGestures';
import { useEnterKey } from '@/hooks/useEnterKey';
import { usePlaygroundStore, useCurrentCode, useStepControls } from './stores/playgroundStore';
import { useExplanationStore } from './stores/explanationStore';
import { PyVisualizerView } from '@/features/visualizers/python';
import { JavaMemoryView } from '@/features/visualizers/java';
import { JSVisualizerView } from '@/features/visualizers/js';
import { LessonFlowVisualizer } from '@/features/visualizers/flow';
import { useThemeStore } from '@/stores/themeStore';
import { useStore } from '@/stores/store';
import type { LessonStep } from '@/types';

// 테마별 Playground 색상
const playgroundColors = {
  dark: {
    // 배경 (남색 기반)
    pageBg: '#0a0f1a',           // deep navy
    panelBg: '#0d1525',          // navy panel
    headerBg: '#0d1525',
    // 보더
    border: '#1a2540',           // navy border
    resizeHandle: '#1a2d4a',     // navy handle
    resizeHover: '#2a3d5a',      // navy hover
    // 텍스트
    text: '#e8f0ff',             // bright white-blue
    textMuted: '#b8c8e8',        // light blue-gray
    textDim: '#8ba3cf',          // medium blue-gray
    // 악센트 (네온 시안)
    accent: '#00ffff',           // neon cyan
    accentBg: '#0a2040',         // dark cyan bg
    accentBorder: '#00aaff',     // bright cyan border
    // 설명 패널 (네온 시안 계열)
    explanationBg: '#081820',
    explanationHeaderBg: '#0a2540',
    explanationBorder: '#00aaff',
    explanationText: '#00ffff',
    explanationTextMuted: '#00ddff',
    // 에러
    errorBg: '#180810',
    errorBorder: '#ff3366',
    errorText: '#ff5577',
    // 푸터
    footerBg: '#080d18',
    footerBorder: '#1a2540',
    footerText: '#b8c8e8',
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
  const { setPageTitle } = useStore();
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = playgroundColors[currentTheme];
  const isMobile = useIsMobile();
  const { nextStep, prevStep, canGoNext, canGoPrev } = useStepControls();

  const currentStep = steps[currentStepIndex];
  const hasSteps = steps.length > 0;
  const [activeTab, setActiveTab] = useState<'flow' | 'memory'>('flow');

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle('코드 실행 연습', '직접 코드를 작성하고 메모리 변화를 확인해보세요');
  }, [setPageTitle]);

  // 키보드 좌우 화살표 키로 스텝 이동
  useStepGestures({
    onPrev: prevStep,
    onNext: nextStep,
    enabled: hasSteps,
    canGoPrev,
    canGoNext,
  });

  // Enter 키로 Run 버튼 실행
  useEnterKey({
    onEnter: () => {
      (document.getElementById('playground-run-button') as HTMLButtonElement)?.click();
    },
    enabled: true, // 항상 활성화 (훅 내부에서 입력창 포커스 시 자동 비활성화)
  });

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
  const { memoryState, changedBlocks, visualizationType, visualizationState } = useLessonVisualization(
    steps as LessonStep[],
    currentStepIndex
  );

  // 모바일 레이아웃: PanelGroup 없이 단순 스택
  if (isMobile) {
    return (
      <div style={{ backgroundColor: colors.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Code Section */}
        <div style={{ backgroundColor: colors.panelBg, flexShrink: 0 }}>
          {/* Header */}
          <div
            style={{
              height: '40px',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
              gap: '4px',
            }}
          >
            <LanguageTabs isMobile={true} />
            {/* Run + Reset + Navigation 버튼 (헤더) */}
            <StepControls isMobile={true} showRun={true} showReset={true} showNavigation={true} />
          </div>

          {/* Editor */}
          <div style={{ height: `${Math.min(editorHeight, 180)}px` }}>
            <CodeEditor />
          </div>

          {/* Explanation */}
          {currentStep && (
            <div style={{ padding: '6px 8px 8px' }}>
              <div
                style={{
                  backgroundColor: colors.explanationBg,
                  borderRadius: '6px',
                  border: `1px solid ${colors.explanationBorder}`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: colors.explanationHeaderBg,
                    borderBottom: `1px solid ${colors.explanationBorder}`,
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '12px' }}>💡</span>
                  <span style={{ fontSize: '10px', color: colors.explanationText, fontWeight: 600 }}>Explanation</span>
                  <span style={{ fontSize: '9px', color: colors.explanationTextMuted, marginLeft: 'auto', fontFamily: 'monospace' }}>
                    Line {currentStep.line}
                  </span>
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <StepExplanation step={currentStep} isMobile={true} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visualization Section (Flow + Memory Tabs) - 컨텐츠에 따라 늘어남 */}
        <div style={{ backgroundColor: colors.panelBg, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          {/* Tab Header */}
          <div
            style={{
              height: '36px',
              padding: '0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
            }}
          >
            {/* Flow Tab */}
            <button
              onClick={() => setActiveTab('flow')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'flow' ? colors.accentBg : 'transparent',
                color: activeTab === 'flow' ? colors.accent : colors.textMuted,
              }}
            >
              <Play size={12} />
              Flow
            </button>

            {/* Memory Tab */}
            <button
              onClick={() => setActiveTab('memory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === 'memory' ? colors.accentBg : 'transparent',
                color: activeTab === 'memory' ? colors.accent : colors.textMuted,
              }}
            >
              <Cpu size={12} />
              Memory
            </button>

            {hasSteps && (
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '2px 6px',
                  fontSize: '10px',
                  color: colors.accent,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  background: colors.accentBg,
                  borderRadius: '4px',
                  border: `1px solid ${colors.accentBorder}`,
                }}
              >
                {currentStepIndex + 1}/{steps.length}
              </span>
            )}
          </div>

          {/* Tab Content - 컨텐츠에 따라 늘어남 */}
          <div style={{ padding: '8px', minHeight: '200px' }}>
            {error ? (
              <div style={{ padding: '10px', backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: '6px' }}>
                <p style={{ fontSize: '12px', color: colors.errorText }}>{error}</p>
              </div>
            ) : activeTab === 'flow' ? (
              /* Flow Tab Content */
              (language === 'c' || language === 'python' || language === 'java') && hasSteps ? (
                <LessonFlowVisualizer
                  step={currentStep as LessonStep}
                  prevStep={currentStepIndex > 0 ? steps[currentStepIndex - 1] as LessonStep : null}
                  language={language}
                  fullCode={code}
                  theme={currentTheme === 'dark' ? 'dark' : 'light'}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', fontSize: '12px', color: colors.textMuted }}>
                  Run 버튼을 눌러 실행
                </div>
              )
            ) : (
              /* Memory Tab Content */
              language === 'python' && hasSteps ? (
                <PyVisualizerView names={currentStep?.pyNames || []} objects={currentStep?.pyObjects || []} animate={true} />
              ) : language === 'c' && hasSteps ? (
                <MemoryPanel
                  stack={memoryState.stack}
                  heap={memoryState.heap}
                  changedBlocks={changedBlocks}
                  frames={memoryState.frames}
                  showRegisters={!!registers?.rsp || !!registers?.rbp}
                />
              ) : language === 'java' && hasSteps ? (
                <JavaMemoryView
                  currentStep={currentStep as any}
                  theme={currentTheme}
                />
              ) : language === 'javascript' && hasSteps ? (
                <JSVisualizerView state={visualizationState} type={visualizationType} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', fontSize: '12px', color: colors.textMuted }}>
                  Run 버튼을 눌러 실행
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: '6px 12px',
            backgroundColor: colors.footerBg,
            borderTop: `1px solid ${colors.footerBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '10px', color: colors.footerText }}>CodeInsight 2026</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <a href="https://github.com/jammy0903" target="_blank" rel="noopener noreferrer" style={{ color: colors.footerText, display: 'flex' }}>
              <Github size={12} />
            </a>
            <a href="mailto:l89192164@gmail.com" style={{ color: colors.footerText, display: 'flex' }}>
              <Mail size={12} />
            </a>
          </div>
        </footer>
      </div>
    );
  }

  // 데스크톱 레이아웃: Flex (LessonPage 스타일 - sticky 지원)
  return (
    <div
      style={{
        backgroundColor: colors.pageBg,
        padding: '8px 16px 16px',
      }}
    >
      {/* Main area: Flex 2-column layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          alignItems: 'flex-start', // sticky 작동을 위해 필수
        }}
      >
        {/* ===== Left Panel: Code Editor + Explanation ===== */}
        <div
          style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.panelBg,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            overflow: 'visible', // sticky 동작을 위해
            minHeight: '400px',
          }}
        >
          {/* Code Header */}
          <div
            style={{
              height: '48px',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
              flexShrink: 0,
              gap: '8px',
            }}
          >
            <LanguageTabs />
            {/* Run + Reset + Navigation 버튼 (헤더) */}
            <StepControls showRun={true} showReset={true} showNavigation={true} />
          </div>

          {/* Editor */}
          <div style={{ height: `${editorHeight}px`, flexShrink: 0 }}>
            <CodeEditor />
          </div>

          {/* Explanation Panel */}
          {currentStep && (
            <div
              style={{
                flexShrink: 0,
                padding: '8px 12px 12px',
                backgroundColor: colors.panelBg,
              }}
            >
              <div
                style={{
                  backgroundColor: colors.explanationBg,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: currentTheme === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(34, 197, 94, 0.12)',
                  border: `1px solid ${colors.explanationBorder}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 12px',
                    backgroundColor: colors.explanationHeaderBg,
                    borderBottom: `1px solid ${colors.explanationBorder}`,
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '14px' }}>💡</span>
                  <span style={{ fontSize: '11px', color: colors.explanationText, fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>
                    Explanation
                  </span>
                  <span style={{ fontSize: '10px', color: colors.explanationTextMuted, marginLeft: 'auto', fontFamily: 'monospace' }}>
                    Line {currentStep.line}
                  </span>
                </div>
                <div style={{ padding: '10px 14px' }}>
                  <StepExplanation step={currentStep} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Right Panel: Flow + Memory Tabs - 컨텐츠에 따라 늘어남 ===== */}
        <div
          style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.panelBg,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            position: 'sticky',
            top: '16px',
            zIndex: 10,
          }}
        >
          {/* Tab Header */}
          <div
            style={{
              height: '48px',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
              flexShrink: 0,
            }}
          >
            {/* Flow Tab */}
            <button
              onClick={() => setActiveTab('flow')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px 8px 0 0',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'flow' ? colors.accentBg : 'transparent',
                color: activeTab === 'flow' ? colors.accent : colors.textMuted,
                borderBottom: activeTab === 'flow' ? `2px solid ${colors.accent}` : '2px solid transparent',
              }}
            >
              <Play size={14} />
              Flow
            </button>

            {/* Memory Tab */}
            <button
              onClick={() => setActiveTab('memory')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px 8px 0 0',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'memory' ? colors.accentBg : 'transparent',
                color: activeTab === 'memory' ? colors.accent : colors.textMuted,
                borderBottom: activeTab === 'memory' ? `2px solid ${colors.accent}` : '2px solid transparent',
              }}
            >
              <Cpu size={14} />
              Memory
            </button>

            {/* Step Counter */}
            {hasSteps && (
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: colors.accent,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  background: colors.accentBg,
                  borderRadius: '6px',
                  border: `1px solid ${colors.accentBorder}`,
                }}
              >
                {currentStepIndex + 1}/{steps.length}
              </span>
            )}
          </div>

          {/* Tab Content - 컨텐츠에 따라 늘어남 */}
          <div style={{ padding: '16px' }}>
            {error ? (
              <div style={{ padding: '16px', backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: colors.errorText }}>{error}</p>
              </div>
            ) : activeTab === 'flow' ? (
              /* Flow Tab Content */
              (language === 'c' || language === 'python' || language === 'java') && hasSteps ? (
                <LessonFlowVisualizer
                  step={currentStep as LessonStep}
                  prevStep={currentStepIndex > 0 ? steps[currentStepIndex - 1] as LessonStep : null}
                  language={language}
                  fullCode={code}
                  theme={currentTheme === 'dark' ? 'dark' : 'light'}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', fontSize: '14px', color: colors.textMuted }}>
                  Click Run button to execute code
                </div>
              )
            ) : (
              /* Memory Tab Content */
              language === 'python' && hasSteps ? (
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
              ) : language === 'java' && hasSteps ? (
                <JavaMemoryView
                  currentStep={currentStep as any}
                  theme={currentTheme}
                />
              ) : language === 'javascript' && hasSteps ? (
                <JSVisualizerView state={visualizationState} type={visualizationType} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', fontSize: '14px', color: colors.textMuted }}>
                  Click Run button to execute code
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          padding: '8px 24px',
          backgroundColor: colors.footerBg,
          borderTop: `1px solid ${colors.footerBorder}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '11px', color: colors.footerText }}>CodeInsight 2026</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="https://github.com/jammy0903" target="_blank" rel="noopener noreferrer" style={{ color: colors.footerText, display: 'flex' }}>
            <Github size={14} />
          </a>
          <a href="mailto:l89192164@gmail.com" style={{ color: colors.footerText, display: 'flex' }}>
            <Mail size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
