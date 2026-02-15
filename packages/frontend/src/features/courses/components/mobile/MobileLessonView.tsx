/**
 * MobileLessonView - Two-round mobile lesson layout
 *
 * Round 1 (설명): Code + explanation (resizable)
 * Round 2 (시각화): Code + visualization (resizable)
 *
 * Uses shared LessonCodePanel for code editor + resizer.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Layers } from 'lucide-react';
import './MobileLessonView.css';

import { useLessonVisualization } from '../../hooks/useLessonVisualization';
import { useLessonTerminal } from '../../hooks/useLessonTerminal';
import { useMobileRoundNavigation } from '../../hooks/useMobileRoundNavigation';
import { LessonCodePanel } from '../LessonCodePanel';
import { StepExplanation } from '../day/StepExplanation';
import { LessonBottomNav } from '../LessonBottomNav';

import { LessonFlowVisualizer, LessonMemoryVisualizer } from '@/features/visualizers';
import type { LessonStep } from '@/types';

interface MobileLessonViewProps {
  code: string;
  steps: LessonStep[];
  languageId: string;
  lessonId: string;
  lessonTitle?: string;
  lessonOrder?: number;
  onQuiz?: () => void;
  onStepChange?: (idx: number) => void;
}

const contentVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
} as const;

export function MobileLessonView({
  code,
  steps,
  languageId,
  lessonId,
  onQuiz,
  onStepChange,
}: MobileLessonViewProps) {
  const { t } = useTranslation();
  const [activeVizTab, setActiveVizTab] = useState<'flow' | 'memory'>('flow');

  // Two-round navigation
  const nav = useMobileRoundNavigation({
    steps,
    lessonId,
    onStepChange,
    onQuiz,
  });

  const currentStep = steps[nav.actualStepIndex];

  // Visualization data (with carry-forward)
  const { memoryState, changedBlocks } = useLessonVisualization(steps, nav.actualStepIndex);

  // Terminal output
  const terminalLines = useLessonTerminal({
    steps,
    currentStepIndex: nav.actualStepIndex,
    languageId,
    diffMode: false,
  });

  const showMemoryTab = languageId === 'c';
  const isExplanationRound = nav.round === 'explanation';

  // Bottom nav labels
  const nextLabel = (() => {
    if (isExplanationRound) {
      if (nav.stepIndex >= steps.length - 1) {
        return nav.hasVizRound ? t('lesson.visualization', '시각화') : t('lesson.quiz');
      }
      return t('common.next');
    }
    // visualization round
    if (nav.stepIndex >= nav.vizStepIndices.length - 1) {
      return t('lesson.quiz');
    }
    return t('common.next');
  })();

  return (
    <div className="flex flex-col h-full">
      <LessonCodePanel
        code={code}
        highlightLine={currentStep?.line || 1}
        terminalLines={terminalLines}
        defaultRatio={0.4}
        style={{ flex: 1, minHeight: 0 }}
      >
        {/* Round indicator bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 bg-[var(--theme-lesson-panel-bg)] border-b border-[var(--theme-lesson-panel-border)]">
          <div className="flex gap-1">
            <span className={`round-tab px-2 py-0.5 text-[10px] font-bold rounded-full ${isExplanationRound ? 'round-tab-active' : 'round-tab-inactive'}`}>
              {t('quiz.explanation', '설명')}
            </span>
            {nav.hasVizRound && (
              <span className={`round-tab px-2 py-0.5 text-[10px] font-bold rounded-full ${!isExplanationRound ? 'round-tab-active' : 'round-tab-inactive'}`}>
                {t('lesson.visualization', '시각화')}
              </span>
            )}
          </div>
          <span className="ml-auto text-[10px] font-semibold opacity-60">
            {nav.stepIndex + 1}/{nav.totalInRound} · L{currentStep?.line || 1}
          </span>
        </div>

        {/* Content area — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {isExplanationRound ? (
              /* Round 1: Explanation */
              <motion.div
                key={`explanation-${nav.stepIndex}`}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-3 explanation-container"
              >
                <StepExplanation
                  explanation={currentStep?.explanation || ''}
                  stepIndex={nav.stepIndex}
                />
              </motion.div>
            ) : (
              /* Round 2: Visualization */
              <motion.div
                key={`viz-${nav.stepIndex}`}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                {/* Flow/Memory tab switcher (C only) */}
                {showMemoryTab && (
                  <div className="flex shrink-0 border-b border-[var(--theme-lesson-panel-border)]">
                    <button
                      onClick={() => setActiveVizTab('flow')}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-all ${activeVizTab === 'flow' ? 'viz-tab-active' : 'viz-tab-inactive'}`}
                    >
                      <Play className="w-3 h-3" />
                      Flow
                    </button>
                    <button
                      onClick={() => setActiveVizTab('memory')}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold transition-all border-l border-[var(--theme-lesson-panel-border)] ${activeVizTab === 'memory' ? 'viz-tab-active' : 'viz-tab-inactive'}`}
                    >
                      <Layers className="w-3 h-3" />
                      Memory
                    </button>
                  </div>
                )}

                {/* Visualization content */}
                <div className="w-full min-h-[200px] px-0 py-2">
                  <div className="w-full viz-zoom-container">
                    {activeVizTab === 'flow' || !showMemoryTab ? (
                      <LessonFlowVisualizer
                        step={currentStep}
                        prevStep={nav.actualStepIndex > 0 ? steps[nav.actualStepIndex - 1] : null}
                        language={languageId === 'python-practical' ? 'python' : (languageId as 'c' | 'python' | 'java')}
                        fullCode={code}
                        theme="light"
                        memoryState={memoryState ? {
                          stack: memoryState.stack.map(s => ({ ...s, name: s.name || '?' })),
                          heap: memoryState.heap.map(h => ({ ...h, name: h.name || '?' })),
                          frames: memoryState.frames.map(f => ({ ...f, name: f.name || '?' })),
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
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LessonCodePanel>

      {/* Bottom navigation — fixed at bottom */}
      <LessonBottomNav
        onPrev={nav.goPrev}
        onNext={nav.goNext}
        canGoPrev={nav.canGoPrev}
        nextLabel={nextLabel}
      />
    </div>
  );
}
