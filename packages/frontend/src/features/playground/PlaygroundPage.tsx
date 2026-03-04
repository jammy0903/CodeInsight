/**
 * PlaygroundPage - Code Simulator (Theme Support)
 * Left 50%: Code Editor + Explanation
 * Right 50%: Memory Visualization
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks';
import { Play, Layers, ChevronDown, ChevronRight as ChevronRightIcon, ChevronLeft, ChevronRight, Terminal } from 'lucide-react';
import { LanguageTabs } from './components/LanguageTabs';
import { CodeMirrorEditor } from '@/features/visualizers/shared/components/CodeMirrorEditor';
import { StepControls } from './components/StepControls';
import { useLessonVisualization } from '@/features/courses';
import { useStepGestures } from '@/features/visualizers/shared/hooks/useStepGestures';
import { usePlaygroundStore, useCurrentCode, useStepControls } from './stores/playgroundStore';
import { LessonFlowVisualizer, LessonMemoryVisualizer } from '@/features/visualizers';
import { useLessonTerminal, TerminalOutput } from '@/features/visualizers/shared';
import { StepNavigationArrows } from '@/features/visualizers/shared/components/StepNavigationArrows';
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
  const { steps, currentStepIndex, error, language, setCode, stdins, setStdin } = usePlaygroundStore();
  const code = useCurrentCode();
  const setPageTitle = useStore((s) => s.setPageTitle);
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = playgroundColors[currentTheme];
  const isMobile = useIsMobile();
  const { nextStep, prevStep, canGoNext, canGoPrev } = useStepControls();

  const currentStep = steps[currentStepIndex];
  const hasSteps = steps.length > 0;

  // stdin 접이식 상태
  const [stdinOpen, setStdinOpen] = useState(false);
  const currentStdin = stdins[language] || '';
  const handleStdinChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStdin(e.target.value);
  }, [setStdin]);

  // Flow/Memory 탭 상태
  const [activeTab, setActiveTab] = useState<'flow' | 'memory'>('flow');

  // 터미널 출력 (모든 언어 통합 - useLessonTerminal 훅)
  const terminalLines = useLessonTerminal({
    steps: steps as LessonStep[],
    currentStepIndex,
    languageId: language,
    diffMode: false,
  });

  // Memory 탭 표시 여부 (Java, C만)
  const showMemoryTab = language === 'java' || language === 'c' || language === 'cpp';


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

  // Calculate editor height based on code lines
  const editorHeight = useMemo(() => {
    const lineCount = code.split('\n').length;
    const calculated = lineCount * LINE_HEIGHT + 40; // 40px padding
    return Math.max(MIN_EDITOR_HEIGHT, Math.min(calculated, MAX_EDITOR_HEIGHT));
  }, [code]);

  // Use useLessonVisualization hook (unified Lesson and Playground)
  const { memoryState, changedBlocks } = useLessonVisualization(
    steps as LessonStep[],
    currentStepIndex
  );

  // 모바일 레이아웃: PanelGroup 없이 단순 스택
  if (isMobile) {
    return (
      <div style={{ backgroundColor: colors.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '16px' }}>
        {/* Code Section */}
        <div style={{ backgroundColor: colors.panelBg, flexShrink: 0 }}>
          {/* Header: 모바일 2줄 — 탭 꽉 채움 + 컨트롤 */}
          <div style={{
            backgroundColor: colors.headerBg,
            borderBottom: `1px solid ${colors.border}`,
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <LanguageTabs isMobile={true} />
            <StepControls isMobile={true} showRun={true} showReset={true} showNavigation={true} />
          </div>

          {/* Editor + Terminal (scrollable) */}
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            <div style={{ minHeight: `${Math.min(editorHeight, 180)}px` }}>
              <CodeMirrorEditor
                code={code}
                language={language}
                highlightLine={currentStep?.line}
                editable
                onChange={setCode}
              />
            </div>
            {terminalLines.length > 0 && (
              <TerminalOutput
                lines={terminalLines}
                title={t('playground.output')}
                compact
              />
            )}
          </div>

          {/* stdin 입력 (접이식) */}
          {language === 'c' && (
            <div style={{ borderTop: `1px solid ${colors.border}` }}>
              <button
                onClick={() => setStdinOpen(!stdinOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: currentStdin ? colors.accent : colors.textMuted,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {stdinOpen ? <ChevronDown size={10} /> : <ChevronRightIcon size={10} />}
                <Terminal size={10} />
                Input (stdin)
                {currentStdin && <span style={{ fontSize: '9px', opacity: 0.7 }}>*</span>}
              </button>
              {stdinOpen && (
                <textarea
                  value={currentStdin}
                  onChange={handleStdinChange}
                  placeholder="Enter input values, one per line..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    backgroundColor: colors.panelBg,
                    color: colors.textMuted,
                    border: 'none',
                    borderTop: `1px solid ${colors.border}`,
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '48px',
                    maxHeight: '120px',
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Visualization Section - Flow Only */}
        <div style={{ backgroundColor: colors.panelBg, borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
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
          <div style={{ padding: '3px', minHeight: '67px' }}>
            {error ? (
              <div style={{ padding: '10px', backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: '6px' }}>
                <p style={{ fontSize: '12px', color: colors.errorText }}>{error}</p>
              </div>
            ) : (language === 'c' || language === 'cpp' || language === 'python' || language === 'java') && hasSteps ? (
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
                  <LessonMemoryVisualizer
                    step={currentStep as LessonStep}
                    language={language}
                    memoryState={memoryState}
                    changedBlocks={changedBlocks}
                  />
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50px', fontSize: '12px', color: colors.textMuted }}>
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
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main area: Flex 2-column layout */}
      <div
        style={{
          flex: 1,
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
            overflow: 'hidden',
            minHeight: '133px',
          }}
        >
          {/* Code Header: flex-wrap — 넓으면 1줄, 좁으면 자연스럽게 줄바꿈 */}
          <div style={{
            backgroundColor: colors.headerBg,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0,
            padding: '10px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '10px',
          }}>
            <LanguageTabs />
            <div style={{ width: '1px', height: '22px', background: colors.border, flexShrink: 0 }} />
            <StepControls showRun={true} showReset={true} showNavigation={true} />
          </div>

          {/* Editor + Terminal (scrollable) */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <div style={{ minHeight: `${editorHeight}px` }}>
              <CodeMirrorEditor
                code={code}
                language={language}
                highlightLine={currentStep?.line}
                editable
                onChange={setCode}
              />
            </div>
            {terminalLines.length > 0 && (
              <TerminalOutput
                lines={terminalLines}
                title={t('playground.output')}
                compact
              />
            )}
          </div>

          {/* stdin 입력 (접이식) */}
          {language === 'c' && (
            <div style={{ borderTop: `1px solid ${colors.border}`, flexShrink: 0 }}>
              <button
                onClick={() => setStdinOpen(!stdinOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: currentStdin ? colors.accent : colors.textMuted,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {stdinOpen ? <ChevronDown size={12} /> : <ChevronRightIcon size={12} />}
                <Terminal size={12} />
                Input (stdin)
                {currentStdin && <span style={{ fontSize: '10px', opacity: 0.7 }}>*</span>}
              </button>
              {stdinOpen && (
                <textarea
                  value={currentStdin}
                  onChange={handleStdinChange}
                  placeholder="Enter input values, one per line..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    backgroundColor: colors.panelBg,
                    color: colors.textMuted,
                    border: 'none',
                    borderTop: `1px solid ${colors.border}`,
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '60px',
                    maxHeight: '150px',
                  }}
                />
              )}
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
          <div style={{ padding: '5px' }}>
            {error ? (
              <div style={{ padding: '5px', backgroundColor: colors.errorBg, border: `1px solid ${colors.errorBorder}`, borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: colors.errorText }}>{error}</p>
              </div>
            ) : (language === 'c' || language === 'cpp' || language === 'python' || language === 'java') && hasSteps ? (
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
                  <LessonMemoryVisualizer
                    step={currentStep as LessonStep}
                    language={language}
                    memoryState={memoryState}
                    changedBlocks={changedBlocks}
                  />
                )}
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', fontSize: '14px', color: colors.textMuted }}>
                {t('playground.click_run')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating step nav: 화면 하단 중앙 < > 버튼 */}
      {hasSteps && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            display: 'flex',
            gap: '8px',
          }}
        >
          <button
            onClick={prevStep}
            disabled={!canGoPrev}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canGoPrev ? 'pointer' : 'default',
              backgroundColor: currentTheme === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.10)',
              color: currentTheme === 'dark'
                ? (canGoPrev ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)')
                : (canGoPrev ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'),
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              fontWeight: 600,
              color: currentTheme === 'dark'
                ? 'rgba(255,255,255,0.35)'
                : 'rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              userSelect: 'none',
            }}
          >
            {currentStepIndex + 1}/{steps.length}
          </span>
          <button
            onClick={nextStep}
            disabled={!canGoNext}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canGoNext ? 'pointer' : 'default',
              backgroundColor: currentTheme === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.10)',
              color: currentTheme === 'dark'
                ? (canGoNext ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)')
                : (canGoNext ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.15)'),
              backdropFilter: 'blur(8px)',
              transition: 'all 0.15s',
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Footer */}
      <PlaygroundFooter colors={colors} />
    </div>
  );
}
