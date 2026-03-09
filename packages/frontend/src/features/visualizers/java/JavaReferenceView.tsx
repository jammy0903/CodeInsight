/**
 * JavaReferenceView — Java 참조 시각화 (Python Tutor 스타일)
 *
 * 2분할 레이아웃:
 * - 왼쪽 (Stack): main 프레임 + 변수 (원시값 인라인, 참조는 → 아이콘)
 * - 오른쪽 (Heap): 힙 객체 카드 + String Pool
 * - SVG 오버레이: 베지어 곡선 화살표
 */

import { memo, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { FlowStep, FlowVariable } from '@codeinsight/shared';

// ============================================
// 상수
// ============================================

/** Java 타입별 색상 */
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  int:       { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  Integer:   { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  long:      { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  double:    { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  float:     { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  boolean:   { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  char:      { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  String:    { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  'String (Pool)': { bg: '#cffafe', border: '#22d3ee', text: '#0e7490' },
  Object:    { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
  Reference: { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
  Array:     { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
  null:      { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
  unknown:   { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
  default:   { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
};

/** Java 타입별 이모지 */
const TYPE_EMOJI: Record<string, string> = {
  int: '🔢', Integer: '🔢', long: '🔢', double: '🔢', float: '🔢',
  boolean: '✓', char: '🔤',
  String: '📝', 'String (Pool)': '🏊',
  Object: '📦', Reference: '📦', Array: '📋',
  null: '∅',
};

const FRAME_COLORS = {
  main:       { bg: '#eff6ff', border: '#60a5fa', header: '#dbeafe', headerText: '#1d4ed8' },
  stringPool: { bg: '#ecfeff', border: '#22d3ee', header: '#cffafe', headerText: '#0e7490' },
};

function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? TYPE_COLORS.default;
}

function getTypeEmoji(type: string) {
  return TYPE_EMOJI[type] ?? '📦';
}

// ============================================
// 타입
// ============================================

interface ArrowInfo {
  id: string;
  fromId: string;
  toId: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  isShared: boolean;
}

interface JavaReferenceViewProps {
  step: FlowStep;
  prevStep?: FlowStep | null;
  className?: string;
  activeFrameName?: string;
  frameAction?: string;
}

interface StackFrameGroup {
  name: string;
  variables: FlowVariable[];
}

// ============================================
// HeapCard (Heap + String Pool)
// ============================================

interface HeapCardProps {
  object: FlowVariable;
  nameCount: number;
  isNew: boolean;
  isUpdated: boolean;
  isHighlighted: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}

const HeapCard = memo(function HeapCard({
  object, nameCount, isNew, isUpdated, isHighlighted, onHoverStart, onHoverEnd,
}: HeapCardProps) {
  const colors = getTypeColor(object.type);
  const emoji = getTypeEmoji(object.type);
  const isShared = nameCount > 1;
  const meta = object.metadata as Record<string, unknown> | undefined;
  const displayValue = String(object.value ?? 'null');
  const isStringPool = object.scope === 'stringPool';

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, scale: 0.85 } : false}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-variable-id={object.id}
      onMouseEnter={() => onHoverStart(object.id)}
      onMouseLeave={onHoverEnd}
      className="relative px-3.5 py-2.5 rounded-xl border-2 cursor-pointer select-none"
      style={{
        backgroundColor: isHighlighted ? '#fefce8' : colors.bg,
        borderColor: isHighlighted ? '#fbbf24' : meta?.isNew ? '#22c55e' : isShared ? '#a78bfa' : colors.border,
        boxShadow: isHighlighted
          ? '0 0 0 3px #fbbf2466, 0 4px 12px rgba(0,0,0,0.12)'
          : isShared
          ? '0 0 0 2px #a78bfa40'
          : '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.15s, border-color 0.15s, background-color 0.15s',
      }}
    >
      {/* NEW badge */}
      {meta?.isNew && (
        <span
          className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded text-[10px] font-bold z-20"
          style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #22c55e' }}
        >
          NEW
        </span>
      )}

      {/* String Pool badge */}
      {isStringPool && (
        <span
          className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] font-bold z-20"
          style={{ background: '#cffafe', color: '#0e7490', border: '1px solid #22d3ee' }}
        >
          Pool
        </span>
      )}

      {/* Value */}
      <div className="flex items-center gap-2">
        <span className="text-sm">{emoji}</span>
        <motion.span
          key={displayValue}
          initial={isUpdated ? { color: '#2563eb', scale: 1.05 } : false}
          animate={{ color: colors.text, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="font-mono font-semibold text-sm leading-tight"
        >
          {displayValue}
        </motion.span>
      </div>

      {/* Address label */}
      {object.address && (
        <div className="text-[10px] font-mono text-gray-400 mt-0.5">
          {object.address}
        </div>
      )}

      {/* hashCode */}
      {meta?.hashCode && (
        <div className="text-[10px] font-mono text-gray-500 mt-0.5">
          {String(meta.hashCode)}
        </div>
      )}

    </motion.div>
  );
});

// ============================================
// StackVariable
// ============================================

interface StackVariableProps {
  variable: FlowVariable;
  isHighlighted: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}

const StackVariable = memo(function StackVariable({
  variable, isHighlighted, onHoverStart, onHoverEnd,
}: StackVariableProps) {
  const isReference = variable.isPointer;
  const typeColor = getTypeColor(variable.type);
  const meta = variable.metadata as Record<string, unknown> | undefined;
  const isSameRef = meta?.sameRef === true;

  return (
    <div
      className="flex items-center gap-2 min-h-[28px] rounded-md px-1 -mx-1"
      data-var-id={isReference ? variable.id : undefined}
      onMouseEnter={isReference ? () => onHoverStart(variable.id) : undefined}
      onMouseLeave={isReference ? onHoverEnd : undefined}
      style={{
        cursor: isReference ? 'pointer' : undefined,
        backgroundColor: isHighlighted ? '#fef9c3' : undefined,
        transition: 'background-color 0.15s',
      }}
    >
      {/* Variable name */}
      <span
        className="font-mono text-sm font-bold truncate"
        style={{
          minWidth: '56px',
          maxWidth: '100px',
          color: isSameRef ? '#4338ca' : '#1e293b',
        }}
      >
        {variable.name}
        {isSameRef && (
          <span className="ml-1 text-[10px] text-indigo-400" title="Same reference">&#x1F517;</span>
        )}
      </span>

      {/* Type label */}
      <span className="text-[10px] text-slate-500 font-mono shrink-0">
        {variable.type}
      </span>

      {/* Inline value (primitives only) */}
      {!isReference && (
        <span
          className="px-2 py-0.5 rounded text-xs font-mono font-semibold whitespace-nowrap"
          style={{
            backgroundColor: typeColor.bg,
            color: typeColor.text,
            border: `1px solid ${typeColor.border}`,
          }}
        >
          {String(variable.value)}
        </span>
      )}
    </div>
  );
});

// ============================================
// JavaReferenceView 메인 컴포넌트
// ============================================

export const JavaReferenceView = memo(function JavaReferenceView({
  step,
  prevStep,
  className = '',
  activeFrameName,
  frameAction,
}: JavaReferenceViewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<ArrowInfo[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleHoverStart = useCallback((id: string) => setHoveredId(id), []);
  const handleHoverEnd = useCallback(() => setHoveredId(null), []);

  // Variable lookup
  const variableMap = useMemo(() => {
    const map = new Map<string, FlowVariable>();
    step.variables.forEach((v) => map.set(v.id, v));
    return map;
  }, [step.variables]);

  const stackFrames = useMemo<StackFrameGroup[]>(() => {
    const frameDefs = step.frames.filter((f) => {
      const n = f.name.toLowerCase();
      return n !== 'heap' && n !== 'string pool';
    });

    if (frameDefs.length > 0) {
      return frameDefs.map((frame) => ({
        name: frame.name,
        variables: frame.variableIds
          .map((id) => variableMap.get(id))
          .filter((v): v is FlowVariable => !!v && v.scope !== 'heap' && v.scope !== 'stringPool'),
      }));
    }

    return [
      {
        name: 'main',
        variables: step.variables.filter((v) => v.scope === 'main'),
      },
    ];
  }, [step.frames, step.variables, variableMap]);

  const stackVariables = useMemo(
    () => stackFrames.flatMap((f) => f.variables),
    [stackFrames]
  );

  // Heap objects (참조되지 않는 orphan 제거)
  const referencedIds = useMemo(() => {
    const set = new Set<string>();
    step.variables.forEach((v) => { if (v.pointsTo) set.add(v.pointsTo); });
    return set;
  }, [step.variables]);

  const heapObjects = useMemo(
    () => step.variables.filter((v) => v.scope === 'heap' && referencedIds.has(v.id)),
    [step.variables, referencedIds]
  );

  // String Pool objects
  const stringPoolObjects = useMemo(
    () => step.variables.filter((v) => v.scope === 'stringPool'),
    [step.variables]
  );

  // All heap-side objects (heap + stringPool)
  const allHeapObjects = useMemo(
    () => [...stringPoolObjects, ...heapObjects],
    [heapObjects, stringPoolObjects]
  );

  // Ref count per heap object
  const nameCountMap = useMemo(() => {
    const map = new Map<string, number>();
    step.variables.forEach((v) => {
      if (v.pointsTo) map.set(v.pointsTo, (map.get(v.pointsTo) ?? 0) + 1);
    });
    return map;
  }, [step.variables]);

  // Connection map
  const connectionMap = useMemo(() => {
    const map = new Map<string, string[]>();
    step.variables.forEach((v) => {
      if (v.pointsTo) {
        const arr = map.get(v.pointsTo) ?? [];
        arr.push(v.id);
        map.set(v.pointsTo, arr);
      }
    });
    return map;
  }, [step.variables]);

  // Highlighted IDs
  const highlightedIds = useMemo((): Set<string> => {
    if (!hoveredId) return new Set();
    const set = new Set<string>([hoveredId]);
    const hv = variableMap.get(hoveredId);
    if (hv?.pointsTo) set.add(hv.pointsTo);
    (connectionMap.get(hoveredId) ?? []).forEach((id) => set.add(id));
    return set;
  }, [hoveredId, variableMap, connectionMap]);

  // Order heap objects by stack reference order
  const orderedHeapObjects = useMemo(() => {
    const placed = new Set<string>();
    const ordered: FlowVariable[] = [];

    for (const v of stackVariables) {
      if (v.pointsTo) {
        const obj = allHeapObjects.find((h) => h.id === v.pointsTo);
        if (obj && !placed.has(obj.id)) {
          ordered.push(obj);
          placed.add(obj.id);
        }
      }
    }
    for (const h of allHeapObjects) {
      if (!placed.has(h.id)) ordered.push(h);
    }
    return ordered;
  }, [stackVariables, allHeapObjects]);

  // Arrow pairs
  const arrowPairs = useMemo(
    () =>
      step.variables
        .filter((v) => v.isPointer && v.pointsTo)
        .map((v) => ({ fromId: v.id, toId: v.pointsTo! })),
    [step.variables]
  );

  // Measure DOM positions → arrow coordinates
  useEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newArrows: ArrowInfo[] = [];

      for (const { fromId, toId } of arrowPairs) {
        const fromEl = containerRef.current.querySelector(`[data-var-id="${fromId}"]`);
        const toEl = containerRef.current.querySelector(`[data-variable-id="${toId}"]`);
        if (!fromEl || !toEl) continue;

        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();
        newArrows.push({
          id: `${fromId}->${toId}`,
          fromId,
          toId,
          sx: fr.right - containerRect.left,
          sy: fr.top + fr.height / 2 - containerRect.top,
          tx: tr.left - containerRect.left,
          ty: tr.top + tr.height / 2 - containerRect.top,
          isShared: (nameCountMap.get(toId) ?? 0) > 1,
        });
      }

      setArrows(newArrows);
    };

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setTimeout(measure, 150);
      })
    );

    return () => { cancelled = true; };
  }, [arrowPairs, nameCountMap]);

  // Previous step diff
  const prevObjectIds = useMemo(
    () => new Set(prevStep?.variables.map((v) => v.id) ?? []),
    [prevStep]
  );
  const prevObjectValues = useMemo(
    () => new Map(prevStep?.variables.map((v) => [v.id, v.value]) ?? []),
    [prevStep]
  );

  const anyHovered = hoveredId !== null;
  const hasAnyMemoryData = stackVariables.length > 0 || orderedHeapObjects.length > 0;
  const normalizedActive = activeFrameName?.replace(/\(\)$/, '').split('.').pop()?.trim().toLowerCase();

  if (!hasAnyMemoryData) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="flex items-center justify-center p-6 min-h-[160px]">
          <div className="max-w-lg rounded-xl border px-4 py-4 text-center bg-blue-50 border-blue-200">
            <div className="space-y-3 text-left">
              <div>
                <p className="text-sm font-semibold text-blue-900">{t('visualizer.java_compile_time_empty_title')}</p>
                <p className="mt-1 text-sm text-blue-800">
                  {t('visualizer.java_compile_time_empty_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-6 p-4 min-h-[120px]">
        {/* Stack Column (2/5 width) */}
        <div className="w-2/5 flex-shrink-0 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stack</div>

          {[...stackFrames].reverse().map((frame, idx) => (
            (() => {
              const frameNorm = frame.name.replace(/\(\)$/, '').split('.').pop()?.trim().toLowerCase();
              const isActiveFrame = !!normalizedActive && frameNorm === normalizedActive;
              return (
            <motion.div
              key={`${frame.name}-${idx}`}
              layout
              className="rounded-xl border-2 overflow-hidden shadow-sm"
              style={{
                backgroundColor: isActiveFrame ? '#fefce8' : FRAME_COLORS.main.bg,
                borderColor: isActiveFrame ? '#f59e0b' : FRAME_COLORS.main.border,
                boxShadow: isActiveFrame ? '0 0 0 2px #f59e0b33, 0 4px 14px rgba(0,0,0,0.08)' : undefined,
              }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ backgroundColor: isActiveFrame ? '#fef3c7' : FRAME_COLORS.main.header }}
              >
                <span className="text-sm">☕</span>
                <span className="font-mono text-sm font-semibold" style={{ color: FRAME_COLORS.main.headerText }}>
                  {frame.name}
                </span>
                {isActiveFrame && frameAction && (
                  <span
                    className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{ background: '#f59e0b', color: 'white' }}
                  >
                    {frameAction}
                  </span>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 min-h-[40px]">
                {frame.variables.length === 0 ? (
                  <span className="text-sm text-gray-400 italic">empty</span>
                ) : (
                  frame.variables.map((v) => (
                    <StackVariable
                      key={v.id}
                      variable={v}
                      isHighlighted={highlightedIds.has(v.id)}
                      onHoverStart={handleHoverStart}
                      onHoverEnd={handleHoverEnd}
                    />
                  ))
                )}
              </div>
            </motion.div>
              );
            })()
          ))}
        </div>

        {/* Heap + String Pool Column */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Heap</div>

          {/* String Pool section */}
          {stringPoolObjects.length > 0 && (
            <div className="mb-2">
              <div className="text-[11px] font-semibold text-cyan-700 mb-2 flex items-center gap-1">
                <span>🏊</span> String Pool
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5 pt-1 pb-3">
            <AnimatePresence mode="popLayout">
              {orderedHeapObjects.map((obj) => (
                <HeapCard
                  key={obj.id}
                  object={obj}
                  nameCount={nameCountMap.get(obj.id) ?? 0}
                  isNew={!prevObjectIds.has(obj.id)}
                  isUpdated={prevObjectIds.has(obj.id) && prevObjectValues.get(obj.id) !== obj.value}
                  isHighlighted={highlightedIds.has(obj.id)}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                />
              ))}
            </AnimatePresence>
          </div>
          {orderedHeapObjects.length === 0 && (
            <span className="text-sm text-gray-400 italic">No objects</span>
          )}
        </div>
      </div>

      {/* SVG Arrow Overlay */}
      {arrows.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 5, overflow: 'visible' }}
        >
          <defs>
            <marker id="java-arr-def" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#60a5fa" />
            </marker>
            <marker id="java-arr-shr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
            </marker>
            <marker id="java-arr-hi" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L9,3.5 z" fill="#f59e0b" />
            </marker>
          </defs>

          {arrows.map(({ id, fromId, toId, sx, sy, tx, ty, isShared }) => {
            const span = Math.max(40, Math.abs(tx - sx) * 0.45);
            const d = `M ${sx} ${sy} C ${sx + span} ${sy} ${tx - span} ${ty} ${tx} ${ty}`;

            const isActive = anyHovered && (highlightedIds.has(fromId) || highlightedIds.has(toId));
            const opacity = anyHovered ? (isActive ? 1 : 0.07) : 0.75;
            const strokeWidth = isActive ? 2.5 : 1.5;
            const stroke = isActive ? '#f59e0b' : isShared ? '#a78bfa' : '#60a5fa';
            const markerId = isActive ? 'java-arr-hi' : isShared ? 'java-arr-shr' : 'java-arr-def';

            return (
              <path
                key={id}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                markerEnd={`url(#${markerId})`}
                opacity={opacity}
                style={{ transition: 'opacity 0.12s ease, stroke-width 0.12s ease' }}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
});

export default JavaReferenceView;
