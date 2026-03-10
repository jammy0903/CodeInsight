/**
 * LessonUnifiedView - Single lesson layout for all languages & screen sizes
 *
 * Desktop (horizontal): code left | content right
 * Mobile (vertical):    code top  | content bottom
 *
 * Two rounds: R1 (explanation) → R2 (visualization) → quiz
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { hasMeaningfulValue, hasClassicMemoryData, hasJsMemoryData, hasJavaMemoryData } from '../utils/visualizationData';

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

interface AiEvidenceData {
  phase?: string;
  expectedPath?: string;
  actualPath?: string;
  patch?: string;
  output?: string;
  expectedOutput?: string;
  actualOutput?: string;
  checklist: string[];
}

type HoverTarget = 'expect' | 'real' | 'patchOld' | 'patchNew' | null;

function getAiEvidenceData(
  stepRecord: Record<string, unknown> | undefined
): AiEvidenceData {
  if (!stepRecord) {
    return { checklist: [] };
  }

  const state = isRecord(stepRecord.algorithmState) ? stepRecord.algorithmState : undefined;
  const rawChecklist = state?.checklist;
  const checklist = Array.isArray(rawChecklist)
    ? rawChecklist.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  return {
    phase: asString(state?.phase),
    expectedPath: asString(state?.expectedPath),
    actualPath: asString(state?.actualPath),
    patch: asString(state?.patch),
    output: asString(state?.output),
    expectedOutput: asString(state?.expectedOutput),
    actualOutput: asString(state?.actualOutput) || asString(state?.output),
    checklist,
  };
}

function extractPathSegments(path: string): string[] {
  return path
    .replace(/\[\d+\]/g, '')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
}

function findLineForPath(codeText: string, path: string | undefined): number | undefined {
  if (!path) return undefined;
  const lines = codeText.split('\n');
  const normalizedPath = path.replace(/\s+/g, '');
  const segments = extractPathSegments(path);
  let bestLine: number | undefined;
  let bestScore = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const normalizedLine = line.replace(/\s+/g, '');
    let score = 0;

    if (normalizedLine.includes(normalizedPath)) score += 10;
    for (const seg of segments) {
      if (line.includes(seg)) score += 2;
    }
    if (line.trim().startsWith('//')) score -= 2;

    if (score > bestScore) {
      bestScore = score;
      bestLine = i + 1;
    }
  }

  return bestScore > 0 ? bestLine : undefined;
}

function parsePatchTokens(patch: string | undefined): { from: string; to: string } | undefined {
  if (!patch) return undefined;
  const parts = patch.split('->').map((p) => p.trim());
  if (parts.length !== 2 || !parts[0] || !parts[1]) return undefined;
  return { from: parts[0], to: parts[1] };
}

function replaceFirst(source: string, from: string, to: string): string {
  const idx = source.indexOf(from);
  if (idx < 0) return source;
  return `${source.slice(0, idx)}${to}${source.slice(idx + from.length)}`;
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
  const isAiLiteracy = languageId === 'ai-literacy';
  const [activeVizTab, setActiveVizTab] = useState<'flow' | 'memory' | 'jsMemory'>('flow');
  const [isConceptOpen, setIsConceptOpen] = useState(false);
  const [hoveredPathTarget, setHoveredPathTarget] = useState<HoverTarget>(null);

  // Round navigation (shared for both layouts)
  const nav = useRoundNavigation({
    steps,
    lessonId,
    onQuiz,
    forceSingleRound: isAiLiteracy,
  });

  const currentStep = steps[nav.actualStepIndex];
  const prevStep = nav.actualStepIndex > 0 ? steps[nav.actualStepIndex - 1] : undefined;
  const currentStepRecord = currentStep as Record<string, unknown> | undefined;
  const prevStepRecord = prevStep as Record<string, unknown> | undefined;
  const currentStepIllustrations = Array.isArray(currentStepRecord?.illustrations)
    ? (currentStepRecord.illustrations as Array<{ src: string; alt?: string; caption?: string }>)
    : undefined;
  const aiEvidence = getAiEvidenceData(currentStepRecord);
  const prevAiEvidence = getAiEvidenceData(prevStepRecord);
  const effectiveExpectedPath = aiEvidence.expectedPath || prevAiEvidence.expectedPath;
  const effectiveActualPath = aiEvidence.actualPath || prevAiEvidence.actualPath;
  const patchTokens = parsePatchTokens(aiEvidence.patch);
  const currentStepCode = asString(currentStepRecord?.code);
  const expectedLine = useMemo(
    () => findLineForPath(code, effectiveExpectedPath),
    [code, effectiveExpectedPath]
  );
  const realLine = useMemo(
    () => findLineForPath(code, effectiveActualPath),
    [code, effectiveActualPath]
  );
  const currentCodeLine = useMemo(() => {
    if (currentStepCode) return currentStepCode;
    const line = currentStep?.line;
    if (!line || line < 1) return '';
    const lines = code.split('\n');
    return lines[line - 1] || '';
  }, [code, currentStep?.line, currentStepCode]);
  const patchOldLineText = useMemo(() => {
    if (!patchTokens) return '';
    if (effectiveExpectedPath && effectiveActualPath && currentCodeLine.includes(effectiveActualPath)) {
      return replaceFirst(currentCodeLine, effectiveActualPath, effectiveExpectedPath);
    }
    return replaceFirst(currentCodeLine, patchTokens.to, patchTokens.from);
  }, [currentCodeLine, patchTokens, effectiveExpectedPath, effectiveActualPath]);
  const patchNewLineText = currentCodeLine;
  const pathPulseLine = useMemo(() => {
    if (!isAiLiteracy || !hoveredPathTarget) return undefined;
    if (hoveredPathTarget === 'expect') return expectedLine;
    if (hoveredPathTarget === 'real') return realLine;
    if (hoveredPathTarget === 'patchOld') return expectedLine ?? currentStep?.line;
    if (hoveredPathTarget === 'patchNew') return realLine ?? currentStep?.line;
    return undefined;
  }, [isAiLiteracy, hoveredPathTarget, expectedLine, realLine, currentStep?.line]);
  const isExplanationRound = nav.round === 'explanation';
  const { showMemoryTab, showJsMemoryTab } = useMemo(() => {
    const vizSteps = nav.vizStepIndices.map(i => steps[i]);
    return {
      showMemoryTab: (
        (languageId === 'c' && hasClassicMemoryData(vizSteps)) ||
        (languageId === 'java' && hasJavaMemoryData(vizSteps))
      ),
      showJsMemoryTab: languageId === 'javascript' && hasJsMemoryData(vizSteps),
    };
  }, [languageId, nav.vizStepIndices, steps]);
  const hasVizTabs = showMemoryTab || showJsMemoryTab;
  const flowLanguage = languageId === 'python-practical'
    ? 'python'
    : (languageId === 'ai-literacy' ? 'javascript' : (languageId || 'c'));
  const rawConceptType = asString(currentStepRecord?.conceptVisualizationType) || asString(currentStepRecord?.visualizationType);
  const conceptType = rawConceptType && CONCEPT_TYPES.has(rawConceptType) ? rawConceptType : undefined;
  const conceptState = isRecord(currentStepRecord?.conceptState) ? currentStepRecord.conceptState : undefined;
  const hasConceptPopup = !!conceptType || hasMeaningfulValue(conceptState);

  // Visualization data
  const { memoryState, changedBlocks } = useLessonVisualization(steps, nav.actualStepIndex);

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
      {!isAiLiteracy && (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={nav.goToExplanationStart}
            className={`round-tab px-2.5 py-1 text-xs md:text-sm font-bold rounded-full transition-all ${
              isExplanationRound
                ? 'round-tab-active opacity-100'
                : 'round-tab-inactive opacity-45 saturate-0 hover:opacity-70'
            }`}
          >
            {t('lesson.explanation')}
          </button>
          {nav.hasVizRound && (
            <button
              type="button"
              onClick={nav.goToVisualizationStart}
              className={`round-tab px-2.5 py-1 text-xs md:text-sm font-bold rounded-full transition-all ${
                !isExplanationRound
                  ? 'round-tab-active opacity-100'
                  : 'round-tab-inactive opacity-45 saturate-0 hover:opacity-70'
              }`}
            >
              {t('lesson.visualization')}
            </button>
          )}
        </div>
      )}
      {isAiLiteracy && (
        <span className="text-xs md:text-sm font-semibold opacity-80">
          AI Verification
        </span>
      )}
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
              keyInsight={currentStep?.keyInsight}
              keyInsightTitle={currentStep?.keyInsightTitle}
              illustrations={currentStepIllustrations}
            />
            {isAiLiteracy && (
              <div className="mt-4 rounded-xl border border-[var(--theme-lesson-panel-border)] bg-[var(--theme-lesson-panel-bg)] overflow-hidden">
                <div className="px-3 py-2 text-sm font-semibold border-b border-[var(--theme-lesson-panel-border)] flex items-center gap-2">
                  <span>Evidence</span>
                  <span className="text-[11px] font-semibold rounded-full border border-[var(--theme-lesson-panel-border)] px-2 py-0.5 opacity-80">
                    by {aiEvidence.phase || 'inspect'}
                  </span>
                </div>
                <div className="px-3 py-3 space-y-2.5 text-xs">
                  {(aiEvidence.expectedPath || aiEvidence.actualPath) && (
                    <div
                      className="rounded-lg border border-[var(--theme-lesson-panel-border)] px-2.5 py-2 transition-all duration-200"
                      onMouseLeave={() => setHoveredPathTarget(null)}
                    >
                      <div className="font-semibold opacity-70 mb-1">Path Check</div>
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                        {effectiveExpectedPath && (
                          <div
                            className={`rounded-md border px-2 py-2 transition-all ${
                              hoveredPathTarget === 'expect'
                                ? 'border-rose-400 bg-rose-100 shadow-[0_0_0_2px_rgba(251,113,133,0.25)]'
                                : 'border-rose-200 bg-rose-50'
                            }`}
                            onMouseEnter={() => setHoveredPathTarget('expect')}
                          >
                            <div className="mb-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center rounded-full border border-rose-300 bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700">
                                EXPECT
                              </span>
                              <span className="text-[11px] text-rose-700">AI Guess</span>
                            </div>
                            <div className="font-mono break-all text-rose-900">{effectiveExpectedPath}</div>
                            <div className="text-[11px] text-rose-700 mt-1">AI assumes {'->'} value</div>
                          </div>
                        )}
                        {effectiveExpectedPath && effectiveActualPath && <div />}
                        {effectiveActualPath && (
                          <div
                            className={`rounded-md border px-2 py-2 transition-all ${
                              hoveredPathTarget === 'real'
                                ? 'border-emerald-400 bg-emerald-100 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]'
                                : 'border-emerald-200 bg-emerald-50'
                            }`}
                            onMouseEnter={() => setHoveredPathTarget('real')}
                          >
                            <div className="mb-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700">
                                REAL
                              </span>
                              <span className="text-[11px] text-emerald-700">Runtime</span>
                            </div>
                            <div className="font-mono break-all text-emerald-900">{effectiveActualPath}</div>
                            <div className="text-[11px] text-emerald-700 mt-1">Runtime points {'=>'} source</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {aiEvidence.patch && (
                    <div className="rounded-lg border border-[var(--theme-lesson-panel-border)] px-2.5 py-2">
                      <div className="font-semibold opacity-70 mb-1">Patch</div>
                      <div className="space-y-1.5">
                        <div
                          className={`rounded-md border px-2 py-1.5 font-mono break-all transition-all ${
                            hoveredPathTarget === 'patchOld'
                              ? 'border-rose-400 bg-rose-100 shadow-[0_0_0_2px_rgba(251,113,133,0.25)]'
                              : 'border-rose-200 bg-rose-50'
                          }`}
                          onMouseEnter={() => setHoveredPathTarget('patchOld')}
                          onMouseLeave={() => setHoveredPathTarget(null)}
                        >
                          <span className="text-rose-700 mr-2">-</span>
                          <span>{patchOldLineText || aiEvidence.patch}</span>
                        </div>
                        <div
                          className={`rounded-md border px-2 py-1.5 font-mono break-all transition-all ${
                            hoveredPathTarget === 'patchNew'
                              ? 'border-emerald-400 bg-emerald-100 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]'
                              : 'border-emerald-200 bg-emerald-50'
                          }`}
                          onMouseEnter={() => setHoveredPathTarget('patchNew')}
                          onMouseLeave={() => setHoveredPathTarget(null)}
                        >
                          <span className="text-emerald-700 mr-2">+</span>
                          <span>{patchNewLineText || aiEvidence.patch}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {(aiEvidence.expectedOutput || aiEvidence.actualOutput || aiEvidence.output) && (
                    <div className="rounded-lg border border-[var(--theme-lesson-panel-border)] px-2.5 py-2">
                      <div className="font-semibold opacity-70 mb-1">Output</div>
                      <div className="space-y-1.5">
                        {(aiEvidence.expectedOutput || aiEvidence.output) && (
                          <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 font-mono break-all">
                            <span className="inline-flex items-center rounded-full border border-rose-300 bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-700 mr-2">
                              BEFORE
                            </span>
                            <span className="text-rose-900">{aiEvidence.expectedOutput || aiEvidence.output}</span>
                          </div>
                        )}
                        {aiEvidence.actualOutput && (
                          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 font-mono break-all">
                            <span className="inline-flex items-center rounded-full border border-emerald-300 bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-700 mr-2">
                              AFTER
                            </span>
                            <span className="text-emerald-900">{aiEvidence.actualOutput}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {aiEvidence.checklist.length > 0 && (
                    <div className="rounded-lg border border-[var(--theme-lesson-panel-border)] px-2.5 py-2">
                      <div className="font-semibold opacity-70 mb-1">Checklist</div>
                      <div className="space-y-1">
                        {aiEvidence.checklist.map((item) => (
                          <div key={item} className="font-mono">- {item}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
            {(hasVizTabs || hasConceptPopup) && (
              <div className="flex items-center shrink-0 border-b border-[var(--theme-lesson-panel-border)]">
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
            )}

            {/* Visualization content */}
            <div className={`w-full min-h-[67px] px-0 py-2 ${isMobile ? 'viz-zoom-container' : ''}`}>
              {activeVizTab === 'flow' || !hasVizTabs ? (
                <LessonFlowVisualizer
                  step={currentStep}
                  prevStep={nav.actualStepIndex > 0 ? steps[nav.actualStepIndex - 1] : null}
                  language={flowLanguage}
                  fullCode={code}
                  memoryState={memoryState ? {
                    stack: memoryState.stack.map((s) => ({ ...s, name: s.name || '?' })),
                    heap: memoryState.heap.map((h) => ({ ...h, name: h.name || '?' })),
                  } : undefined}
                  stdout={currentStep?.stdout}
                />
              ) : activeVizTab === 'jsMemory' ? (
                <LessonFlowVisualizer
                  step={toJsMemoryStep(currentStep)}
                  prevStep={nav.actualStepIndex > 0 ? toJsMemoryStep(steps[nav.actualStepIndex - 1]) : null}
                  language={flowLanguage}
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
        pointerLine={isAiLiteracy ? currentStep?.line : undefined}
        pulseLine={pathPulseLine}
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
