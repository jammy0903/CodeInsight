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

import { memo, useMemo, useRef } from 'react';
import type { LessonStep, FlowLanguage, FlowVariable } from '@codeinsight/shared';
import { FlowVisualizer } from './FlowVisualizer';
import { ReferenceGraphView } from './components/ReferenceGraphView';
import { EventLoopView } from './components/EventLoopView';
import { ScopeView } from './components/ScopeView';
import { ThisBindingView } from './components/ThisBindingView';
import { PrototypeChainView } from './components/PrototypeChainView';
import { PromiseView } from './components/PromiseView';
import { TerminalStepView } from './components/TerminalStepView';
import { ArrowLayer } from './components/ArrowLayer';
import { createAdapter } from './adapters';
import type { FlowTheme } from './styles';

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
  const vizType = (step as any).visualizationType as string | undefined;
  const isJavaScript = language === 'javascript' || language === 'js';

  // Detect non-memory viz types that bypass the transformer pipeline
  const els = (step as any).eventLoopState;
  const hasStandardEventLoop = els && (vizType === 'eventLoop' || els.callStack || els.webApis || els.taskQueue || els.microtaskQueue);
  const hasEventLoopNoteOnly = els && !hasStandardEventLoop && (els.note || els.warning);
  const isNonMemoryType =
    hasStandardEventLoop ||
    hasEventLoopNoteOnly ||
    (vizType === 'scope' && (step as any).scopeState) ||
    (vizType === 'thisBinding' && (step as any).thisState) ||
    (vizType === 'prototype' && (step as any).prototypeState) ||
    (vizType === 'promise' && (step as any).promiseState) ||
    vizType === 'terminal';

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
    if (memoryState && !isJavaScript) {
      enriched.stack = memoryState.stack as LessonStep['stack'];
      enriched.heap = memoryState.heap as LessonStep['heap'];
    }
    if (stdout) {
      enriched.stdout = stdout;
    }
    return enriched;
  }, [step, memoryState, stdout, isJavaScript, isNonMemoryType]);

  const enrichedPrevStep = useMemo(() => {
    if (isNonMemoryType) return prevStep;
    if (!prevStep) return null;
    if (!prevMemoryState) return prevStep;
    if (isJavaScript) return prevStep;
    return {
      ...prevStep,
      stack: prevMemoryState.stack as LessonStep['stack'],
      heap: prevMemoryState.heap as LessonStep['heap'],
    };
  }, [prevStep, prevMemoryState, isJavaScript, isNonMemoryType]);

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
          eventLoopState={(step as any).eventLoopState}
          prevEventLoopState={(prevStep as any)?.eventLoopState}
        />
      </div>
    );
  }

  if (hasEventLoopNoteOnly) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            {els.warning && (
              <p className="text-amber-600 text-sm font-medium mb-2">{els.warning}</p>
            )}
            {els.note && (
              <p className="text-[var(--theme-dashboard-text-muted)] text-sm">{els.note}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (vizType === 'scope' && (step as any).scopeState) {
    return (
      <div className={className}>
        <ScopeView
          scopeState={(step as any).scopeState}
          prevScopeState={(prevStep as any)?.scopeState}
        />
      </div>
    );
  }

  if (vizType === 'thisBinding' && (step as any).thisState) {
    return (
      <div className={className}>
        <ThisBindingView
          thisState={(step as any).thisState}
          prevThisState={(prevStep as any)?.thisState}
        />
      </div>
    );
  }

  if (vizType === 'prototype' && (step as any).prototypeState) {
    return (
      <div className={className}>
        <PrototypeChainView
          prototypeState={(step as any).prototypeState}
          prevPrototypeState={(prevStep as any)?.prototypeState}
        />
      </div>
    );
  }

  if (vizType === 'promise' && (step as any).promiseState) {
    return (
      <div className={className}>
        <PromiseView
          promiseState={(step as any).promiseState}
          prevPromiseState={(prevStep as any)?.promiseState}
        />
      </div>
    );
  }

  if (vizType === 'terminal') {
    return (
      <div className={className}>
        <TerminalStepView
          explanation={(step as any).explanation}
          stdout={stdout || (step as any).stdout}
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
    const jms = (step as any).javaMemoryState;
    const comparison = jms?.comparison;
    const warning = jms?.warning;
    const note = jms?.note;
    const error = jms?.error;
    const cache = jms?.cache;
    const hashSet = jms?.hashSet;

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

  // C 등은 기존 FlowVisualizer 사용
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
