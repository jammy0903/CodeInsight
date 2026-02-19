/**
 * LessonUnifiedView - Single lesson layout for all languages & screen sizes
 *
 * Desktop (horizontal): code left | content right
 * Mobile (vertical):    code top  | content bottom
 *
 * Two rounds: R1 (explanation) → R2 (visualization) → quiz
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Layers } from 'lucide-react';

import { useRoundNavigation } from '../hooks/useRoundNavigation';
import { useLessonVisualization } from '../hooks/useLessonVisualization';
import { useLessonTerminal } from '@/features/visualizers/shared/hooks/useLessonTerminal';
import { useStepGestures } from '@/features/visualizers/shared/hooks/useStepGestures';
import { LessonCodePanel } from './LessonCodePanel';
import { StepExplanation } from './day/StepExplanation';
import { LessonBottomNav } from './LessonBottomNav';

import { LessonFlowVisualizer, LessonMemoryVisualizer } from '@/features/visualizers';
import { useIsMobile } from '@/hooks';
import type { LessonStep } from '@/types';
import type { CodeSelection } from '@/features/visualizers/shared/components/CodeMirrorEditor';

interface LessonUnifiedViewProps {
  code: string;
  steps: LessonStep[];
  languageId: string;
  lessonId: string;
  onQuiz?: () => void;
  onSelectionChange?: (selection: CodeSelection) => void;
}

const contentVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.15 } },
} as const;

export function LessonUnifiedView({
  code,
  steps,
  languageId,
  lessonId,
  onQuiz,
  onSelectionChange,
}: LessonUnifiedViewProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeVizTab, setActiveVizTab] = useState<'flow' | 'memory'>('flow');

  // Round navigation (shared for both layouts)
  const nav = useRoundNavigation({
    steps,
    lessonId,
    onQuiz,
  });

  const currentStep = steps[nav.actualStepIndex];
  const isExplanationRound = nav.round === 'explanation';
  const showMemoryTab = languageId === 'c';

  // Visualization data
  const { memoryState, changedBlocks } = useLessonVisualization(steps, nav.actualStepIndex);

  // Terminal output
  const terminalLines = useLessonTerminal({
    steps,
    currentStepIndex: nav.actualStepIndex,
    languageId,
    diffMode: false,
  });

  // Keyboard gestures (desktop)
  useStepGestures({
    onPrev: nav.goPrev,
    onNext: nav.goNext,
    enabled: !isMobile,
    isModalOpen: false,
    canGoPrev: nav.canGoPrev,
    canGoNext: true,
  });

  // Next button label
  const nextLabel = (() => {
    if (isExplanationRound) {
      if (nav.stepIndex >= steps.length - 1) {
        return nav.hasVizRound ? t('lesson.visualization', '시각화') : t('lesson.quiz');
      }
      return t('common.next');
    }
    if (nav.stepIndex >= nav.vizStepIndices.length - 1) {
      return t('lesson.quiz');
    }
    return t('common.next');
  })();

  // Round indicator bar
  const roundIndicator = (
    <div
      className="flex items-center gap-2 px-3 py-1.5 shrink-0 border-b"
      style={{
        background: 'var(--theme-lesson-panel-bg)',
        borderColor: 'var(--theme-lesson-panel-border)',
      }}
    >
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
  );

  // Content area (R1: explanation, R2: visualization)
  const contentArea = (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <AnimatePresence mode="wait">
        {isExplanationRound ? (
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
            <div className={`w-full min-h-[67px] px-0 py-2 ${isMobile ? 'viz-zoom-container' : ''}`}>
              {activeVizTab === 'flow' || !showMemoryTab ? (
                <LessonFlowVisualizer
                  step={currentStep}
                  prevStep={nav.actualStepIndex > 0 ? steps[nav.actualStepIndex - 1] : null}
                  language={languageId === 'python-practical' ? 'python' : (languageId || 'c')}
                  fullCode={code}
                  memoryState={memoryState ? {
                    stack: memoryState.stack.map((s) => ({ ...s, name: s.name || '?' })),
                    heap: memoryState.heap.map((h) => ({ ...h, name: h.name || '?' })),
                  } : undefined}
                  stdout={currentStep?.stdout}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col">
      <LessonCodePanel
        code={code}
        highlightLine={currentStep?.line || 1}
        terminalLines={terminalLines}
        onSelectionChange={onSelectionChange}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        defaultRatio={isMobile ? 0.35 : 0.4}
        showCodeHeader={!isMobile}
        className={isMobile ? '' : 'rounded-xl overflow-hidden'}
        style={{
          ...(isMobile
            ? { height: 'calc(100svh - 64px)', minHeight: '400px', margin: '5px' }
            : { border: '1px solid var(--theme-lesson-panel-border)', marginTop: '1rem' }),
        }}
      >
        {roundIndicator}
        {contentArea}
      </LessonCodePanel>

      <LessonBottomNav
        onPrev={nav.goPrev}
        onNext={nav.goNext}
        canGoPrev={nav.canGoPrev}
        nextLabel={nextLabel}
        onQuiz={onQuiz}
      />
    </div>
  );
}
