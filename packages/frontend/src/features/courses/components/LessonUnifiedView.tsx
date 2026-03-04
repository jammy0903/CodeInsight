/**
 * LessonUnifiedView - Single lesson layout for all languages & screen sizes
 *
 * Desktop (horizontal): code left | content right
 * Mobile (vertical):    code top  | content bottom
 *
 * Two rounds: R1 (explanation) → R2 (visualization) → quiz
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Layers, Lightbulb } from 'lucide-react';

import { useRoundNavigation } from '../hooks/useRoundNavigation';
import { useLessonVisualization } from '../hooks/useLessonVisualization';
import { useLessonTerminal } from '@/features/visualizers/shared/hooks/useLessonTerminal';
import { useStepGestures } from '@/features/visualizers/shared/hooks/useStepGestures';
import { LessonCodePanel } from './LessonCodePanel';
import { StepExplanation } from './day/StepExplanation';
import { LessonBottomNav } from './LessonBottomNav';

import { LessonFlowVisualizer, LessonMemoryVisualizer } from '@/features/visualizers';
import { ConceptPopup } from '@/features/visualizers/shared/components/ConceptPopup';
import { useIsMobile } from '@/hooks';
import type { LessonStep } from '@/types';
import type { CodeSelection } from '@/features/visualizers/shared/components/CodeMirrorEditor';
import { hasMeaningfulValue } from '../utils/visualizationData';

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

const CONCEPT_TYPES = new Set(['preprocessor', 'streams', 'buffering', 'fileio']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

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
  const [isConceptOpen, setIsConceptOpen] = useState(false);

  // Round navigation (shared for both layouts)
  const nav = useRoundNavigation({
    steps,
    lessonId,
    onQuiz,
  });

  const currentStep = steps[nav.actualStepIndex];
  const currentStepRecord = currentStep as Record<string, unknown> | undefined;
  const isExplanationRound = nav.round === 'explanation';
  const showMemoryTab = languageId === 'c' || languageId === 'cpp';
  const rawConceptType = asString(currentStepRecord?.conceptVisualizationType) || asString(currentStepRecord?.visualizationType);
  const conceptType = rawConceptType && CONCEPT_TYPES.has(rawConceptType) ? rawConceptType : undefined;
  const conceptState = isRecord(currentStepRecord?.conceptState) ? currentStepRecord.conceptState : undefined;
  const hasConceptPopup = !!conceptType || hasMeaningfulValue(conceptState);

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
    isModalOpen: isConceptOpen,
    canGoPrev: nav.canGoPrev,
    canGoNext: true,
  });

  useEffect(() => {
    setIsConceptOpen(false);
  }, [nav.round, nav.actualStepIndex]);

  // Next button label
  const nextLabel = (() => {
    if (isExplanationRound) {
      if (nav.stepIndex >= steps.length - 1) {
        return nav.hasVizRound ? t('lesson.visualization') : t('lesson.quiz');
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
        <span className={`round-tab px-2.5 py-1 text-xs md:text-sm font-bold rounded-full ${isExplanationRound ? 'round-tab-active' : 'round-tab-inactive'}`}>
          {t('lesson.explanation')}
        </span>
        {nav.hasVizRound && (
          <span className={`round-tab px-2.5 py-1 text-xs md:text-sm font-bold rounded-full ${!isExplanationRound ? 'round-tab-active' : 'round-tab-inactive'}`}>
            {t('lesson.visualization')}
          </span>
        )}
      </div>
      <span className="ml-auto text-xs md:text-sm font-semibold opacity-60">
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
            className="p-4 explanation-container"
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
            {(showMemoryTab || hasConceptPopup) && (
              <div className="flex items-center shrink-0 border-b border-[var(--theme-lesson-panel-border)]">
                {showMemoryTab && (
                  <div className="flex flex-1">
                    <button
                      onClick={() => setActiveVizTab('flow')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm md:text-base font-semibold transition-all ${activeVizTab === 'flow' ? 'viz-tab-active' : 'viz-tab-inactive'}`}
                    >
                      <Play className="w-4 h-4" />
                      {t('lesson.flow')}
                    </button>
                    <button
                      onClick={() => setActiveVizTab('memory')}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm md:text-base font-semibold transition-all border-l border-[var(--theme-lesson-panel-border)] ${activeVizTab === 'memory' ? 'viz-tab-active' : 'viz-tab-inactive'}`}
                    >
                      <Layers className="w-4 h-4" />
                      {t('lesson.memory')}
                    </button>
                  </div>
                )}

                {hasConceptPopup && (
                  <button
                    onClick={() => setIsConceptOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm md:text-base font-semibold transition-all ${showMemoryTab ? 'border-l border-[var(--theme-lesson-panel-border)]' : ''} viz-tab-inactive hover:viz-tab-active`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    {t('lesson.concept')}
                  </button>
                )}
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
            ? { height: 'calc(100svh - 64px)', minHeight: '400px', margin: '4px 0' }
            : { height: 'calc(100vh - 80px)', position: 'sticky' as const, top: 0, border: '1px solid var(--theme-lesson-panel-border)', marginTop: '1rem' }),
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

      <ConceptPopup
        open={isConceptOpen}
        onOpenChange={setIsConceptOpen}
        conceptType={conceptType}
        conceptState={conceptState}
        explanation={currentStep?.explanation}
        code={currentStep?.code}
      />
    </div>
  );
}
