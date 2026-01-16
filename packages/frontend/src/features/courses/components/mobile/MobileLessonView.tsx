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
import { Code2, Cpu, GitBranch } from 'lucide-react';
import { CodeViewer } from '../day/CodeViewer';
import { TerminalOutput, type TerminalLine } from '@/features/visualizers/shared';
import { MemoryPanel } from '../memory/MemoryPanel';
import { FlowViewer } from '../python/FlowViewer';
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
  memoryState,
  showRegisters,
}: MobileLessonViewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const config = getLanguageConfig(languageId);

  // 터미널 출력 계산
  const terminalLines: TerminalLine[] = [];
  for (let i = 0; i <= currentStepIndex; i++) {
    if (steps[i]?.stdout) {
      terminalLines.push({ content: steps[i].stdout!, type: 'output' });
    }
  }

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
          <span key={i} className="font-bold text-[#2a1a0a] bg-[#fff3e0] px-1 rounded">
            {keyword}
          </span>
        );
      }
      // `코드` 처리
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={i} className="font-mono font-bold text-[#c7254e] bg-[#f9f2f4] px-1 rounded text-sm">
            {code}
          </code>
        );
      }
      return part;
    });
  };

  // 설명 컴포넌트 (컴팩트 + NationalPension 폰트)
  const ExplanationSection = () => (
    <div className="bg-white rounded-lg border border-[#e5d5c7] p-2" style={{ fontFamily: 'NationalPension, cursive', fontWeight: 'normal' }}>
      <div className="flex items-start gap-1.5">
        <span className="shrink-0 px-1 py-0.5 rounded bg-[#6b5a4a] text-white text-[10px] font-bold leading-none" style={{ fontFamily: 'var(--font-sans)' }}>
          L{currentStep?.line || 1}
        </span>
        <span className="text-sm text-[#333] leading-tight whitespace-pre-wrap">
          {currentStep?.explanation ? formatExplanation(currentStep.explanation) : '설명이 없습니다'}
        </span>
      </div>
      {currentStep?.tip && (
        <div className="mt-1.5 pl-1.5 border-l-2 border-amber-400">
          <span className="text-xs text-amber-700">💡 </span>
          <span className="text-xs text-amber-800 whitespace-pre-wrap">{currentStep.tip}</span>
        </div>
      )}
    </div>
  );

  // 시각화 컴포넌트 렌더링
  const renderVisualization = () => {
    if (config.visualType === 'flow') {
      return <FlowViewer steps={steps} currentStepIndex={currentStepIndex} />;
    }

    // 메모리 시각화 (C, Java, JS 등)
    const hasMemoryData = memoryState && (memoryState.stack.length > 0 || memoryState.heap.length > 0);

    if (!hasMemoryData) {
      return (
        <div className="flex items-center justify-center h-full min-h-[150px] text-gray-400 text-sm">
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

  const VisualIcon = config.visualIcon;

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
          {/* 페이지 1: 코드 + 출력 + 설명 */}
          <div className="w-1/2 h-full p-2 flex flex-col gap-2">
            {/* 코드 뷰어 - 독립 스크롤 */}
            <div className="flex-1 bg-white rounded-lg border border-[#e5d5c7] overflow-hidden flex flex-col">
              <div className="px-3 py-1.5 bg-gradient-to-r from-[#2d2d2d] to-[#1a1a1a] text-white text-xs font-semibold flex items-center gap-2">
                <Code2 className="w-3 h-3" />
                {config.codeName}
              </div>
              <div className="flex-1 overflow-y-auto">
                <CodeViewer
                  code={code}
                  highlightLine={currentStep?.line || 1}
                />
              </div>
            </div>

            {/* 터미널 출력 */}
            {terminalLines.length > 0 && (
              <div className="bg-white rounded-lg border border-[#e5d5c7] overflow-hidden">
                <TerminalOutput
                  lines={terminalLines}
                  title="출력"
                  maxHeight="60px"
                  emptyMessage=""
                  compact
                />
              </div>
            )}

            {/* 설명 - 독립 스크롤 */}
            <div className="flex-1 overflow-y-auto">
              <ExplanationSection />
            </div>
          </div>

          {/* 페이지 2: 시각화 전체 화면 */}
          <div className="w-1/2 h-full p-2">
            {/* 시각화 (메모리 or 플로우) - 전체 화면 */}
            <div className="h-full bg-white rounded-lg border border-[#e5d5c7] overflow-hidden flex flex-col">
              <div className={`px-3 py-1.5 bg-gradient-to-r ${config.visualColor} text-white text-xs font-semibold flex items-center gap-2`}>
                <VisualIcon className="w-3 h-3" />
                {config.visualName}
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {renderVisualization()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 페이지 인디케이터 */}
      <div className="flex items-center justify-center gap-2 py-2 bg-white border-t border-[#e5d5c7]">
        <button
          onClick={() => setCurrentPage(0)}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            currentPage === 0 ? 'bg-[#6b5a4a] w-5' : 'bg-gray-300 hover:bg-gray-400'
          }`}
          aria-label="코드 페이지"
        />
        <button
          onClick={() => setCurrentPage(1)}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            currentPage === 1 ? 'bg-[#6b5a4a] w-5' : 'bg-gray-300 hover:bg-gray-400'
          }`}
          aria-label="시각화 페이지"
        />
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
