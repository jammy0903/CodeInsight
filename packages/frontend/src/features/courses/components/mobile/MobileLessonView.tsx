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
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './MobileLessonView.css';
import { useStepGestures } from '../../hooks/useStepGestures';
import { useLessonVisualization } from '../../hooks/useLessonVisualization';
import { LessonCodeEditor } from '../day/LessonCodeEditor';

import { LessonFlowVisualizer } from '@/features/visualizers/flow';
import { LessonMemoryVisualizer } from '@/features/visualizers/memory';
import { MobileAIChatFAB } from './MobileAIChatFAB';
import { MobileAIChatModal } from './MobileAIChatModal';
import type { TerminalLine } from '@/features/visualizers/shared';
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
  // Swiper 상태
  const [currentPage, setCurrentPage] = useState(0);
  const swiperRef = useRef(null);

  // 시각화 탭 전환 Variants (Flow ↔ Memory)
  const visualizationVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 },
    },
  } as const;

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

  // 터미널 출력 라인 변환 (C/Java/Python 모두 지원)
  const terminalLines = useMemo((): TerminalLine[] => {
    // 1. stdout 우선 (C, Java)
    if (currentStep?.stdout) {
      return currentStep.stdout
        .split('\n')
        .filter(Boolean)
        .map((line): TerminalLine => ({ content: line, type: 'stdout' }));
    }

    // 2. Python: pythonMemoryState.output
    const pythonOutput = (currentStep as any)?.pythonMemoryState?.output;
    if (Array.isArray(pythonOutput)) {
      return pythonOutput.map((line): TerminalLine => ({
        content: String(line),
        type: 'stdout'
      }));
    }

    return [];
  }, [currentStep]);

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
    <div className="h-full rounded-md border border-[var(--theme-lesson-panel-border)] overflow-hidden flex flex-col" style={{ fontFamily: 'NationalPension, cursive', fontWeight: 'normal', backgroundColor: 'var(--theme-lesson-panel-bg)' }}>
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
            className="ml-auto p-0.5 rounded hover:bg-amber-200 bg-opacity-50 transition-colors"
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
        <div className="flex-1 p-1.5 overflow-y-auto">
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
      {/* Swiper 컨테이너 */}
      <Swiper
        ref={swiperRef}
        modules={[]}
        slidesPerView={1}
        onSlideChange={(swiper) => setCurrentPage(swiper.activeIndex)}
        className="flex-1 w-full"
      >
        {/* 페이지 1: 모든 정보 통합 (코드+출력+설명+시각화) */}
        <SwiperSlide className="!flex !flex-col">
          {(() => {
            const lineCount = code.split('\n').length;

            return (
              <div className="h-full p-1 flex flex-col gap-1" onClick={handleTapArea}>
                {/* ========== 위쪽 절반 (50%): 코드 + 설명 ========== */}
                <div className="h-1/2 flex flex-row gap-1">
                  {/* 왼쪽 (50%): 코드 + 터미널 오버레이 */}
                  <div className="w-1/2 relative">
                    {/* 코드 (전체 영역) */}
                    <div
                      className="h-full rounded-lg border border-[var(--theme-lesson-panel-border)] overflow-hidden flex flex-col"
                      style={{ backgroundColor: 'var(--theme-lesson-panel-bg)' }}
                    >
                      <div className="px-2 py-1 bg-gradient-to-r from-[#2d2d2d] to-[#1a1a1a] text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                        <Code2 className="w-3 h-3" />
                        {codeName}
                        <span className="ml-auto opacity-60">{lineCount}줄</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <LessonCodeEditor
                          code={code}
                          highlightLine={currentStep?.line || 1}
                        />
                      </div>
                    </div>

                    {/* 터미널 오버레이 (코드 위에 떠있는 느낌) */}
                    {terminalLines.length > 0 && (
                      <div
                        className="absolute bottom-0 left-0 right-0 mx-1 mb-1"
                        style={{
                          maxHeight: '30%',
                          zIndex: 10,
                        }}
                      >
                        <div
                          className="rounded-md overflow-hidden shadow-lg backdrop-blur-sm"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                          }}
                        >
                          <div className="px-2 py-1 overflow-y-auto" style={{ maxHeight: '80px' }}>
                            {terminalLines.map((line, idx) => (
                              <div
                                key={idx}
                                className="text-xs font-mono leading-relaxed"
                                style={{ color: '#22c55e' }}
                              >
                                <span style={{ color: '#10b981', opacity: 0.7 }}>{'>'}</span>{' '}
                                {line.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽 (50%): 설명 */}
                  <div className="w-1/2 h-full overflow-y-auto">
                    <ExplanationSection canCollapse={false} />
                  </div>
                </div>

                {/* ========== 아래쪽 절반 (50%): Flow/Memory 시각화 ========== */}
                <div className="h-1/2 rounded-lg border border-[var(--theme-lesson-panel-border)] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--theme-lesson-panel-bg)' }}>
                  {/* 탭 헤더 */}
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

                  {/* 시각화 콘텐츠 */}
                  <div className="flex-1 overflow-y-auto p-2">
                    <AnimatePresence mode="wait">
                      {activeVisualizationTab === 'flow' ? (
                        <motion.div
                          key="flow"
                          variants={visualizationVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
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
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="memory"
                          variants={visualizationVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <LessonMemoryVisualizer
                            step={currentStep}
                            language={languageId}
                            memoryState={memoryState}
                            changedBlocks={changedBlocks}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })()}
        </SwiperSlide>
      </Swiper>

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
