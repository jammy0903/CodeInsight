/**
 * PlaygroundPage - Code Simulator (Theme Support)
 * Left 50%: Code Editor + Explanation
 * Right 50%: Memory Visualization
 */

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks';
import { Play, Layers } from 'lucide-react';
import { LanguageTabs } from './components/LanguageTabs';
import { CodeEditor } from './components/CodeEditor';
import { StepControls } from './components/StepControls';
import { StepExplanation } from './components/StepExplanation';
import { useLessonVisualization } from '@/features/courses/hooks/useLessonVisualization';
import { useStepGestures } from '@/features/courses/hooks/useStepGestures';
import { usePlaygroundStore, useCurrentCode, useStepControls } from './stores/playgroundStore';
import { useExplanationStore } from './stores/explanationStore';
import { LessonFlowVisualizer } from '@/features/visualizers/flow';
import { LessonMemoryVisualizer } from '@/features/visualizers/memory';
import { TerminalOutput, type TerminalLine } from '@/features/visualizers/shared';
import { StepNavigationArrows } from '@/features/courses/components/StepNavigationArrows';
import { useThemeStore } from '@/stores/themeStore';
import { useStore } from '@/stores/store';
import type { LessonStep } from '@/types';
import { playgroundColors } from './styles/playgroundTheme';
import { PlaygroundFooter } from './components/PlaygroundFooter';

const LINE_HEIGHT = 19;
const MIN_EDITOR_HEIGHT = 150;
const MAX_EDITOR_HEIGHT = 500;

export function PlaygroundPage() {
  const { t } = useTranslation();
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

  // DEBUG: 현재 step 확인
  useEffect(() => {
    if (currentStep) {
      console.log('[PlaygroundPage] Current step:', {
        index: currentStepIndex,
        line: currentStep.line,
        code: currentStep.code?.substring(0, 30),
        explanation: currentStep.explanation?.substring(0, 40),
      });
    }
  }, [currentStepIndex, currentStep]);

  // Flow/Memory 탭 상태
  const [activeTab, setActiveTab] = useState<'flow' | 'memory'>('flow');

  // 터미널 출력 라인 변환
  const terminalLines = useMemo((): TerminalLine[] => {
    if (!currentStep?.stdout) return [];
    return currentStep.stdout
      .split('\n')
      .filter(Boolean)
      .map((line): TerminalLine => ({ content: line, type: 'stdout' }));
  }, [currentStep?.stdout]);

  // Memory 탭 표시 여부 (Java, C만)
  const showMemoryTab = language === 'java' || language === 'c';


  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle(t('playground.title'), t('playground.subtitle'));
  }, [setPageTitle, t]);

  // 키보드 좌우 화살표 키로 스텝 이동
  useStepGestures({
    onPrev: prevStep,
    onNext: nextStep,
    enabled: hasSteps,
    canGoPrev,
    canGoNext,
  });

  // Enter 키로 Run 버튼 실행 - DISABLED (코드 에디터에서 Enter는 줄바꿈용)
  // useEnterKey({
  //   onEnter: () => {
  //     (document.getElementById('playground-run-button') as HTMLButtonElement)?.click();
  //   },
  //   enabled: true, // 항상 활성화 (훅 내부에서 입력창 포커스 시 자동 비활성화)
  // });

  // Calculate editor height based on code lines
  const editorHeight = useMemo(() => {
    const lineCount = code.split('\n').length;
    const calculated = lineCount * LINE_HEIGHT + 40; // 40px padding
    return Math.max(MIN_EDITOR_HEIGHT, Math.min(calculated, MAX_EDITOR_HEIGHT));
  }, [code]);

  // Start AI explanation prefetch when simulation steps change
  useEffect(() => {
    if (steps.length > 0 && code) {
      startPrefetch(steps as LessonStep[], code, language);
    }
    return () => {
      stopPrefetch();
    };
  }, [steps, code, language, startPrefetch, stopPrefetch]);

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
            {/* Run + Reset + Navigation 버튼 (하단에도 추가로 표시) */}
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

        {/* Visualization Section - Flow Only */}
        <div style={{ backgroundColor: colors.panelBg, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          {/* Header: Flow/Memory 탭 */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
            }}
          >
            <button
              onClick={() => setActiveTab('flow')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: activeTab === 'flow' ? colors.accent : 'transparent',
                color: activeTab === 'flow' ? '#fff' : colors.textMuted,
                border: 'none',
                borderRight: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Play size={12} />
              Flow
            </button>
            {showMemoryTab && (
              <button
                onClick={() => setActiveTab('memory')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'memory' ? colors.accent : 'transparent',
                  color: activeTab === 'memory' ? '#fff' : colors.textMuted,
                  border: 'none',
                  borderRight: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Layers size={12} />
                Memory
              </button>
            )}
            {hasSteps && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  fontSize: '10px',
                  color: colors.accent,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  background: colors.accentBg,
                }}
              >
                {currentStepIndex + 1}/{steps.length}
              </span>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '8px', minHeight: '200px' }}>
            {error ? (
              <div style={{ padding: '10px', backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: '6px' }}>
                <p style={{ fontSize: '12px', color: colors.errorText }}>{error}</p>
              </div>
            ) : (language === 'c' || language === 'python' || language === 'java') && hasSteps ? (
              <>
                {activeTab === 'flow' ? (
                  <LessonFlowVisualizer
                    step={currentStep as LessonStep}
                    prevStep={currentStepIndex > 0 ? steps[currentStepIndex - 1] as LessonStep : null}
                    language={language}
                    fullCode={code}
                    theme={currentTheme === 'dark' ? 'dark' : 'light'}
                    stdout={currentStep?.stdout}
                  />
                ) : (
                  <>
                    <LessonMemoryVisualizer
                      step={currentStep as LessonStep}
                      language={language}
                      memoryState={memoryState}
                      changedBlocks={changedBlocks}
                    />
                    {terminalLines.length > 0 && (
                      <TerminalOutput
                        lines={terminalLines}
                        title={t('playground.output')}
                        compact
                        className="mt-4"
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', fontSize: '12px', color: colors.textMuted }}>
                {t('playground.click_run')}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar (모바일 전용 - 항상 표시) */}
        {isMobile && hasSteps && (
          <div
            style={{
              position: 'fixed',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              padding: '6px 12px',
              backgroundColor: currentTheme === 'dark'
                ? 'rgba(13, 21, 37, 0.85)'  // dark navy with transparency
                : 'rgba(255, 255, 255, 0.85)',  // white with transparency
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',  // Safari support
              borderRadius: '20px',
              border: `1px solid ${currentTheme === 'dark'
                ? 'rgba(26, 37, 64, 0.6)'
                : 'rgba(229, 229, 229, 0.6)'}`,
              boxShadow: currentTheme === 'dark'
                ? '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                : '0 4px 24px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              maxWidth: '320px',
            }}
          >
            <div style={{ transform: 'scale(0.85)' }}>
              <StepNavigationArrows
                onPrev={prevStep}
                onNext={nextStep}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                nextLabel={t('common.next')}
                size="sm"
                variant="inline"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <PlaygroundFooter colors={colors} isMobile />
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
          {/* Header: Flow/Memory 탭 */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.headerBg,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setActiveTab('flow')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: activeTab === 'flow' ? colors.accent : 'transparent',
                color: activeTab === 'flow' ? '#fff' : colors.textMuted,
                border: 'none',
                borderRight: `1px solid ${colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Play size={14} />
              Flow
            </button>
            {showMemoryTab && (
              <button
                onClick={() => setActiveTab('memory')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'memory' ? colors.accent : 'transparent',
                  color: activeTab === 'memory' ? '#fff' : colors.textMuted,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Layers size={14} />
                Memory
              </button>
            )}
            {hasSteps && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  fontSize: '12px',
                  color: colors.accent,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  background: colors.accentBg,
                  borderLeft: `1px solid ${colors.border}`,
                }}
              >
                {currentStepIndex + 1}/{steps.length}
              </span>
            )}
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {error ? (
              <div style={{ padding: '16px', backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: colors.errorText }}>{error}</p>
              </div>
            ) : (language === 'c' || language === 'python' || language === 'java') && hasSteps ? (
              <>
                {activeTab === 'flow' ? (
                  <LessonFlowVisualizer
                    step={currentStep as LessonStep}
                    prevStep={currentStepIndex > 0 ? steps[currentStepIndex - 1] as LessonStep : null}
                    language={language}
                    fullCode={code}
                    theme={currentTheme === 'dark' ? 'dark' : 'light'}
                    stdout={currentStep?.stdout}
                  />
                ) : (
                  <>
                    <LessonMemoryVisualizer
                      step={currentStep as LessonStep}
                      language={language}
                      memoryState={memoryState}
                      changedBlocks={changedBlocks}
                    />
                    {terminalLines.length > 0 && (
                      <TerminalOutput
                        lines={terminalLines}
                        title={t('playground.output')}
                        compact
                        className="mt-6"
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', fontSize: '14px', color: colors.textMuted }}>
                {t('playground.click_run')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <PlaygroundFooter colors={colors} />
    </div>
  );
}
