/**
 * PythonReferenceView - Python Tutor 스타일 참조 시각화
 *
 * 2분할 레이아웃:
 * - 왼쪽 (Stack): 프레임 + 변수 (원시값은 인라인, 참조는 → 아이콘)
 * - 오른쪽 (Objects): 힙 객체 카드 — 스택 참조 순서대로 단일 컬럼 배치
 * - SVG 오버레이: 베지어 곡선 화살표
 *
 * 호버 동작:
 * - → 아이콘 or 힙 카드 호버 → 연결된 화살표 + 상대 요소 하이라이트
 * - 무관한 화살표는 fade out
 */

import { memo, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowStep, FlowVariable } from '@codeinsight/shared';

// ============================================
// 상수
// ============================================

/** 스택에 값을 인라인으로 표시하는 타입 (힙 카드/화살표 없음) */
const INLINE_TYPES = new Set(['int', 'float', 'str', 'bool', 'NoneType', 'bytes', 'complex']);

/** Mutable Python types */
const MUTABLE_TYPES = new Set(['list', 'dict', 'set', 'object', 'instance', 'bytearray']);

/** Python 타입별 색상 */
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  int:      { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  float:    { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  str:      { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  bool:     { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  NoneType: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
  bytes:    { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  complex:  { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  list:     { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
  tuple:    { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  dict:     { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
  set:      { bg: '#fae8ff', border: '#c084fc', text: '#6b21a8' },
  function: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  class:    { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  instance: { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
  default:  { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
};

/** Python 타입별 이모지 */
const TYPE_EMOJI: Record<string, string> = {
  int: '🔢', float: '🔢', str: '📝', bool: '✓', NoneType: '∅',
  bytes: '📝', complex: '🔢',
  list: '📋', tuple: '📦', dict: '🗂️', set: '🎯',
  function: '⚙️', class: '🏛️', instance: '🧩',
};

const FRAME_COLORS = {
  global:   { bg: '#f8fafc', border: '#cbd5e1', header: '#e2e8f0', headerText: '#475569' },
  function: { bg: '#eff6ff', border: '#60a5fa', header: '#dbeafe', headerText: '#1d4ed8' },
};

function getTypeColor(type: string): { bg: string; border: string; text: string } {
  return TYPE_COLORS[type] ?? TYPE_COLORS.default;
}

function getTypeEmoji(type: string): string {
  return TYPE_EMOJI[type] ?? '📦';
}

function isGlobalFrame(name: string): boolean {
  return name === 'global' || name === '__main__' || name === 'main';
}

// ============================================
// 타입 정의
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

interface StackFrameData {
  name: string;
  variables: FlowVariable[];
}

interface PythonReferenceViewProps {
  step: FlowStep;
  prevStep?: FlowStep | null;
  className?: string;
}

// ============================================
// HeapCard 컴포넌트
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
  const isMutable =
    meta?.mutable === true ||
    (meta?.mutable === undefined && MUTABLE_TYPES.has(object.type));
  const hideBadge =
    object.type === 'function' || object.type === 'class' || object.type === 'NoneType';
  const displayValue = String(object.value ?? 'None');

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
        borderColor: isHighlighted ? '#fbbf24' : isShared ? '#a78bfa' : colors.border,
        boxShadow: isHighlighted
          ? '0 0 0 3px #fbbf2466, 0 4px 12px rgba(0,0,0,0.12)'
          : isShared
          ? '0 0 0 2px #a78bfa40'
          : '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.15s, border-color 0.15s, background-color 0.15s',
      }}
    >
      {/* Mutability badge */}
      {!hideBadge && (
        <span
          className="absolute -top-2 -right-2 text-xs z-20"
          title={isMutable ? 'Mutable' : 'Immutable'}
        >
          {isMutable ? '✏️' : '🔒'}
        </span>
      )}

      {/* Value display */}
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

      {/* Ref count badge */}
      {nameCount > 0 && (
        <span
          className="absolute -bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{
            background: isShared ? '#ede9fe' : '#dbeafe',
            color: isShared ? '#6d28d9' : '#1e40af',
            border: `1px solid ${isShared ? '#a78bfa' : '#60a5fa'}`,
          }}
        >
          refs: {nameCount}
        </span>
      )}
    </motion.div>
  );
});

// ============================================
// StackVariable 컴포넌트
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
  const isInline = INLINE_TYPES.has(variable.type);
  const typeColor = getTypeColor(variable.type);

  return (
    <div className="flex items-center gap-2 min-h-[28px]">
      {/* Variable name */}
      <span
        className="font-mono text-sm font-semibold text-slate-700 truncate"
        style={{ minWidth: '56px', maxWidth: '100px' }}
      >
        {variable.name}
      </span>

      {/* Inline value (primitives) or → reference indicator */}
      {isInline ? (
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
      ) : (
        <span
          data-var-id={variable.id}
          onMouseEnter={() => onHoverStart(variable.id)}
          onMouseLeave={onHoverEnd}
          className="px-2 py-0.5 rounded text-xs font-mono font-semibold cursor-pointer"
          style={{
            backgroundColor: isHighlighted ? '#fef08a' : '#e0e7ff',
            color: isHighlighted ? '#b45309' : '#4338ca',
            border: `1px solid ${isHighlighted ? '#fbbf24' : '#818cf8'}`,
            boxShadow: isHighlighted ? '0 0 0 2px #fbbf2466' : undefined,
            transition: 'background-color 0.15s, border-color 0.15s, box-shadow 0.15s',
          }}
        >
          →
        </span>
      )}
    </div>
  );
});

// ============================================
// StackFrame 컴포넌트
// ============================================

interface StackFrameProps {
  frame: StackFrameData;
  isActive: boolean;
  highlightedIds: Set<string>;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}

const StackFrame = memo(function StackFrame({
  frame, isActive, highlightedIds, onHoverStart, onHoverEnd,
}: StackFrameProps) {
  const isGlobal = isGlobalFrame(frame.name);
  const colors = isGlobal ? FRAME_COLORS.global : FRAME_COLORS.function;
  const displayName = isGlobal ? 'global' : `${frame.name}()`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`rounded-xl border-2 overflow-hidden ${
        isActive ? 'ring-2 ring-blue-300 shadow-md' : 'shadow-sm'
      }`}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ backgroundColor: colors.header }}
      >
        <span className="text-sm">{isGlobal ? '🐍' : '→'}</span>
        <span className="font-mono text-sm font-semibold" style={{ color: colors.headerText }}>
          {displayName}
        </span>
        {isActive && !isGlobal && (
          <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-md bg-blue-500 text-white font-medium">
            RUNNING
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
              onHoverStart={onHoverStart}
              onHoverEnd={onHoverEnd}
            />
          ))
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// PythonReferenceView 메인 컴포넌트
// ============================================

export const PythonReferenceView = memo(function PythonReferenceView({
  step,
  prevStep,
  className = '',
}: PythonReferenceViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<ArrowInfo[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleHoverStart = useCallback((id: string) => setHoveredId(id), []);
  const handleHoverEnd = useCallback(() => setHoveredId(null), []);

  // Variable lookup map
  const variableMap = useMemo(() => {
    const map = new Map<string, FlowVariable>();
    step.variables.forEach((v) => map.set(v.id, v));
    return map;
  }, [step.variables]);

  // Stack frames (excluding objects/heap pseudo-frames)
  const stackFrames = useMemo<StackFrameData[]>(
    () =>
      (step.frames ?? [])
        .filter((f) => f.name !== 'objects' && f.name !== 'heap' && f.name !== 'Objects (Heap)')
        .map((f) => ({
          name: f.name,
          variables: f.variableIds
            .map((id) => variableMap.get(id))
            .filter((v): v is FlowVariable => v !== undefined),
        })),
    [step.frames, variableMap]
  );

  // Heap objects (non-primitive only)
  const heapObjects = useMemo(
    () => step.variables.filter((v) => v.scope === 'objects' && !INLINE_TYPES.has(v.type)),
    [step.variables]
  );

  // Reference count per heap object
  const nameCountMap = useMemo(() => {
    const map = new Map<string, number>();
    step.variables.forEach((v) => {
      if (v.pointsTo) map.set(v.pointsTo, (map.get(v.pointsTo) ?? 0) + 1);
    });
    return map;
  }, [step.variables]);

  // Connection map: heapObjId → [varIds that point to it]
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

  // Highlighted IDs: hovered element + all connected elements
  const highlightedIds = useMemo((): Set<string> => {
    if (!hoveredId) return new Set();
    const set = new Set<string>([hoveredId]);
    // If hovering a stack var → also highlight the heap obj it points to
    const hv = variableMap.get(hoveredId);
    if (hv?.pointsTo) set.add(hv.pointsTo);
    // If hovering a heap obj → also highlight all vars pointing to it
    (connectionMap.get(hoveredId) ?? []).forEach((id) => set.add(id));
    return set;
  }, [hoveredId, variableMap, connectionMap]);

  // Heap objects ordered by stack reference order (top frame first)
  // → minimises arrow crossing, makes arrows roughly horizontal
  const orderedHeapObjects = useMemo(() => {
    const placed = new Set<string>();
    const ordered: FlowVariable[] = [];

    const displayOrder = stackFrames.slice().reverse(); // most recent frame first
    for (const frame of displayOrder) {
      for (const v of frame.variables) {
        if (v.pointsTo && !INLINE_TYPES.has(v.type)) {
          const obj = heapObjects.find((h) => h.id === v.pointsTo);
          if (obj && !placed.has(obj.id)) {
            ordered.push(obj);
            placed.add(obj.id);
          }
        }
      }
    }
    // Orphaned heap objects (not directly referenced from any frame)
    for (const h of heapObjects) {
      if (!placed.has(h.id)) ordered.push(h);
    }
    return ordered;
  }, [stackFrames, heapObjects]);

  // Arrow pairs: only non-inline reference variables
  const arrowPairs = useMemo(
    () =>
      step.variables
        .filter((v) => v.isPointer && v.pointsTo && !INLINE_TYPES.has(v.type))
        .map((v) => ({ fromId: v.id, toId: v.pointsTo! })),
    [step.variables]
  );

  // Measure DOM positions and compute arrow coordinates
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

  // Active frame = last non-global frame
  const activeFrameName = useMemo(() => {
    const nonGlobal = stackFrames.filter((f) => !isGlobalFrame(f.name));
    return nonGlobal.length > 0 ? nonGlobal[nonGlobal.length - 1].name : null;
  }, [stackFrames]);

  const anyHovered = hoveredId !== null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-6 p-4 min-h-[120px]">
        {/* Stack Column (2/5 width) */}
        <div className="w-2/5 flex-shrink-0 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Stack</div>
          <AnimatePresence mode="popLayout">
            {stackFrames
              .slice()
              .reverse()
              .map((frame) => (
                <StackFrame
                  key={frame.name}
                  frame={frame}
                  isActive={frame.name === activeFrameName}
                  highlightedIds={highlightedIds}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                />
              ))}
          </AnimatePresence>
          {stackFrames.length === 0 && (
            <span className="text-sm text-gray-400 italic">No frames</span>
          )}
        </div>

        {/* Objects Column — single column, ordered to align with stack */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Objects</div>
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
            <marker id="py-arr-def" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
            <marker id="py-arr-shr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
            </marker>
            <marker id="py-arr-hi" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L9,3.5 z" fill="#f59e0b" />
            </marker>
          </defs>

          {arrows.map(({ id, fromId, toId, sx, sy, tx, ty, isShared }) => {
            const span = Math.max(40, Math.abs(tx - sx) * 0.45);
            const d = `M ${sx} ${sy} C ${sx + span} ${sy} ${tx - span} ${ty} ${tx} ${ty}`;

            const isActive = anyHovered && (highlightedIds.has(fromId) || highlightedIds.has(toId));
            const opacity = anyHovered ? (isActive ? 1 : 0.07) : 0.75;
            const strokeWidth = isActive ? 2.5 : 1.5;
            const stroke = isActive ? '#f59e0b' : isShared ? '#a78bfa' : '#94a3b8';
            const markerId = isActive ? 'py-arr-hi' : isShared ? 'py-arr-shr' : 'py-arr-def';

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

export default PythonReferenceView;
