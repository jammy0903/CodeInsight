/**
 * PythonReferenceView - Python Tutor 스타일 참조 시각화
 *
 * 2분할 레이아웃:
 * - 왼쪽 (Stack): 프레임 + 변수 (원시값은 인라인, 참조는 → 아이콘)
 * - 오른쪽 (Objects): 힙 객체 카드
 * - SVG 오버레이: 베지어 곡선 화살표로 참조 관계 표시
 *
 * 원시값(int, float, str, bool 등)은 스택에 인라인 표시.
 * 참조 타입(list, dict, set, tuple, instance...)은 → 아이콘 + 화살표.
 */

import { memo, useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowStep, FlowVariable } from '@codeinsight/shared';

// ============================================
// 상수
// ============================================

/** 스택에 값을 인라인으로 표시하는 타입 (힙 카드 없음, 화살표 없음) */
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

/** 프레임 헤더 색상 */
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
}

const HeapCard = memo(function HeapCard({ object, nameCount, isNew, isUpdated }: HeapCardProps) {
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
      className="relative px-3.5 py-2.5 rounded-xl border-2 shadow-sm cursor-default select-none"
      style={{
        backgroundColor: colors.bg,
        borderColor: isShared ? '#a78bfa' : colors.border,
        boxShadow: isShared ? '0 0 0 2px #a78bfa40' : undefined,
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

const StackVariable = memo(function StackVariable({ variable }: { variable: FlowVariable }) {
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

      {/* Inline value or reference → indicator */}
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
          className="px-2 py-0.5 rounded text-xs font-mono font-semibold"
          style={{
            backgroundColor: '#e0e7ff',
            color: '#4338ca',
            border: '1px solid #818cf8',
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

const StackFrame = memo(function StackFrame({
  frame,
  isActive,
}: {
  frame: StackFrameData;
  isActive: boolean;
}) {
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
      {/* Frame header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ backgroundColor: colors.header }}
      >
        <span className="text-sm">{isGlobal ? '🐍' : '→'}</span>
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: colors.headerText }}
        >
          {displayName}
        </span>
        {isActive && !isGlobal && (
          <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-md bg-blue-500 text-white font-medium">
            RUNNING
          </span>
        )}
      </div>

      {/* Variables */}
      <div className="p-3 flex flex-col gap-2 min-h-[40px]">
        {frame.variables.length === 0 ? (
          <span className="text-sm text-gray-400 italic">empty</span>
        ) : (
          frame.variables.map((v) => <StackVariable key={v.id} variable={v} />)
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
        .filter(
          (f) =>
            f.name !== 'objects' &&
            f.name !== 'heap' &&
            f.name !== 'Objects (Heap)'
        )
        .map((f) => ({
          name: f.name,
          variables: f.variableIds
            .map((id) => variableMap.get(id))
            .filter((v): v is FlowVariable => v !== undefined),
        })),
    [step.frames, variableMap]
  );

  // Heap objects (non-primitive only — primitives shown inline in stack)
  const heapObjects = useMemo(
    () =>
      step.variables.filter(
        (v) => v.scope === 'objects' && !INLINE_TYPES.has(v.type)
      ),
    [step.variables]
  );

  // Reference count per heap object (for shared detection)
  const nameCountMap = useMemo(() => {
    const map = new Map<string, number>();
    step.variables.forEach((v) => {
      if (v.pointsTo) {
        map.set(v.pointsTo, (map.get(v.pointsTo) ?? 0) + 1);
      }
    });
    return map;
  }, [step.variables]);

  // Arrow pairs: only non-inline reference variables get arrows
  const arrowPairs = useMemo(
    () =>
      step.variables
        .filter((v) => v.isPointer && v.pointsTo && !INLINE_TYPES.has(v.type))
        .map((v) => ({ fromId: v.id, toId: v.pointsTo! })),
    [step.variables]
  );

  // Measure DOM positions and compute arrow coordinates
  // Double rAF + 150ms to wait for Framer Motion layout animations to settle
  useEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newArrows: ArrowInfo[] = [];

      for (const { fromId, toId } of arrowPairs) {
        const fromEl = containerRef.current.querySelector(
          `[data-var-id="${fromId}"]`
        );
        const toEl = containerRef.current.querySelector(
          `[data-variable-id="${toId}"]`
        );
        if (!fromEl || !toEl) continue;

        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();
        newArrows.push({
          id: `${fromId}->${toId}`,
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

    return () => {
      cancelled = true;
    };
  }, [arrowPairs, nameCountMap]);

  // Previous step data for diff animations
  const prevObjectIds = useMemo(
    () => new Set(prevStep?.variables.map((v) => v.id) ?? []),
    [prevStep]
  );
  const prevObjectValues = useMemo(
    () => new Map(prevStep?.variables.map((v) => [v.id, v.value]) ?? []),
    [prevStep]
  );

  // Active frame = last non-global frame (most recent call)
  const activeFrameName = useMemo(() => {
    const nonGlobal = stackFrames.filter((f) => !isGlobalFrame(f.name));
    return nonGlobal.length > 0 ? nonGlobal[nonGlobal.length - 1].name : null;
  }, [stackFrames]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-6 p-4 min-h-[120px]">
        {/* Stack Column (2/5 width) */}
        <div className="w-2/5 flex-shrink-0 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Stack
          </div>
          <AnimatePresence mode="popLayout">
            {stackFrames
              .slice()
              .reverse()
              .map((frame) => (
                <StackFrame
                  key={frame.name}
                  frame={frame}
                  isActive={frame.name === activeFrameName}
                />
              ))}
          </AnimatePresence>
          {stackFrames.length === 0 && (
            <span className="text-sm text-gray-400 italic">No frames</span>
          )}
        </div>

        {/* Objects Column (remaining width) */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Objects
          </div>
          <div className="flex flex-wrap gap-5 pt-1">
            <AnimatePresence mode="popLayout">
              {heapObjects.map((obj) => (
                <HeapCard
                  key={obj.id}
                  object={obj}
                  nameCount={nameCountMap.get(obj.id) ?? 0}
                  isNew={!prevObjectIds.has(obj.id)}
                  isUpdated={
                    prevObjectIds.has(obj.id) &&
                    prevObjectValues.get(obj.id) !== obj.value
                  }
                />
              ))}
            </AnimatePresence>
          </div>
          {heapObjects.length === 0 && (
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
            <marker
              id="py-arrow-default"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
            </marker>
            <marker
              id="py-arrow-shared"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
            </marker>
          </defs>
          {arrows.map(({ id, sx, sy, tx, ty, isShared }) => {
            const span = Math.max(40, (tx - sx) * 0.45);
            const d = `M ${sx} ${sy} C ${sx + span} ${sy} ${tx - span} ${ty} ${tx} ${ty}`;
            const stroke = isShared ? '#a78bfa' : '#94a3b8';
            const markerId = isShared ? 'py-arrow-shared' : 'py-arrow-default';
            return (
              <path
                key={id}
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={1.5}
                markerEnd={`url(#${markerId})`}
                opacity={0.85}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
});

export default PythonReferenceView;
