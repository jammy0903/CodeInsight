/**
 * MobileLessonView - 모바일 레슨 통합 레이아웃
 *
 * 모든 언어(C, Python, Java, JS, ML 등)에서 동일한 구조 사용
 * 슬라이딩 2페이지:
 * - 페이지 1: 설명 + 코드 + 출력
 * - 페이지 2: 설명 + 시각화 (메모리 or 플로우)
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Play, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import './MobileLessonView.css';

import { useLessonVisualization } from '../../hooks/useLessonVisualization';
import { useLessonTerminal } from '../../hooks/useLessonTerminal';
import { LessonCodeEditor } from '../day/LessonCodeEditor';

import { LessonFlowVisualizer } from '@/features/visualizers/flow';
import { LessonMemoryVisualizer } from '@/features/visualizers/memory';
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

  // 터미널 출력 (모바일은 누적 전체 표시 = diffMode: false)
  const terminalLines = useLessonTerminal({
    steps,
    currentStepIndex,
    languageId,
    diffMode: false,
  });

  // Memory 탭 표시 여부 (Java, C만)
  const showMemoryTab = languageId === 'java' || languageId === 'c';



  // 설명 텍스트에서 **굵게** 와 `코드`를 강조 처리
  const formatExplanation = (text: string) => {
    // **bold** 와 `code` 패턴 모두 처리
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      // **굵게** 처리 - 배경 + 진한 색상으로 확실히 구분
      if (part.startsWith('**') && part.endsWith('**')) {
        const keyword = part.slice(2, -2);
        return (
          <span key={i} className="font-bold px-1 rounded keyword-highlight">
            {keyword}
          </span>
        );
      }
      // `코드` 처리
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={i} className="font-mono font-bold px-1 rounded text-sm code-highlight">
            {code}
          </code>
        );
      }
      return part;
    });
  };

  // 설명 컴포넌트 (접기/펼치기 기능 포함)
  const ExplanationSection = ({ canCollapse }: { canCollapse: boolean }) => (
    <div className="h-full overflow-hidden flex flex-col explanation-container">
      {/* 설명 헤더 (접기/펼치기 버튼 포함) */}
      <div
        className="flex items-center gap-1 px-1.5 py-1 explanation-header"
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
              <div className="h-auto min-h-full flex flex-col w-full overflow-y-auto">
                {/* ========== 위쪽 영역 (고정 높이 45vh): 코드 + 설명 ========== */}
                <div className="h-[45vh] shrink-0 flex flex-row min-h-[250px] w-full border-b border-[var(--theme-lesson-panel-border)]">
                  {/* 왼쪽 (50%): 코드 + 터미널 오버레이 */}
                  <div className="w-1/2 min-w-0 relative flex flex-col border-r border-[var(--theme-lesson-panel-border)]">
                    <div
                      className="flex-1 overflow-hidden flex flex-col bg-[var(--theme-lesson-panel-bg)]"
                    >
                      <div className="px-2 py-1 bg-gradient-to-r from-[#2d2d2d] to-[#1a1a1a] text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                        <Code2 className="w-3 h-3" />
                        <span className="truncate">{codeName}</span>
                        <span className="ml-auto opacity-60 text-[10px] whitespace-nowrap">{lineCount}줄</span>
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        <LessonCodeEditor
                          code={code}
                          highlightLine={currentStep?.line || 1}
                        />
                      </div>
                    </div>

                    {/* 터미널 오버레이 */}
                    {terminalLines.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[30%] flex flex-col-reverse">
                        <div
                          className="overflow-hidden shadow-lg terminal-overlay-container border-t border-green-500/30"
                        >
                          <div className="px-2 py-1 overflow-y-auto max-h-[80px]">
                            {terminalLines.map((line, idx) => (
                              <div key={idx} className="text-xs font-mono leading-relaxed text-green-500 break-words whitespace-pre-wrap">
                                <span className="text-emerald-500 opacity-70 mr-1">{'>'}</span>
                                {line.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽 (50%): 설명 */}
                  <div className="w-1/2 min-w-0 h-full">
                    <ExplanationSection canCollapse={false} />
                  </div>
                </div>

                {/* ========== 아래쪽 영역 (Auto Height): 시각화 (Flow/Memory) ========== */}
                <div className="w-full min-w-0 overflow-visible flex flex-col bg-[var(--theme-lesson-panel-bg)]">
                  {/* 탭 헤더 */}
                  <div className="flex shrink-0 border-b border-[var(--theme-lesson-panel-border)]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVisualizationTab('flow');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-all ${activeVisualizationTab === 'flow'
                        ? 'viz-tab-active'
                        : 'viz-tab-inactive'
                        }`}
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
                        className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-all border-l border-[var(--theme-lesson-panel-border)] ${activeVisualizationTab === 'memory'
                          ? 'viz-tab-active'
                          : 'viz-tab-inactive'
                          }`}
                      >
                        <Layers className="w-3 h-3" />
                        Memory
                      </button>
                    )}
                  </div>

                  {/* 시각화 콘텐츠 (zoom 0.55배 축소, 스크롤 없이 내용물 크기에 따라 높이 자동 조절) */}
                  <div className="w-full min-h-[300px] px-0 py-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeVisualizationTab}
                        variants={visualizationVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="w-full viz-zoom-container"
                      >
                        {activeVisualizationTab === 'flow' ? (
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
                        ) : (
                          <LessonMemoryVisualizer
                            step={currentStep}
                            language={languageId}
                            memoryState={memoryState}
                            changedBlocks={changedBlocks}
                          />
                        )}
                      </motion.div>
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
