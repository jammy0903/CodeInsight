/**
 * LessonUnifiedView - Single lesson layout for all languages & screen sizes
 *
 * Desktop (horizontal): code left | content right
 * Mobile (vertical):    code top  | content bottom
 *
 * 한 스텝 = 설명(위) + 시각화(아래). 마지막 스텝 다음은 퀴즈.
 * 시각화 데이터가 없는 스텝은 가장 최근 시각화 상태를 그대로 보여준다.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Layers, Lightbulb } from 'lucide-react';

import { useStepNavigation } from '../hooks/useStepNavigation';
import { usePredictGate } from '../hooks/usePredictGate';
import { PredictQuestion, PredictResult } from './PredictPanel';
import { useLessonVisualization } from '../hooks/useLessonVisualization';
import { useLessonTerminal } from '@/features/visualizers/shared/hooks/useLessonTerminal';
import { useStepGestures } from '@/features/visualizers/shared/hooks/useStepGestures';
import { LessonCodePanel } from './LessonCodePanel';
import { StepExplanation } from './day/StepExplanation';
import { CollapsibleExplanation } from './CollapsibleExplanation';
import { LessonBottomNav } from './LessonBottomNav';

import { LessonFlowVisualizer, LessonMemoryVisualizer } from '@/features/visualizers';
import { ConceptPopup } from '@/features/visualizers/shared/components/ConceptPopup';
import { useIsMobile } from '@/hooks';
import type { LessonStep } from '@/types';
import type { CodeSelection } from '@/features/visualizers/shared/components/CodeMirrorEditor';
import { hasMeaningfulValue, hasClassicMemoryData, hasJsMemoryData, hasJavaMemoryData, hasVisualizationData } from '../utils/visualizationData';

interface LessonUnifiedViewProps {
  code: string;
  steps: LessonStep[];
  languageId: string;
  lessonId: string;
  onQuiz?: () => void;
  onSelectionChange?: (selection: CodeSelection) => void;
}

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
  const [activeVizTab, setActiveVizTab] = useState<'flow' | 'memory' | 'jsMemory'>('flow');
  const [isConceptOpen, setIsConceptOpen] = useState(false);

  const nav = useStepNavigation({ stepCount: steps.length, onQuiz });

  // 실행 중 예측하기: 모든 이동(버튼·키보드·스와이프)은 gate를 거친다
  const gate = usePredictGate({ steps, nav, lessonId });

  const currentStep = steps[nav.stepIndex];

  // 시각화가 있는 스텝들. 현재 스텝에 시각화가 없으면 가장 최근 시각화 상태를 유지한다.
  const vizStepIndices = useMemo(
    () => steps.reduce<number[]>((acc, step, i) => (hasVisualizationData(step) ? [...acc, i] : acc), []),
    [steps]
  );
  const { vizIndex, prevVizIndex } = useMemo(() => {
    const upTo = vizStepIndices.filter((i) => i <= nav.stepIndex);
    return {
      vizIndex: upTo.length > 0 ? upTo[upTo.length - 1] : null,
      prevVizIndex: upTo.length > 1 ? upTo[upTo.length - 2] : null,
    };
  }, [vizStepIndices, nav.stepIndex]);
  const vizStep = vizIndex !== null ? steps[vizIndex] : undefined;
  const prevVizStep = prevVizIndex !== null ? steps[prevVizIndex] : null;
  // 예측 중에는 곧 실행될 줄을 가리킨다 (디버거의 다음 줄 표시처럼)
  const highlightLine = (gate.pendingIndex !== null ? steps[gate.pendingIndex]?.line : currentStep?.line) || 1;
  const currentStepRecord = currentStep as Record<string, unknown> | undefined;
  const currentStepIllustrations = Array.isArray(currentStepRecord?.illustrations)
    ? (currentStepRecord.illustrations as Array<{ src: string; alt?: string; caption?: string }>)
    : undefined;
  const { showMemoryTab, showJsMemoryTab } = useMemo(() => {
    const vizSteps = vizStepIndices.map(i => steps[i]);
    return {
      showMemoryTab: (
        (languageId === 'c' && hasClassicMemoryData(vizSteps)) ||
        (languageId === 'java' && hasJavaMemoryData(vizSteps))
      ),
      showJsMemoryTab: languageId === 'javascript' && hasJsMemoryData(vizSteps),
    };
  }, [languageId, vizStepIndices, steps]);
  const hasVizTabs = showMemoryTab || showJsMemoryTab;
  const flowLanguage = languageId || 'c';
  const rawConceptType = asString(currentStepRecord?.conceptVisualizationType) || asString(currentStepRecord?.visualizationType);
  const conceptType = rawConceptType && CONCEPT_TYPES.has(rawConceptType) ? rawConceptType : undefined;
  const conceptState = isRecord(currentStepRecord?.conceptState) ? currentStepRecord.conceptState : undefined;
  const hasConceptPopup = !!conceptType || hasMeaningfulValue(conceptState);

  // Visualization data
  const { memoryState, changedBlocks } = useLessonVisualization(steps, vizIndex ?? 0);

  const toJsMemoryStep = useCallback((step: LessonStep | undefined): LessonStep => {
    const base = (step || {}) as LessonStep;
    return {
      ...base,
      visualizationType: 'javascript',
      eventLoopState: undefined,
      scopeState: undefined,
      thisState: undefined,
      prototypeState: undefined,
      promiseState: undefined,
    };
  }, []);

  // Terminal output
  const terminalLines = useLessonTerminal({
    steps,
    currentStepIndex: nav.stepIndex,
    languageId,
    diffMode: false,
  });

  // Keyboard gestures (desktop)
  useStepGestures({
    onPrev: gate.goPrev,
    onNext: gate.goNext,
    enabled: !isMobile,
    isModalOpen: isConceptOpen,
    canGoPrev: nav.canGoPrev,
    canGoNext: true,
  });

  useEffect(() => {
    setIsConceptOpen(false);
  }, [nav.stepIndex]);

  useEffect(() => {
    setActiveVizTab('flow');
  }, [languageId]);

  useEffect(() => {
    if (activeVizTab === 'memory' && !showMemoryTab) {
      setActiveVizTab('flow');
      return;
    }
    if (activeVizTab === 'jsMemory' && !showJsMemoryTab) {
      setActiveVizTab('flow');
    }
  }, [activeVizTab, showMemoryTab, showJsMemoryTab]);

  // Next button label
  const nextLabel = gate.pendingIndex !== null
    ? t('lesson.predict.choose')
    : nav.isLast ? t('lesson.quiz') : t('common.next');

  // Step header: 진행 + 스텝 제목
  const stepHeader = (
    <div
      className="flex items-center gap-2 px-3 py-1.5 shrink-0 border-b"
      style={{
        background: 'var(--theme-lesson-panel-bg)',
        borderColor: 'var(--theme-lesson-panel-border)',
      }}
    >
      <span className="text-xs md:text-sm font-semibold opacity-60 shrink-0">
        {nav.stepIndex + 1}/{nav.total} · L{currentStep?.line || 1}
      </span>
      {currentStep?.title && (
        <span className="text-xs md:text-sm font-bold truncate">{currentStep.title}</span>
      )}
    </div>
  );

  const vizTabs = (hasVizTabs || hasConceptPopup) && (
    <div className="flex items-center shrink-0 border-y border-[var(--theme-lesson-panel-border)]">
      {hasVizTabs && (
        <div className="flex flex-1">
          <button
            onClick={() => setActiveVizTab('flow')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm md:text-base font-semibold transition-all ${activeVizTab === 'flow' ? 'viz-tab-active' : 'viz-tab-inactive'}`}
          >
            <Play className="w-4 h-4" />
            {t('lesson.flow')}
          </button>
          {showMemoryTab && (
            <button
              onClick={() => setActiveVizTab('memory')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm md:text-base font-semibold transition-all border-l border-[var(--theme-lesson-panel-border)] ${activeVizTab === 'memory' ? 'viz-tab-active' : 'viz-tab-inactive'}`}
            >
              <Layers className="w-4 h-4" />
              {t('lesson.memory')}
            </button>
          )}
          {showJsMemoryTab && (
            <button
              onClick={() => setActiveVizTab('jsMemory')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 text-sm md:text-base font-semibold transition-all border-l border-[var(--theme-lesson-panel-border)] ${activeVizTab === 'jsMemory' ? 'viz-tab-active' : 'viz-tab-inactive'}`}
            >
              <Layers className="w-4 h-4" />
              JS Memory
            </button>
          )}
        </div>
      )}

      {hasConceptPopup && (
        <button
          onClick={() => setIsConceptOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm md:text-base font-semibold transition-all ${hasVizTabs ? 'border-l border-[var(--theme-lesson-panel-border)]' : ''} viz-tab-inactive hover:viz-tab-active`}
        >
          <Lightbulb className="w-4 h-4" />
          {t('lesson.concept')}
        </button>
      )}
    </div>
  );

  const memoryForFlow = memoryState ? {
    stack: memoryState.stack.map((s) => ({ ...s, name: s.name || '?' })),
    heap: memoryState.heap.map((h) => ({ ...h, name: h.name || '?' })),
  } : undefined;

  // Content: 설명(위) → 예측 카드/결과 → 시각화(아래)
  const contentArea = (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-4 explanation-container">
        <CollapsibleExplanation key={nav.stepIndex}>
          <StepExplanation
            explanation={currentStep?.explanation || ''}
            stepIndex={nav.stepIndex}
            keyInsight={currentStep?.keyInsight}
            keyInsightTitle={currentStep?.keyInsightTitle}
            illustrations={currentStepIllustrations}
          />
        </CollapsibleExplanation>
      </div>

      {gate.pendingPredict ? (
        <PredictQuestion predict={gate.pendingPredict} onAnswer={gate.answer} />
      ) : gate.feedback ? (
        <PredictResult feedback={gate.feedback} />
      ) : null}

      {vizStep && (
        <div className="w-full">
          {vizTabs}
          <div className={`w-full min-h-[67px] px-0 py-2 ${isMobile ? 'viz-zoom-container' : ''}`}>
            {activeVizTab === 'flow' || !hasVizTabs ? (
              <LessonFlowVisualizer
                step={vizStep}
                prevStep={prevVizStep}
                language={flowLanguage}
                fullCode={code}
                memoryState={memoryForFlow}
                stdout={vizStep.stdout}
              />
            ) : activeVizTab === 'jsMemory' ? (
              <LessonFlowVisualizer
                step={toJsMemoryStep(vizStep)}
                prevStep={prevVizStep ? toJsMemoryStep(prevVizStep) : null}
                language={flowLanguage}
                fullCode={code}
                memoryState={memoryForFlow}
                stdout={vizStep.stdout}
              />
            ) : (
              <LessonMemoryVisualizer
                step={vizStep}
                language={languageId}
                memoryState={memoryState}
                changedBlocks={changedBlocks}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      <LessonCodePanel
        code={code}
        highlightLine={highlightLine}
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
        {stepHeader}
        {contentArea}
      </LessonCodePanel>

      <LessonBottomNav
        onPrev={gate.goPrev}
        onNext={gate.goNext}
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
