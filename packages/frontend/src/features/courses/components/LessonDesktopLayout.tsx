/**
 * LessonDesktopLayout - 데스크톱 2패널 레이아웃
 *
 * 좌: 코드 에디터 + 설명
 * 우: Flow/Memory/AI 탭 시각화
 */

import { useState, useEffect, useRef } from 'react';
import { Bot, Code2, BookOpen, ChevronUp, ChevronDown, Play } from 'lucide-react';
import { Layers } from 'lucide-react';

import { LessonCodeEditor } from './day/LessonCodeEditor';
import { StepExplanation } from './day/StepExplanation';
import { ChatQA } from '@/features/chat';
import { LessonFlowVisualizer } from '@/features/visualizers/flow';
import { LessonMemoryVisualizer } from '@/features/visualizers/memory';
import type { TerminalLine } from '@/features/visualizers/shared';
import type { LessonStep } from '@/types';
import type { CodeSelection } from '../types';

interface LessonDesktopLayoutProps {
  code: string;
  steps: LessonStep[];
  currentStepIndex: number;
  displayLine: number;
  lang: string;
  lessonId: string | undefined;
  lessonOrder: number;
  lessonTitle: string;
  terminalLines: TerminalLine[];
  memoryState: any;
  changedBlocks: Set<string>;
  onSelectionChange: (selection: CodeSelection) => void;
}

export function LessonDesktopLayout({
  code,
  steps,
  currentStepIndex,
  displayLine,
  lang,
  lessonId,
  lessonOrder,
  lessonTitle,
  terminalLines,
  memoryState,
  changedBlocks,
  onSelectionChange,
}: LessonDesktopLayoutProps) {
  const [activeTab, setActiveTab] = useState<'flow' | 'memory' | 'chat'>(
    lang === 'c' ? 'memory' : 'flow',
  );
  const [isExplanationCollapsed, setIsExplanationCollapsed] = useState(false);
  const memoryScrollRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];

  // 메모리 탭 자동 중앙 정렬
  useEffect(() => {
    if (activeTab !== 'memory') return;
    const container = memoryScrollRef.current;
    if (!container) return;

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!container) return;
          const { scrollHeight, clientHeight, scrollWidth, clientWidth } = container;
          if (scrollHeight > clientHeight || scrollWidth > clientWidth) {
            container.scrollTo({
              top: Math.max(0, (scrollHeight - clientHeight) / 2),
              left: Math.max(0, (scrollWidth - clientWidth) / 2),
              behavior: 'instant',
            });
          }
        });
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [activeTab, currentStepIndex]);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start pb-16">
      {/* Left Panel: 코드(위) + 설명(아래) — 고정 높이, 각각 독립 스크롤 */}
      <div
        className="w-full md:w-1/2 flex flex-col rounded-xl overflow-hidden"
        style={{
          border: '1px solid var(--theme-lesson-panel-border)',
          height: 'calc(100vh - 120px)',
        }}
      >
        {/* === 상단: 코드 에디터 + 터미널 오버레이 === */}
        <div className="relative flex flex-col" style={{ flex: isExplanationCollapsed ? '1 1 auto' : '1 1 50%', minHeight: 0 }}>
          <div
            className="flex items-center px-3 py-1 text-xs font-medium shrink-0"
            style={{
              background: 'var(--theme-lesson-editor-header-bg)',
              color: 'var(--theme-lesson-editor-header-text)',
              borderBottom: '1px solid var(--theme-lesson-panel-border)',
            }}
          >
            <Code2 className="w-3 h-3 mr-1.5" />
            에디터
          </div>
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            <LessonCodeEditor
              code={code}
              highlightLine={displayLine}
              onSelectionChange={onSelectionChange}
            />
          </div>
          {/* 터미널 오버레이 — 코드에디터 하단에 겹침 */}
          {terminalLines.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[40%]">
              <div
                className="overflow-hidden shadow-lg border-t"
                style={{
                  background: 'rgba(0, 20, 10, 0.92)',
                  borderColor: 'rgba(34, 197, 94, 0.3)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="px-3 py-1.5 overflow-y-auto max-h-[120px]">
                  {terminalLines.map((line, idx) => (
                    <div key={idx} className="text-xs font-mono leading-relaxed text-green-400 break-words whitespace-pre-wrap">
                      <span className="text-emerald-500 opacity-70 mr-1.5">{'>'}</span>
                      {line.content}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* === 하단: 설명 === */}
        {currentStep && (
          <div
            className="flex flex-col shrink-0"
            style={{
              flex: isExplanationCollapsed ? '0 0 auto' : '1 1 50%',
              minHeight: 0,
              borderTop: '2px solid var(--theme-lesson-panel-border)',
              background: 'var(--theme-lesson-explanation-bg)',
            }}
          >
            {/* 설명 헤더 바 */}
            <div
              className="flex items-center justify-between px-3 py-1 text-xs font-medium shrink-0 cursor-pointer"
              style={{
                background: 'var(--theme-lesson-explanation-bg)',
                color: 'var(--theme-lesson-editor-header-text)',
                borderBottom: isExplanationCollapsed ? 'none' : '1px solid var(--theme-lesson-panel-border)',
              }}
              onClick={() => setIsExplanationCollapsed(!isExplanationCollapsed)}
            >
              <div className="flex items-center">
                <BookOpen className="w-3 h-3 mr-1.5" />
                설명
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{
                    background: 'var(--theme-lesson-explanation-line-badge-bg)',
                    color: '#fff',
                  }}
                >
                  Step {currentStepIndex + 1}/{steps.length} · L{displayLine}
                </span>
                {isExplanationCollapsed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            {/* 설명 내용 */}
            {!isExplanationCollapsed && (
              <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
                <StepExplanation
                  explanation={currentStep.explanation}
                  stepIndex={currentStepIndex}
                  line={displayLine}
                  code={code}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Flow / Memory / AI */}
      <div
        className="w-full md:w-1/2 flex flex-col rounded-xl md:sticky md:top-4 z-10 overflow-hidden"
        style={{
          border: '1px solid var(--theme-lesson-panel-border)',
          height: 'calc(100vh - 120px)',
        }}
      >
        <div
          className="flex shrink-0"
          style={{ borderBottom: '1px solid var(--theme-lesson-panel-border)', height: '40px' }}
        >
          <button
            onClick={() => setActiveTab('flow')}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold"
            style={{
              background: activeTab === 'flow' ? 'var(--theme-lesson-tab-active-bg)' : 'var(--theme-lesson-tab-inactive-bg)',
              color: activeTab === 'flow' ? 'var(--theme-lesson-tab-active-text)' : 'var(--theme-lesson-tab-inactive-text)',
              borderRight: '1px solid var(--theme-lesson-panel-border)',
            }}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Flow</span>
          </button>
          {(lang === 'java' || lang === 'c') && (
            <button
              onClick={() => setActiveTab('memory')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
              style={{
                background: activeTab === 'memory' ? 'var(--theme-lesson-tab-active-bg)' : 'var(--theme-lesson-tab-inactive-bg)',
                color: activeTab === 'memory' ? 'var(--theme-lesson-tab-active-text)' : 'var(--theme-lesson-tab-inactive-text)',
                borderRight: '1px solid var(--theme-lesson-panel-border)',
              }}
            >
              <Layers className="w-3.5 h-3.5" />
              Memory
            </button>
          )}
          <button
            onClick={() => setActiveTab('chat')}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
            style={{
              background: activeTab === 'chat' ? 'var(--theme-lesson-tab-active-bg)' : 'var(--theme-lesson-tab-inactive-bg)',
              color: activeTab === 'chat' ? 'var(--theme-lesson-tab-active-text)' : 'var(--theme-lesson-tab-inactive-text)',
            }}
          >
            <Bot className="w-3.5 h-3.5" />
            AI 튜터
          </button>
        </div>
        <div
          className="flex-1 overflow-hidden"
          style={{ background: 'var(--theme-lesson-memory-bg)', minHeight: 0 }}
        >
          {activeTab === 'flow' && (
            <div className="w-full h-full overflow-y-auto">
              <div className="p-4">
                {currentStep && (
                  <>
                    <LessonFlowVisualizer
                      step={currentStep}
                      prevStep={currentStepIndex > 0 ? steps[currentStepIndex - 1] : null}
                      language={lang === 'python-practical' ? 'python' : (lang || 'c')}
                      fullCode={code}
                      memoryState={
                        memoryState
                          ? {
                              stack: memoryState.stack.map((s: any) => ({ ...s, name: s.name || '?' })),
                              heap: memoryState.heap.map((h: any) => ({ ...h, name: h.name || '?' })),
                            }
                          : undefined
                      }
                      stdout={currentStep.stdout}
                    />
                  </>
                )}
              </div>
            </div>
          )}
          {activeTab === 'memory' && currentStep && (
            <div ref={memoryScrollRef} className="w-full h-full overflow-auto p-4">
              <LessonMemoryVisualizer
                step={currentStep}
                language={lang}
                memoryState={memoryState}
                changedBlocks={changedBlocks}
              />
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="h-full">
              <ChatQA
                lessonId={lessonId}
                context={{
                  courseDay: lessonOrder,
                  topic: lessonTitle,
                  code: code,
                  currentLine: currentStep?.line || 1,
                }}
                contextType="lesson"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
