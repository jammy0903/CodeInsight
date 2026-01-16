/**
 * PythonLessonView - Python 자동화 코스 전용 레이아웃
 *
 * 슬라이딩 2페이지 구조:
 * - 페이지 1: 코드 + 출력 + 설명
 * - 페이지 2: 플로우 뷰어 + 설명 + AI Chat
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Code2, GitBranch, Cpu } from 'lucide-react';
import { FlowViewer } from './FlowViewer';
import { PyVisualizerView } from '@/features/visualizers/python';
import { CodeViewer } from '../day/CodeViewer';
import { TerminalOutput, type TerminalLine } from '@/features/visualizers/shared';
import { ChatQA } from '@/features/chat/components/ChatQA';
import { MemoryPanel } from '../memory/MemoryPanel';
import { useIsMobile, useSlidingPages } from '@/hooks';

interface PythonStep {
  line: number;
  title?: string;
  explanation?: string;
  highlight?: number[];
  flowIcon?: string;
  flowLabel?: string;
  flowDetail?: string;
  stdout?: string;
  tip?: string;
  pythonMemoryState?: {
    names: Array<{ name: string; pointsTo: string }>;
    objects: Array<{ id: string; type: string; value: string; pyId?: string; highlight?: boolean }>;
  };
}

interface PythonLessonViewProps {
  code: string;
  steps: PythonStep[];
  currentStepIndex: number;
  languageId: string;
  lessonId: string;
  // 메모리 시각화용 (C 스타일)
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

export function PythonLessonView({
  code,
  steps,
  currentStepIndex,
  languageId,
  lessonId,
  memoryState,
  showRegisters,
}: PythonLessonViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { currentPage, setCurrentPage, handleDragEnd, animateX } = useSlidingPages();

  const currentStep = steps[currentStepIndex];

  // 터미널 출력 계산
  const terminalLines: TerminalLine[] = [];
  for (let i = 0; i <= currentStepIndex; i++) {
    if (steps[i]?.stdout) {
      terminalLines.push({ content: steps[i].stdout!, type: 'output' });
    }
  }


  // 설명 컴포넌트 (공통)
  const ExplanationSection = () => (
    <div className="bg-white rounded-xl border border-[#e5d5c7] p-4">
      <h3 className="text-sm font-semibold text-[#6b5a4a] mb-2">
        {currentStep?.title || `Step ${currentStepIndex + 1}`}
      </h3>
      <div className="text-sm text-[#4a4a4a] whitespace-pre-wrap leading-relaxed">
        {currentStep?.explanation || '설명이 없습니다'}
      </div>
      {currentStep?.tip && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-xs font-semibold text-amber-700 mb-1">💡 Tip</div>
          <div className="text-xs text-amber-800">{currentStep.tip}</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 스와이프 컨테이너 */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          animate={{ x: animateX }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex h-full"
          style={{ width: '200%' }}
        >
          {/* 페이지 1: 설명 + 코드 + 출력 */}
          <div className="w-1/2 h-full overflow-y-auto p-4 space-y-4">
            {/* 설명 */}
            <ExplanationSection />

            {/* 코드 뷰어 */}
            <div className="bg-white rounded-xl border border-[#e5d5c7] overflow-hidden">
              <div className="px-4 py-2 bg-gradient-to-r from-[#2d2d2d] to-[#1a1a1a] text-white text-sm font-semibold flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Python 코드
              </div>
              <CodeViewer
                code={code}
                currentLine={currentStep?.line || 1}
                highlightLines={currentStep?.highlight || [currentStep?.line || 1]}
                language="python"
              />
            </div>

            {/* 터미널 출력 */}
            {terminalLines.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e5d5c7] overflow-hidden">
                <TerminalOutput
                  lines={terminalLines}
                  title="출력"
                  maxHeight="100px"
                  emptyMessage=""
                  compact
                />
              </div>
            )}
          </div>

          {/* 페이지 2: 설명 + 플로우 + AI */}
          <div className="w-1/2 h-full overflow-y-auto p-4 space-y-4">
            {/* 설명 */}
            <ExplanationSection />

            {/* 시각화 (Python 메모리 or C 메모리 or 플로우) */}
            <div className="bg-white rounded-xl border border-[#e5d5c7] overflow-hidden">
              <div className={`px-4 py-2 bg-gradient-to-r text-white text-sm font-semibold flex items-center gap-2 ${
                currentStep?.pythonMemoryState
                  ? 'from-emerald-600 to-emerald-700'
                  : memoryState && (memoryState.stack.length > 0 || memoryState.heap.length > 0)
                    ? 'from-blue-600 to-blue-700'
                    : 'from-emerald-600 to-emerald-700'
              }`}>
                {currentStep?.pythonMemoryState ? (
                  <><GitBranch className="w-4 h-4" /> Python 메모리</>
                ) : memoryState && (memoryState.stack.length > 0 || memoryState.heap.length > 0) ? (
                  <><Cpu className="w-4 h-4" /> 메모리</>
                ) : (
                  <><GitBranch className="w-4 h-4" /> 실행 흐름</>
                )}
              </div>
              <div className="p-4 min-h-[300px]">
                {currentStep?.pythonMemoryState ? (
                  <PyVisualizerView
                    names={currentStep.pythonMemoryState.names}
                    objects={currentStep.pythonMemoryState.objects}
                    animate={true}
                    compact={false}
                  />
                ) : memoryState && (memoryState.stack.length > 0 || memoryState.heap.length > 0) ? (
                  <MemoryPanel
                    stack={memoryState.stack}
                    heap={memoryState.heap}
                    changedBlocks={[]}
                    showRegisters={showRegisters}
                    frames={memoryState.frames}
                  />
                ) : (
                  <FlowViewer steps={steps} currentStepIndex={currentStepIndex} />
                )}
              </div>
            </div>

            {/* AI Chat (모바일에서 숨김) */}
            {!isMobile && (
              <div className="bg-white rounded-xl border border-[#e5d5c7] overflow-hidden">
                <ChatQA
                  languageId={languageId}
                  lessonId={lessonId}
                  currentCode={code}
                  currentLine={currentStep?.line || 1}
                />
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* 페이지 인디케이터 (하단 점 두 개) */}
      <div className="flex items-center justify-center gap-2 py-3 bg-white border-t border-[#e5d5c7]">
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
          aria-label="플로우 페이지"
        />
      </div>
    </div>
  );
}
