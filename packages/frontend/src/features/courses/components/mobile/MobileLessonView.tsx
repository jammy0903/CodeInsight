/**
 * MobileLessonView - 모바일 레슨 통합 레이아웃
 *
 * 모든 언어(C, Python, Java, JS, ML 등)에서 동일한 구조 사용
 * 슬라이딩 2페이지:
 * - 페이지 1: 설명 + 코드 + 출력
 * - 페이지 2: 설명 + 시각화 (메모리 or 플로우)
 */

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Play, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { useStepGestures } from '../../hooks/useStepGestures';
import { useLessonVisualization } from '../../hooks/useLessonVisualization';
import { useSlidingPages } from '@/hooks/useSlidingPages';
import { LessonCodeEditor } from '../day/LessonCodeEditor';
import { MemoryPanel } from '../memory/MemoryPanel';

import { LessonFlowVisualizer } from '@/features/visualizers/flow';
import { JavaMemoryView, toJavaMemoryViewProps } from '@/features/visualizers/java';
import { TerminalOutput, type TerminalLine } from '@/features/visualizers/shared';
import { MobileAIChatFAB } from './MobileAIChatFAB';
import { MobileAIChatModal } from './MobileAIChatModal';
import type { LessonStep } from '@/types';

interface MobileLessonViewProps {
  code: string;
  steps: LessonStep[];
  currentStepIndex: number;
  languageId: string;
  lessonId: string;
  lessonTitle?: string;
  lessonOrder?: number;
  // 스텝 네비게이션
  onPrevStep: () => void;
  onNextStep: () => void;
  onQuiz?: () => void;
}

// 언어별 코드 이름 반환
function getCodeName(languageId: string): string {
  if (languageId.includes('python')) return 'Python 코드';
  if (languageId.includes('java')) return 'Java 코드';
  if (languageId.includes('javascript') || languageId.includes('js')) return 'JavaScript 코드';
  return 'C 코드';
}

export function MobileLessonView({
  code,
  steps,
  currentStepIndex,
  languageId,
  lessonId,
  lessonTitle,
  lessonOrder,
  onPrevStep,
  onNextStep,
  onQuiz,
}: MobileLessonViewProps) {
  // useSlidingPages 훅을 사용하여 슬라이딩 로직 위임
  const {
    currentPage,
    setCurrentPage,
    handleDragEnd
  } = useSlidingPages({ totalPages: 2 });

  // Variants 정의: 매직 넘버 제거 및 명확한 상태 정의
  const slideVariants = {
    code: { x: 0 },
    visual: { x: '-50%' }
  };

  // 시각화 탭 전환 Variants (Flow ↔ Memory)
  const visualizationVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 }
    }
  };

  const isAIChatOpenState = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = isAIChatOpenState;

  const [isExplanationCollapsed, setIsExplanationCollapsed] = useState(false);
  const [activeVisualizationTab, setActiveVisualizationTab] = useState<'flow' | 'memory'>('flow');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const codeName = getCodeName(languageId);
  const isLastStep = currentStepIndex >= steps.length - 1;

  // 데스크톱과 동일한 시각화 훅 사용
  const { memoryState, changedBlocks } = useLessonVisualization(
    steps,
    currentStepIndex
  );

  // 터미널 출력 라인 변환 (데스크톱과 동일)
  const terminalLines = useMemo((): TerminalLine[] => {
    if (!currentStep?.stdout) return [];
    return currentStep.stdout
      .split('\n')
      .filter(Boolean)
      .map((line): TerminalLine => ({ content: line, type: 'stdout' }));
  }, [currentStep?.stdout]);

  // Memory 탭 표시 여부 (Java, C만)
  const showMemoryTab = languageId === 'java' || languageId === 'c';

  // 스텝 제스처 (키보드 ← →, 탭/클릭)
  const { handleTapArea } = useStepGestures({
    onPrev: onPrevStep,
    onNext: isLastStep && onQuiz ? onQuiz : onNextStep,
    enabled: true,
    isModalOpen: isAIChatOpen,
    canGoPrev: currentStepIndex > 0,
    canGoNext: !isLastStep || !!onQuiz,
  });

  // 설명 텍스트에서 **굵게** 와 `코드`를 강조 처리
  const formatExplanation = (text: string) => {
    // **bold** 와 `code` 패턴 모두 처리
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      // **굵게** 처리 - 배경 + 진한 색상으로 확실히 구분
      if (part.startsWith('**') && part.endsWith('**')) {
        const keyword = part.slice(2, -2);
        return (
          <span key={i} className="font-bold px-1 rounded" style={{ color: 'var(--theme-explanation-text)', backgroundColor: 'var(--theme-memory-changed-bg)' }}>
            {keyword}
          </span>
        );
      }
      // `코드` 처리
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={i} className="font-mono font-bold px-1 rounded text-sm" style={{ color: 'var(--theme-memory-register-rbp-text)', backgroundColor: 'var(--theme-memory-register-rbp-bg)' }}>
            {code}
          </code>
        );
      }
      return part;
    });
  };

  // 설명 컴포넌트 (접기/펼치기 기능 포함)
  const ExplanationSection = ({ canCollapse }: { canCollapse: boolean }) => (
    <div className="rounded-md border border-[var(--theme-lesson-panel-border)] overflow-hidden" style={{ fontFamily: 'NationalPension, cursive', fontWeight: 'normal', backgroundColor: 'var(--theme-lesson-panel-bg)' }}>
      {/* 설명 헤더 (접기/펼치기 버튼 포함) */}
      <div
        className="flex items-center gap-1 px-1.5 py-1"
        style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
      >
        <span className="shrink-0 px-1 py-0.5 rounded text-white text-[9px] font-bold leading-none" style={{ fontFamily: 'var(--font-sans)', backgroundColor: 'var(--theme-explanation-text)' }}>
          L{currentStep?.line || 1}
        </span>
        <span className="text-[10px] font-semibold text-amber-800">설명</span>
        {canCollapse && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExplanationCollapsed(!isExplanationCollapsed);
            }}
            className="ml-auto p-0.5 rounded hover:bg-amber-200/50 transition-colors"
          >
            {isExplanationCollapsed ? (
              <ChevronUp className="w-3 h-3 text-amber-700" />
            ) : (
              <ChevronDown className="w-3 h-3 text-amber-700" />
            )}
          </button>
        )}
      </div>
      {/* 설명 내용 (접혔을 때 숨김) */}
      {!isExplanationCollapsed && (
        <div className="p-1.5">
          <span className="text-xs leading-snug whitespace-pre-wrap" style={{ color: 'var(--theme-explanation-text)' }}>
            {currentStep?.explanation ? formatExplanation(currentStep.explanation) : '설명이 없습니다'}
          </span>
          {currentStep?.tip && (
            <div className="mt-1 pl-1 border-l-2 border-l-[var(--theme-memory-changed-border)]">
              <span className="text-[10px]" style={{ color: 'var(--theme-memory-changed-border)' }}>💡 </span>
              <span className="text-[10px] whitespace-pre-wrap" style={{ color: 'var(--theme-explanation-text)' }}>{currentStep.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* 스와이프 컨테이너 */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <motion.div
          drag="x"
          dragConstraints={{ left: -300, right: 300 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          variants={slideVariants}
          animate={currentPage === 0 ? "code" : "visual"}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex h-full"
          style={{ width: '200%' }}
        >
          {/* 페이지 1: 코드 + 설명 */}
          {(() => {
            // 코드 줄 수 계산 (10줄 기준 - 모바일/데스크톱 통일)
            const lineCount = code.split('\n').length;
            const LINE_HEIGHT = 18; // 모바일은 약간 작은 줄 높이
            const MAX_VISIBLE_LINES = 10;
            const visibleLines = Math.min(lineCount, MAX_VISIBLE_LINES);
            const codeEditorHeight = visibleLines * LINE_HEIGHT;
            const hasScroll = lineCount > MAX_VISIBLE_LINES;
            // 7줄 이상일 때만 접기 버튼 표시 (빈 공간 방지)
            const canCollapse = lineCount > 6;

            return (
              <div className="w-1/2 h-full p-1 flex flex-col" onClick={handleTapArea}>
                {/* 코드 뷰어 (접혔을 때: flex-1로 확장, 펼쳤을 때: 동적 높이) */}
                <div
                  className={`rounded-lg border border-[var(--theme-lesson-panel-border)] overflow-hidden flex flex-col ${isExplanationCollapsed ? 'flex-1' : 'shrink-0'}`}
                  style={{ backgroundColor: 'var(--theme-lesson-panel-bg)' }}
                >
                  <div className="px-2 py-1 bg-gradient-to-r from-[#2d2d2d] to-[#1a1a1a] text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                    <Code2 className="w-3 h-3" />
                    {codeName}
                    <span className="ml-auto opacity-60">{lineCount}줄</span>
                  </div>
                  <div
                    className={`${isExplanationCollapsed ? 'flex-1' : ''} ${hasScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}
                    style={isExplanationCollapsed
                      ? { minHeight: `${codeEditorHeight}px` }
                      : { height: `${codeEditorHeight}px` }
                    }
                  >
                    <LessonCodeEditor
                      code={code}
                      highlightLine={currentStep?.line || 1}
                    />
                  </div>
                </div>

                {/* 설명 (접혔을 때: shrink-0, 펼쳤을 때: flex-1) */}
                <div className={`${isExplanationCollapsed ? 'shrink-0' : 'flex-1 min-h-0 overflow-y-auto'} mt-1`}>
                  <ExplanationSection canCollapse={canCollapse} />
                </div>
              </div>
            );
          })()}

          {/* 페이지 2: Flow/Memory 시각화 */}
          <div className="w-1/2 h-full p-1" onClick={handleTapArea}>
            <div className="h-full rounded-lg border border-[var(--theme-lesson-panel-border)] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--theme-lesson-panel-bg)' }}>
              {/* 헤더: Flow/Memory 탭 버튼 */}
              <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--theme-lesson-panel-border)' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVisualizationTab('flow');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    background: activeVisualizationTab === 'flow'
                      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : 'var(--theme-lesson-tab-inactive-bg)',
                    color: activeVisualizationTab === 'flow' ? '#fff' : 'var(--theme-lesson-tab-inactive-text)',
                    borderRight: '1px solid var(--theme-lesson-panel-border)',
                  }}
                >
                  <Play className="w-3 h-3" />
                  Flow
                </button>
                {showMemoryTab && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVisualizationTab('memory');
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: activeVisualizationTab === 'memory'
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : 'var(--theme-lesson-tab-inactive-bg)',
                      color: activeVisualizationTab === 'memory' ? '#fff' : 'var(--theme-lesson-tab-inactive-text)',
                    }}
                  >
                    <Layers className="w-3 h-3" />
                    Memory
                  </button>
                )}
              </div>

              {/* 콘텐츠: AnimatePresence + variants로 전환 */}
              <div className="flex-1 overflow-y-auto p-2 relative">
                <AnimatePresence mode="wait">
                  {activeVisualizationTab === 'flow' ? (
                    <motion.div
                      key="flow"
                      variants={visualizationVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="w-full"
                    >
                      <LessonFlowVisualizer
                        step={currentStep}
                        prevStep={currentStepIndex > 0 ? steps[currentStepIndex - 1] : null}
                        language={languageId === 'python-practical' ? 'python' : (languageId as 'c' | 'python' | 'java')}
                        fullCode={code}
                        theme="light"
                        memoryState={memoryState ? {
                          stack: memoryState.stack.map(s => ({ ...s, name: s.name || '?' })),
                          heap: memoryState.heap.map(h => ({ ...h, name: h.name || '?' })),
                          frames: memoryState.frames.map(f => ({ ...f, name: f.name || '?' }))
                        } : undefined}
                        stdout={currentStep?.stdout}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="memory"
                      variants={visualizationVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="w-full"
                    >
                      {languageId === 'java' ? (
                        <>
                          <JavaMemoryView {...toJavaMemoryViewProps(currentStep)} />
                          {terminalLines.length > 0 && (
                            <TerminalOutput
                              lines={terminalLines}
                              title="출력"
                              compact
                              className="mt-4"
                            />
                          )}
                        </>
                      ) : languageId === 'c' && memoryState ? (
                        <>
                          <MemoryPanel
                            stack={memoryState.stack}
                            heap={memoryState.heap}
                            changedBlocks={changedBlocks}
                            frames={memoryState.frames}
                            showRegisters={true}
                          />
                          {terminalLines.length > 0 && (
                            <TerminalOutput
                              lines={terminalLines}
                              title="출력"
                              compact
                              className="mt-4"
                            />
                          )}
                        </>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 페이지 인디케이터 - 코드/시각화 전환 */}
      <div className="flex items-center justify-center px-2 py-1.5 border-t border-t-[var(--theme-lesson-panel-border)]" style={{ backgroundColor: 'var(--theme-lesson-panel-bg)' }}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(0)}
            className={`w-2 h-2 rounded-full transition-all ${currentPage === 0 ? 'w-4' : ''
              }`}
            style={{
              backgroundColor: currentPage === 0
                ? 'var(--theme-explanation-text)'
                : 'var(--theme-lesson-tab-inactive-bg)'
            }}
            aria-label="코드 페이지"
          />
          <button
            onClick={() => setCurrentPage(1)}
            className={`w-2 h-2 rounded-full transition-all ${currentPage === 1 ? 'w-4' : ''
              }`}
            style={{
              backgroundColor: currentPage === 1
                ? 'var(--theme-explanation-text)'
                : 'var(--theme-lesson-tab-inactive-bg)'
            }}
            aria-label="시각화 페이지"
          />
        </div>
      </div>

      {/* AI Chat FAB + Modal */}
      <MobileAIChatFAB
        isOpen={isAIChatOpen}
        onClick={() => setIsAIChatOpen(!isAIChatOpen)}
      />
      <MobileAIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        context={{
          courseDay: lessonOrder,
          topic: lessonTitle,
          code: code,
          currentLine: currentStep?.line,
        }}
        lessonId={lessonId}
      />
    </div>
  );
}
