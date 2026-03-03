/**
 * LessonFlowVisualizer Component
 *
 * LessonStep을 받아서 vizType에 따라 적절한 시각화 컴포넌트로 라우팅.
 *
 * 라우팅 우선순위:
 * 1. Non-memory viz types (scope, thisBinding, prototype, promise, terminal, eventLoop)
 *    → 각 전용 뷰어로 직접 전달 (Transformer 불필요)
 * 2. Memory viz types (memory, jsMemory, pythonMemory, python, javaMemory, javascript)
 *    → 언어별 어댑터 → FlowStep → ReferenceGraphView (Python/Java/JS)
 *    → 기존 FlowVisualizer + ArrowLayer (C)
 */

import { memo, useMemo, useRef, type ComponentProps } from 'react';
import type { LessonStep, FlowLanguage, FlowVariable } from '@codeinsight/shared';
import { FlowVisualizer } from './c/CFlowVisualizer';
import { CppFlowVisualizer } from './cpp/CppFlowVisualizer';
import { ReferenceGraphView } from './shared/components/ReferenceGraphView';
import { EventLoopView } from './javascript/components/EventLoopView';
import { ScopeView } from './javascript/components/ScopeView';
import { ThisBindingView } from './javascript/components/ThisBindingView';
import { PrototypeChainView } from './javascript/components/PrototypeChainView';
import { PromiseView } from './javascript/components/PromiseView';
import { AlgorithmView } from './algorithm/AlgorithmView';
import { ArrowLayer } from './c/components/ArrowLayer';
import { createAdapter } from './shared/adapters/registry';
import type { FlowTheme } from './shared/styles';

// ============================================
// 타입 정의
// ============================================

interface MemoryState {
  stack: Array<{ name: string; type?: string; value: string; address?: string; points_to?: string | null }>;
  heap: Array<{ name?: string; type?: string; value: string; address?: string; points_to?: string | null }>;
  frames?: Array<{ name: string }>;
}

interface LessonFlowVisualizerProps {
  step: LessonStep;
  prevStep?: LessonStep | null;
  language?: FlowLanguage | string;
  fullCode?: string;
  theme?: FlowTheme;
  onVariableClick?: (variable: FlowVariable) => void;
  className?: string;
  showArrows?: boolean;
  memoryState?: MemoryState;
  prevMemoryState?: MemoryState;
  stdout?: string;
}

type StepRecord = Record<string, unknown>;
type EventLoopStateProp = ComponentProps<typeof EventLoopView>['eventLoopState'];
type ScopeStateProp = ComponentProps<typeof ScopeView>['scopeState'];
type ThisStateProp = ComponentProps<typeof ThisBindingView>['thisState'];
type PrototypeStateProp = ComponentProps<typeof PrototypeChainView>['prototypeState'];
type PromiseStateProp = ComponentProps<typeof PromiseView>['promiseState'];
type AlgorithmStateProp = ComponentProps<typeof AlgorithmView>['algorithmState'];

type JavaCacheInfo = {
  name?: string;
  range?: string;
  highlight?: number;
  refCount?: number;
  note?: string;
};

type HashSetBucket = { index: string; content: string; searched?: boolean };
type JavaHashSetInfo = { buckets?: HashSetBucket[] };

function isRecord(value: unknown): value is StepRecord {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getField<T>(record: StepRecord | undefined, key: string): T | undefined {
  return record?.[key] as T | undefined;
}

// ============================================
// 컴포넌트
// ============================================

export const LessonFlowVisualizer = memo(function LessonFlowVisualizer({
  step,
  prevStep = null,
  language = 'c',
  fullCode,
  theme = 'light',
  onVariableClick,
  className = '',
  showArrows = true,
  memoryState,
  prevMemoryState,
  stdout,
}: LessonFlowVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRecord = step as StepRecord;
  const prevStepRecord = prevStep ? (prevStep as StepRecord) : undefined;
  const vizType = asString(stepRecord.visualizationType);
  const isJavaScript = language === 'javascript' || language === 'js';
  const eventLoopState = (isRecord(step.eventLoopState) ? step.eventLoopState : undefined) as EventLoopStateProp | undefined;
  const prevEventLoopState = (prevStep && isRecord(prevStep.eventLoopState) ? prevStep.eventLoopState : undefined) as EventLoopStateProp | undefined;
  const eventLoopRecord = isRecord(eventLoopState) ? eventLoopState : undefined;
  const eventLoopWarning = asString(eventLoopRecord?.warning);
  const eventLoopNote = asString(eventLoopRecord?.note);
  const scopeState =
    getField<ScopeStateProp>(stepRecord, 'scopeState') ||
    ((isRecord(step.scopeChainState) ? step.scopeChainState : undefined) as unknown as ScopeStateProp | undefined);
  const prevScopeState =
    getField<ScopeStateProp>(prevStepRecord, 'scopeState') ||
    ((prevStep && isRecord(prevStep.scopeChainState) ? prevStep.scopeChainState : undefined) as unknown as ScopeStateProp | undefined);
  const thisState =
    getField<ThisStateProp>(stepRecord, 'thisState') ||
    ((isRecord(step.thisBindState) ? step.thisBindState : undefined) as unknown as ThisStateProp | undefined);
  const prevThisState =
    getField<ThisStateProp>(prevStepRecord, 'thisState') ||
    ((prevStep && isRecord(prevStep.thisBindState) ? prevStep.thisBindState : undefined) as unknown as ThisStateProp | undefined);
  const prototypeState =
    getField<PrototypeStateProp>(stepRecord, 'prototypeState') ||
    ((isRecord(step.prototypeState) ? step.prototypeState : undefined) as unknown as PrototypeStateProp | undefined);
  const prevPrototypeState =
    getField<PrototypeStateProp>(prevStepRecord, 'prototypeState') ||
    ((prevStep && isRecord(prevStep.prototypeState) ? prevStep.prototypeState : undefined) as unknown as PrototypeStateProp | undefined);
  const promiseState = getField<PromiseStateProp>(stepRecord, 'promiseState');
  const prevPromiseState = getField<PromiseStateProp>(prevStepRecord, 'promiseState');
  const algorithmState = (isRecord(step.algorithmState) ? step.algorithmState : undefined) as unknown as AlgorithmStateProp | undefined;
  const prevAlgorithmState = (prevStep && isRecord(prevStep.algorithmState) ? prevStep.algorithmState : undefined) as unknown as AlgorithmStateProp | undefined;

  // Detect non-memory viz types that bypass the transformer pipeline
  const els = eventLoopState;
  const hasStandardEventLoop = !!(els && (vizType === 'eventLoop' || els.callStack || els.webApis || els.taskQueue || els.microtaskQueue));
  const hasEventLoopNoteOnly = !!(els && !hasStandardEventLoop && (eventLoopNote || eventLoopWarning));
  const isNonMemoryType =
    hasStandardEventLoop ||
    hasEventLoopNoteOnly ||
    (vizType === 'scope' && scopeState) ||
    (vizType === 'thisBinding' && thisState) ||
    (vizType === 'prototype' && prototypeState) ||
    (vizType === 'promise' && promiseState) ||
    (vizType === 'algorithm' && algorithmState);

  // ========================================================
  // All hooks called unconditionally (React rules of hooks)
  // ========================================================

  const adapter = useMemo(
    () => createAdapter(language, theme),
    [language, theme]
  );

  const enrichedStep = useMemo(() => {
    if (isNonMemoryType) return step;
    const enriched = { ...step };
    if (memoryState) {
      enriched.stack = memoryState.stack as LessonStep['stack'];
      enriched.heap = memoryState.heap as LessonStep['heap'];
    }
    if (stdout) {
      enriched.stdout = stdout;
    }
    return enriched;
  }, [step, memoryState, stdout, isNonMemoryType]);

  const enrichedPrevStep = useMemo(() => {
    if (isNonMemoryType) return prevStep;
    if (!prevStep) return null;
    if (!prevMemoryState) return prevStep;
    return {
      ...prevStep,
      stack: prevMemoryState.stack as LessonStep['stack'],
      heap: prevMemoryState.heap as LessonStep['heap'],
    };
  }, [prevStep, prevMemoryState, isNonMemoryType]);

  const flowStep = useMemo(() => {
    if (isNonMemoryType) return null;
    return adapter.transformer.transform(enrichedStep, enrichedPrevStep ?? undefined, fullCode);
  }, [adapter, enrichedStep, enrichedPrevStep, fullCode, isNonMemoryType]);

  const prevFlowStep = useMemo(() => {
    if (isNonMemoryType) return null;
    return enrichedPrevStep ? adapter.transformer.transform(enrichedPrevStep, undefined, fullCode) : null;
  }, [adapter, enrichedPrevStep, fullCode, isNonMemoryType]);

  const flowStepWithAnimations = useMemo(() => {
    if (isNonMemoryType || !flowStep) return null;

    if (!prevFlowStep) {
      const animations = flowStep.variables.flatMap((v) =>
        adapter.animator.createVariableAnimations(v)
      );
      return { ...flowStep, animations };
    }

    const diff = {
      created: flowStep.variables
        .filter((v) => !prevFlowStep.variables.find((pv) => pv.id === v.id))
        .map((v) => v.id),
      updated: flowStep.variables
        .filter((v) => {
          const prev = prevFlowStep.variables.find((pv) => pv.id === v.id);
          return prev && prev.value !== v.value;
        })
        .map((v) => v.id),
      deleted: prevFlowStep.variables
        .filter((pv) => !flowStep.variables.find((v) => v.id === pv.id))
        .map((pv) => pv.id),
      unchanged: flowStep.variables
        .filter((v) => {
          const prev = prevFlowStep.variables.find((pv) => pv.id === v.id);
          return prev && prev.value === v.value;
        })
        .map((v) => v.id),
    };

    const animations = adapter.animator.createAnimationsFromDiff(diff, flowStep, prevFlowStep);
    return { ...flowStep, animations };
  }, [flowStep, prevFlowStep, adapter, isNonMemoryType]);

  // ========================================================
  // Route 1: Non-memory visualization types
  // ========================================================

  if (hasStandardEventLoop) {
    return (
      <div className={className}>
        <EventLoopView
          eventLoopState={eventLoopState || {}}
          prevEventLoopState={prevEventLoopState}
        />
      </div>
    );
  }

  if (hasEventLoopNoteOnly) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            {eventLoopWarning && (
              <p className="text-amber-600 text-sm font-medium mb-2">{eventLoopWarning}</p>
            )}
            {eventLoopNote && (
              <p className="text-[var(--theme-dashboard-text-muted)] text-sm">{eventLoopNote}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (vizType === 'scope' && scopeState) {
    return (
      <div className={className}>
        <ScopeView
          scopeState={scopeState}
          prevScopeState={prevScopeState}
        />
      </div>
    );
  }

  if (vizType === 'thisBinding' && thisState) {
    return (
      <div className={className}>
        <ThisBindingView
          thisState={thisState}
          prevThisState={prevThisState}
        />
      </div>
    );
  }

  if (vizType === 'prototype' && prototypeState) {
    return (
      <div className={className}>
        <PrototypeChainView
          prototypeState={prototypeState}
          prevPrototypeState={prevPrototypeState}
        />
      </div>
    );
  }

  if (vizType === 'promise' && promiseState) {
    return (
      <div className={className}>
        <PromiseView
          promiseState={promiseState}
          prevPromiseState={prevPromiseState}
        />
      </div>
    );
  }

  if (vizType === 'algorithm' && algorithmState) {
    return (
      <div className={className}>
        <AlgorithmView
          algorithmState={algorithmState}
          prevAlgorithmState={prevAlgorithmState}
        />
      </div>
    );
  }

  // ========================================================
  // Route 2: Memory visualization types
  // ========================================================

  if (!flowStepWithAnimations) {
    return <div className={className} />;
  }

  // Python → ReferenceGraphView
  if (language === 'python') {
    return (
      <div className={className}>
        <ReferenceGraphView
          step={flowStepWithAnimations}
          prevStep={prevFlowStep}
          language="python"
        />
      </div>
    );
  }

  // Java → ReferenceGraphView + comparison/warning/note/error 배너 + cache/hashSet
  if (language === 'java') {
    const jms = step.javaMemoryState;
    const jmsRecord = isRecord(step.javaMemoryState) ? (step.javaMemoryState as unknown as StepRecord) : undefined;
    const comparison = jms?.comparison;
    const warning = jms?.warning;
    const note = jms?.note;
    const error = asString(jmsRecord?.error);
    const cache = (isRecord(jmsRecord?.cache) ? jmsRecord.cache : undefined) as JavaCacheInfo | undefined;
    const hashSet = (isRecord(jmsRecord?.hashSet) ? jmsRecord.hashSet : undefined) as JavaHashSetInfo | undefined;

    return (
      <div className={className}>
        {comparison && (
          <div
            className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm font-mono"
            style={{ background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af' }}
          >
            <span style={{ fontSize: '1.1em' }}>&#x2194;</span>
            <span className="font-semibold">{comparison}</span>
          </div>
        )}
        {warning && (
          <div
            className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm"
            style={{ background: '#fefce8', border: '1px solid #fde047', color: '#854d0e' }}
          >
            <span>&#x26A0;</span>
            <span>{warning}</span>
          </div>
        )}
        {note && (
          <div
            className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm"
            style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
          >
            <span style={{ fontSize: '1.1em' }}>&#x1F4DD;</span>
            <span>{note}</span>
          </div>
        )}
        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-sm font-mono"
            style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}
          >
            <span style={{ fontSize: '1.1em' }}>&#x274C;</span>
            <span>{error}</span>
          </div>
        )}
        <ReferenceGraphView
          step={flowStepWithAnimations}
          prevStep={prevFlowStep}
          language="java"
        />
        {/* Integer Cache visualization */}
        {cache && (
          <div className="mt-3 p-3 rounded-lg border" style={{ background: '#fefce8', borderColor: '#fde047' }}>
            <div className="text-xs font-semibold text-amber-800 mb-2">
              {cache.name || 'Integer Cache'} {cache.range ? `(${cache.range})` : ''}
            </div>
            <div className="flex items-center gap-1">
              {[-128, -1, 0, 1, 127].map((n) => (
                <div
                  key={n}
                  className="flex-1 text-center py-1 rounded text-xs font-mono border"
                  style={{
                    background: cache.highlight === n ? '#fbbf24' : '#fffbeb',
                    borderColor: cache.highlight === n ? '#f59e0b' : '#fde68a',
                    fontWeight: cache.highlight === n ? 700 : 400,
                    color: cache.highlight === n ? '#78350f' : '#92400e',
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-amber-700 mt-1 px-1">
              <span>-128</span>
              <span>127</span>
            </div>
            {cache.refCount != null && (
              <div className="text-xs text-amber-700 mt-1">
                refs: {cache.refCount}
              </div>
            )}
            {cache.note && (
              <div className="text-xs text-amber-800 mt-1 font-medium">
                {cache.note}
              </div>
            )}
          </div>
        )}
        {/* HashSet bucket visualization */}
        {hashSet?.buckets && (
          <div className="mt-3 p-3 rounded-lg border" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <div className="text-xs font-semibold text-green-800 mb-2">HashSet Buckets</div>
            <div className="flex flex-wrap gap-2">
              {hashSet.buckets.map((bucket: { index: string; content: string; searched?: boolean }, i: number) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg border text-xs font-mono"
                  style={{
                    background: bucket.searched ? '#bbf7d0' : '#f0fdf4',
                    borderColor: bucket.searched ? '#22c55e' : '#86efac',
                    boxShadow: bucket.searched ? '0 0 0 2px #4ade80' : 'none',
                  }}
                >
                  <div className="text-[10px] text-green-600 mb-0.5">{bucket.index}</div>
                  <div className="font-semibold text-green-900">{bucket.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // JavaScript → ReferenceGraphView
  if (isJavaScript) {
    return (
      <div className={className}>
        <ReferenceGraphView
          step={flowStepWithAnimations}
          prevStep={prevFlowStep}
          language="javascript"
        />
      </div>
    );
  }

  // C++ with heap data → CppFlowVisualizer (Stack/Heap 2-region)
  if (language === 'cpp') {
    return (
      <div className={className}>
        <CppFlowVisualizer
          step={flowStepWithAnimations}
          prevStep={prevFlowStep}
          theme={theme}
          onVariableClick={onVariableClick}
        />
      </div>
    );
  }

  // C 등은 기존 FlowVisualizer + ArrowLayer 사용
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <FlowVisualizer
        step={flowStepWithAnimations}
        prevStep={prevFlowStep}
        theme={theme}
        onVariableClick={onVariableClick}
      />

      {/* 포인터 화살표 (C 전용) */}
      {showArrows && (
        <ArrowLayer
          variables={flowStepWithAnimations.variables}
          styler={adapter.styler}
          containerRef={containerRef}
        />
      )}
    </div>
  );
});

export default LessonFlowVisualizer;
