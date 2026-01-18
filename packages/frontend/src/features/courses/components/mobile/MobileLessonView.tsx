/**
 * MobileLessonView - 모바일 레슨 통합 레이아웃
 *
 * 모든 언어(C, Python, Java, JS, ML 등)에서 동일한 구조 사용
 * 슬라이딩 2페이지:
 * - 페이지 1: 설명 + 코드 + 출력
 * - 페이지 2: 설명 + 시각화 (메모리 or 플로우)
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Code2, Cpu, GitBranch, Play, ChevronUp, ChevronDown } from 'lucide-react';
import { useStepGestures } from '../../hooks/useStepGestures';
import { LessonCodeEditor } from '../day/LessonCodeEditor';
import { MemoryPanel } from '../memory/MemoryPanel';
import { FlowViewer } from '../python/FlowViewer';
import { PyVisualizerView } from '@/features/visualizers/python';
import { LessonFlowVisualizer } from '@/features/visualizers/flow';
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
  // 메모리 시각화용
  memoryState?: {
    stack: Array<{
      name: string;
      variables: Array<{
        name: string;
        value: string | number;
        address?: string;
        type?: string;
        highlight?: boolean;
      }>;
    }>;
    heap: Array<{
      id: string;
      type: string;
      value?: string | number;
      address?: string;
      highlight?: boolean;
    }>;
    frames?: Array<{
      name: string;
      startIndex: number;
      endIndex: number;
    }>;
  };
  showRegisters?: boolean;
}

// 언어별 설정
function getLanguageConfig(languageId: string) {
  if (languageId.includes('python')) {
    return {
      codeName: 'Python 코드',
      visualName: '실행 흐름',
      visualIcon: GitBranch,
      visualColor: 'from-emerald-600 to-emerald-700',
      visualType: 'flow' as const,
    };
  }
  if (languageId.includes('java')) {
    return {
      codeName: 'Java 코드',
      visualName: '메모리',
      visualIcon: Cpu,
      visualColor: 'from-orange-600 to-orange-700',
      visualType: 'memory' as const,
    };
  }
  if (languageId.includes('javascript') || languageId.includes('js')) {
    return {
      codeName: 'JavaScript 코드',
      visualName: '메모리',
      visualIcon: Cpu,
      visualColor: 'from-yellow-500 to-yellow-600',
      visualType: 'memory' as const,
    };
  }
  // C, 기타
  return {
    codeName: 'C 코드',
    visualName: '메모리',
    visualIcon: Cpu,
    visualColor: 'from-blue-600 to-blue-700',
    visualType: 'memory' as const,
  };
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
  memoryState,
  showRegisters,
}: MobileLessonViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [visualTab, setVisualTab] = useState<'flow' | 'memory'>('flow');
  const [isExplanationCollapsed, setIsExplanationCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const config = getLanguageConfig(languageId);
  const isLastStep = currentStepIndex >= steps.length - 1;

  // 스텝 제스처 (키보드 ← →, 탭/클릭)
  const { handleTapArea } = useStepGestures({
    onPrev: onPrevStep,
    onNext: isLastStep && onQuiz ? onQuiz : onNextStep,
    enabled: true,
    isModalOpen: isAIChatOpen,
    canGoPrev: currentStepIndex > 0,
    canGoNext: !isLastStep || !!onQuiz,
  });

  // 스와이프 핸들러
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentPage === 0) {
      setCurrentPage(1);
    } else if (info.offset.x > threshold && currentPage === 1) {
      setCurrentPage(0);
    }
  };

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

  // 시각화 컴포넌트 렌더링
  const renderVisualization = () => {
    // Python 메모리 시각화 (pythonMemoryState가 있으면 우선 처리)
    const pyState = currentStep?.pythonMemoryState;
    if (pyState && pyState.names && pyState.objects) {
      return (
        <PyVisualizerView
          names={pyState.names}
          objects={pyState.objects}
          animate={true}
          compact={true}
        />
      );
    }

    // Python 플로우 시각화
    if (config.visualType === 'flow') {
      return <FlowViewer steps={steps} currentStepIndex={currentStepIndex} />;
    }

    // 메모리 시각화 (C, Java, JS 등)
    const hasMemoryData = memoryState && (memoryState.stack.length > 0 || memoryState.heap.length > 0);

    if (!hasMemoryData) {
      return (
        <div className="flex items-center justify-center h-full min-h-[150px] text-sm" style={{ color: 'var(--theme-lesson-tab-inactive-text)' }}>
          이 스텝에서는 메모리 변화가 없습니다
        </div>
      );
    }

    return (
      <MemoryPanel
        stack={memoryState.stack}
        heap={memoryState.heap}
        changedBlocks={[]}
        showRegisters={showRegisters}
        frames={memoryState.frames}
      />
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* 스와이프 컨테이너 */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <motion.div
          drag="x"
          dragConstraints={{ left: -300, right: 300 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          animate={{ x: currentPage === 0 ? 0 : '-50%' }}
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
                    {config.codeName}
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

          {/* 페이지 2: Flow/Memory 탭 시각화 */}
          <div className="w-1/2 h-full p-1" onClick={handleTapArea}>
            <div className="h-full rounded-lg border border-[var(--theme-lesson-panel-border)] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--theme-lesson-panel-bg)' }}>
              {/* 탭 헤더 */}
              <div className="flex border-b border-b-[var(--theme-lesson-panel-border)]">
                {/* Flow 탭 */}
                <button
                  onClick={() => setVisualTab('flow')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-colors ${
                    visualTab === 'flow'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                      : ''
                  }`}
                  style={visualTab !== 'flow' ? {
                    backgroundColor: 'var(--theme-lesson-tab-inactive-bg)',
                    color: 'var(--theme-lesson-tab-inactive-text)'
                  } : {}}
                >
                  <Play className="w-3 h-3" />
                  Flow
                </button>
                {/* Memory 탭 */}
                <button
                  onClick={() => setVisualTab('memory')}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-colors ${
                    visualTab === 'memory'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                      : ''
                  }`}
                  style={visualTab !== 'memory' ? {
                    backgroundColor: 'var(--theme-lesson-tab-inactive-bg)',
                    color: 'var(--theme-lesson-tab-inactive-text)'
                  } : {}}
                >
                  <Cpu className="w-3 h-3" />
                  메모리
                </button>
              </div>

              {/* 탭 콘텐츠 */}
              <div className="flex-1 overflow-y-auto p-2">
                {visualTab === 'flow' ? (
                  /* Flow 시각화 */
                  <LessonFlowVisualizer
                    step={currentStep}
                    prevStep={currentStepIndex > 0 ? steps[currentStepIndex - 1] : null}
                    language={languageId as 'c' | 'python' | 'java'}
                    fullCode={code}
                    theme="light"
                    memoryState={memoryState}
                    stdout={currentStep?.stdout}
                  />
                ) : (
                  /* Memory 시각화 */
                  renderVisualization()
                )}
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
            className={`w-2 h-2 rounded-full transition-all ${
              currentPage === 0 ? 'w-4' : ''
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
            className={`w-2 h-2 rounded-full transition-all ${
              currentPage === 1 ? 'w-4' : ''
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
