/**
 * CppFlowVisualizer - Stack/Heap 2-region 레이아웃
 *
 * 힙 데이터가 있을 때 2-column 레이아웃:
 *  STACK (좌) | HEAP (우)
 *
 * 힙이 없으면 기존 FlowVisualizer(단일 컬럼)로 폴백.
 */

import { memo, useMemo, useRef } from 'react';
import type { FlowStep, FlowVariable } from '@codeinsight/shared';
import { FlowVisualizer } from '../c/CFlowVisualizer';
import { ArrowLayer } from '../c/components/ArrowLayer';
import { ContainerBox } from './components/ContainerBox';
import { CStyler } from '../c/adapters/CStyler';
import type { FlowTheme } from '../shared/styles';

interface CppFlowVisualizerProps {
  step: FlowStep;
  prevStep?: FlowStep | null;
  theme?: FlowTheme;
  onVariableClick?: (variable: FlowVariable) => void;
  className?: string;
}

export const CppFlowVisualizer = memo(function CppFlowVisualizer({
  step,
  prevStep = null,
  theme = 'light',
  onVariableClick,
  className = '',
}: CppFlowVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styler = useMemo(() => new CStyler(theme), [theme]);

  // Separate stack and heap frames
  const hasHeap = step.frames.some((f) => f.name === 'heap');
  const stackFrames = step.frames.filter((f) => f.name !== 'heap');
  const heapFrame = step.frames.find((f) => f.name === 'heap');

  // Get heap variables
  const heapVariables = useMemo(() => {
    if (!heapFrame) return [];
    const varMap = new Map(step.variables.map((v) => [v.id, v]));
    return heapFrame.variableIds
      .map((id) => varMap.get(id))
      .filter((v): v is FlowVariable => v !== undefined);
  }, [step.variables, heapFrame]);

  // Get container variables (from any frame)
  const containerVariables = useMemo(() => {
    return step.variables.filter(
      (v) => v.metadata?.containerInfo
    );
  }, [step.variables]);

  // Build a stack-only FlowStep for the FlowVisualizer
  const stackOnlyStep = useMemo(() => {
    if (!hasHeap) return step;
    return {
      ...step,
      frames: stackFrames,
      variables: step.variables.filter((v) => v.scope !== 'heap'),
    };
  }, [step, stackFrames, hasHeap]);

  // Build stack-only prevStep
  const stackOnlyPrevStep = useMemo(() => {
    if (!prevStep || !hasHeap) return prevStep;
    return {
      ...prevStep,
      frames: prevStep.frames.filter((f) => f.name !== 'heap'),
      variables: prevStep.variables.filter((v) => v.scope !== 'heap'),
    };
  }, [prevStep, hasHeap]);

  if (!hasHeap) {
    // No heap — use standard FlowVisualizer
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <FlowVisualizer
          step={step}
          prevStep={prevStep}
          theme={theme}
          onVariableClick={onVariableClick}
        />
        {/* STL container boxes below the standard view */}
        {containerVariables.length > 0 && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            {containerVariables.map((v) => (
              <ContainerBox
                key={v.id}
                name={v.name}
                type={v.type}
                value={v.value}
                containerInfo={v.metadata!.containerInfo as {
                  containerType: 'vector' | 'string' | 'map' | 'set' | 'array';
                  size: number;
                  capacity?: number;
                  elements?: Array<{ index: number; value: string; type: string }>;
                }}
              />
            ))}
          </div>
        )}
        <ArrowLayer
          variables={step.variables}
          styler={styler}
          containerRef={containerRef}
        />
      </div>
    );
  }

  // 2-column Stack/Heap layout
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-4 p-4 min-h-full">
        {/* STACK region */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Stack
          </div>
          <FlowVisualizer
            step={stackOnlyStep}
            prevStep={stackOnlyPrevStep}
            theme={theme}
            onVariableClick={onVariableClick}
          />
          {/* STL containers in stack */}
          {containerVariables.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {containerVariables.map((v) => (
                <ContainerBox
                  key={v.id}
                  name={v.name}
                  type={v.type}
                  value={v.value}
                  containerInfo={v.metadata!.containerInfo as {
                    containerType: 'vector' | 'string' | 'map' | 'set' | 'array';
                    size: number;
                    capacity?: number;
                    elements?: Array<{ index: number; value: string; type: string }>;
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* HEAP region */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Heap
          </div>
          <div className="space-y-2">
            {heapVariables.map((v) => (
              <div
                key={v.id}
                className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2.5 cursor-pointer hover:border-emerald-400 transition-colors"
                onClick={() => onVariableClick?.(v)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-800">{v.name}</span>
                  <span className="text-[10px] text-emerald-500 font-mono">{v.type}</span>
                </div>
                <div className="text-xs font-mono text-emerald-900">{String(v.value)}</div>
                {v.address && (
                  <div className="text-[9px] text-emerald-400 font-mono mt-0.5">{v.address}</div>
                )}
                {v.metadata?.isSmartPtr && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                      {String(v.metadata.ownership)}_ptr
                    </span>
                    {v.metadata.refCount != null && (
                      <span className="text-[9px] text-emerald-500">
                        refs: {String(v.metadata.refCount)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Arrow layer spans both regions */}
      <ArrowLayer
        variables={step.variables}
        styler={styler}
        containerRef={containerRef}
      />
    </div>
  );
});
