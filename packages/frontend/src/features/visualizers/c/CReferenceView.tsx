/**
 * CReferenceView — C 참조 시각화 (Python Tutor 스타일)
 *
 * 2분할 레이아웃:
 * - 왼쪽 (Stack): 프레임별 변수 (원시값 인라인, 포인터는 화살표)
 * - 오른쪽 (Heap): 동적 할당 객체 카드
 * - SVG 오버레이: 베지어 곡선 화살표
 *
 * C 고유:
 * - 스택→스택 포인터 화살표 (swap(&x, &y) 등)
 * - 포인터 변수에 타깃명 인라인 표시 (a → x)
 * - struct 멤버, char 배열, dangling 포인터
 */

import { memo, useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowStep, FlowVariable } from '@codeinsight/shared';

// ============================================
// 상수
// ============================================

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  int:     { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  long:    { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  short:   { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  float:   { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  double:  { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  char:    { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  struct:  { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  pointer: { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
  default: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
};

const FRAME_COLORS = {
  global:   { bg: '#f8fafc', border: '#cbd5e1', header: '#e2e8f0', headerText: '#475569' },
  function: { bg: '#f0fdf4', border: '#86efac', header: '#dcfce7', headerText: '#166534' },
};

function getTypeColor(type: string) {
  if (type.includes('*')) return TYPE_COLORS.pointer;
  if (type.startsWith('struct')) return TYPE_COLORS.struct;
  return TYPE_COLORS[type] ?? TYPE_COLORS.default;
}

// ============================================
// 타입
// ============================================

interface ArrowInfo {
  id: string;
  fromId: string;
  toId: string;
  sx: number; sy: number;
  tx: number; ty: number;
  isShared: boolean;
  isSameColumn: boolean;
}

interface StackFrameData {
  name: string;
  variables: FlowVariable[];
}

// ============================================
// StackVariable
// ============================================

const StackVariable = memo(function StackVariable({
  variable, isHighlighted, isInteractive, pointsToName,
  onHoverStart, onHoverEnd,
}: {
  variable: FlowVariable;
  isHighlighted: boolean;
  isInteractive: boolean;
  pointsToName?: string;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}) {
  const isPtr = variable.isPointer;
  const typeColor = getTypeColor(variable.type);
  const meta = variable.metadata as Record<string, unknown> | undefined;
  const isDangling = meta?.dangling === true;
  const structMembers = meta?.structMembers as Array<{ key: string; value: string }> | undefined;
  const charElements = meta?.charElements as Array<{ value: string; highlight?: boolean }> | undefined;

  return (
    <div
      className="rounded-md px-2 py-1 -mx-1"
      data-var-id={isPtr ? variable.id : undefined}
      data-variable-id={variable.id}
      onMouseEnter={isInteractive ? () => onHoverStart(variable.id) : undefined}
      onMouseLeave={isInteractive ? onHoverEnd : undefined}
      style={{
        cursor: isInteractive ? 'pointer' : undefined,
        backgroundColor: isHighlighted ? '#fef9c3' : undefined,
        transition: 'background-color 0.15s',
      }}
    >
      <div className="flex items-center gap-2 min-h-[26px]">
        {/* 변수명 */}
        <span
          className="font-mono text-[13px] font-bold shrink-0"
          style={{ color: isDangling ? '#dc2626' : '#0f172a', minWidth: 32 }}
        >
          {variable.name}
        </span>

        {/* 타입 */}
        <span className="text-[10px] text-slate-400 font-mono shrink-0">
          {variable.type}
        </span>

        {/* 포인터: 주소 값 + 타깃 변수명 표시 */}
        {isPtr && !isDangling && (
          <span
            className="px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold"
            style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}
          >
            {String(variable.value)}{pointsToName ? ` (\u2192${pointsToName})` : ''}
          </span>
        )}

        {/* 포인터: dangling */}
        {isPtr && isDangling && (
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
            style={{ backgroundColor: '#fecaca', color: '#991b1b' }}
          >
            dangling
          </span>
        )}

        {/* 비포인터: 값 */}
        {!isPtr && (
          <span
            className="px-2 py-0.5 rounded text-[12px] font-mono font-bold"
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

      {/* struct 멤버 */}
      {structMembers && structMembers.length > 0 && (
        <div className="ml-8 mt-1 flex flex-wrap gap-1">
          {structMembers.map((m) => (
            <span
              key={m.key}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${typeColor.border}18`, color: typeColor.text }}
            >
              .{m.key} = {m.value}
            </span>
          ))}
        </div>
      )}

      {/* char 배열 */}
      {charElements && charElements.length > 0 && (
        <div className="ml-8 mt-1 flex flex-wrap gap-0.5">
          {charElements.map((el, i) => (
            <span
              key={i}
              className="text-[11px] font-mono font-bold px-1 py-0.5 rounded border"
              style={{
                backgroundColor: el.highlight ? '#fef08a' : '#f8fafc',
                borderColor: el.highlight ? '#eab308' : '#e2e8f0',
                color: '#1e293b',
              }}
            >
              {el.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

// ============================================
// StackFrame
// ============================================

const StackFrame = memo(function StackFrame({
  frame, isActive, highlightedIds, interactiveIds, targetNameMap,
  onHoverStart, onHoverEnd,
}: {
  frame: StackFrameData;
  isActive: boolean;
  highlightedIds: Set<string>;
  interactiveIds: Set<string>;
  targetNameMap: Map<string, string>;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}) {
  const isGlobal = frame.name === 'global';
  const colors = isGlobal ? FRAME_COLORS.global : FRAME_COLORS.function;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`rounded-xl border-2 overflow-hidden ${isActive ? 'ring-2 ring-green-300 shadow-md' : 'shadow-sm'}`}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ backgroundColor: colors.header }}>
        <span className="font-mono text-[13px] font-bold" style={{ color: colors.headerText }}>
          {isGlobal ? 'global' : `${frame.name}()`}
        </span>
        {isActive && !isGlobal && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white font-bold">
            RUNNING
          </span>
        )}
      </div>

      {/* 변수들 */}
      <div className="px-2 py-2 flex flex-col gap-1 min-h-[32px]">
        {frame.variables.length === 0 ? (
          <span className="text-[12px] text-gray-400 italic px-2">empty</span>
        ) : (
          frame.variables.map((v) => (
            <StackVariable
              key={v.id}
              variable={v}
              isHighlighted={highlightedIds.has(v.id)}
              isInteractive={interactiveIds.has(v.id)}
              pointsToName={targetNameMap.get(v.id)}
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
// HeapCard
// ============================================

const HeapCard = memo(function HeapCard({
  object, nameCount, isNew, isUpdated, isHighlighted,
  onHoverStart, onHoverEnd,
}: {
  object: FlowVariable;
  nameCount: number;
  isNew: boolean;
  isUpdated: boolean;
  isHighlighted: boolean;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}) {
  const colors = getTypeColor(object.type);
  const isShared = nameCount > 1;
  const meta = object.metadata as Record<string, unknown> | undefined;
  const isDangling = meta?.dangling === true;
  const displayValue = String(object.value ?? '???');
  const structMembers = meta?.structMembers as Array<{ key: string; value: string }> | undefined;
  const charElements = meta?.charElements as Array<{ value: string; highlight?: boolean }> | undefined;

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: isDangling ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      data-variable-id={object.id}
      onMouseEnter={() => onHoverStart(object.id)}
      onMouseLeave={onHoverEnd}
      className="relative px-3 py-2 rounded-xl border-2 cursor-pointer select-none"
      style={{
        backgroundColor: isHighlighted ? '#fefce8' : isDangling ? '#fef2f2' : colors.bg,
        borderColor: isDangling ? '#ef4444' : isHighlighted ? '#fbbf24' : isShared ? '#a78bfa' : colors.border,
        borderStyle: isDangling ? 'dashed' : 'solid',
        boxShadow: isHighlighted
          ? '0 0 0 3px #fbbf2466'
          : isShared ? '0 0 0 2px #a78bfa40' : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {isDangling && (
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] font-bold z-20"
          style={{ background: '#fecaca', color: '#991b1b', border: '1px solid #ef4444' }}>
          dangling
        </span>
      )}

      <div className="flex items-center gap-2">
        <motion.span
          key={displayValue}
          initial={isUpdated ? { color: '#2563eb', scale: 1.05 } : false}
          animate={{ color: colors.text, scale: 1 }}
          className="font-mono font-bold text-[13px]"
        >
          {displayValue}
        </motion.span>
        <span className="text-[10px] text-slate-400 font-mono">{object.type}</span>
      </div>

      {object.address && (
        <div className="text-[9px] font-mono text-slate-400 mt-0.5">{object.address}</div>
      )}

      {structMembers && structMembers.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {structMembers.map((m) => (
            <span key={m.key} className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${colors.border}18`, color: colors.text }}>
              .{m.key} = {m.value}
            </span>
          ))}
        </div>
      )}

      {charElements && charElements.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-0.5">
          {charElements.map((el, i) => (
            <span key={i} className="text-[11px] font-mono font-bold px-1 py-0.5 rounded border"
              style={{
                backgroundColor: el.highlight ? '#fef08a' : '#f8fafc',
                borderColor: el.highlight ? '#eab308' : '#e2e8f0',
              }}>
              {el.value}
            </span>
          ))}
        </div>
      )}

      {nameCount > 0 && (
        <span className="absolute -bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{
            background: isShared ? '#ede9fe' : '#dcfce7',
            color: isShared ? '#6d28d9' : '#166534',
            border: `1px solid ${isShared ? '#a78bfa' : '#86efac'}`,
          }}>
          refs: {nameCount}
        </span>
      )}
    </motion.div>
  );
});

// ============================================
// CReferenceView 메인
// ============================================

export const CReferenceView = memo(function CReferenceView({
  step, prevStep, className = '',
}: {
  step: FlowStep;
  prevStep?: FlowStep | null;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<ArrowInfo[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleHoverStart = useCallback((id: string) => setHoveredId(id), []);
  const handleHoverEnd = useCallback(() => setHoveredId(null), []);

  const variableMap = useMemo(() => {
    const map = new Map<string, FlowVariable>();
    step.variables.forEach((v) => map.set(v.id, v));
    return map;
  }, [step.variables]);

  // 스택 프레임 (heap 제외)
  const stackFrames = useMemo<StackFrameData[]>(
    () => (step.frames ?? [])
      .filter((f) => f.name !== 'heap')
      .map((f) => ({
        name: f.name,
        variables: f.variableIds
          .map((id) => variableMap.get(id))
          .filter((v): v is FlowVariable => v !== undefined),
      })),
    [step.frames, variableMap]
  );

  const heapObjects = useMemo(
    () => step.variables.filter((v) => v.scope === 'heap'),
    [step.variables]
  );

  const heapIdSet = useMemo(
    () => new Set(heapObjects.map((h) => h.id)),
    [heapObjects]
  );

  // 참조 카운트
  const nameCountMap = useMemo(() => {
    const map = new Map<string, number>();
    step.variables.forEach((v) => {
      if (v.pointsTo) map.set(v.pointsTo, (map.get(v.pointsTo) ?? 0) + 1);
    });
    return map;
  }, [step.variables]);

  // 연결 맵
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

  // 포인터 + 타깃이 되는 변수 ID (호버 가능한 변수 집합)
  const interactiveIds = useMemo(() => {
    const set = new Set<string>();
    step.variables.forEach((v) => {
      if (v.isPointer) set.add(v.id);
      if (v.pointsTo) set.add(v.pointsTo);
    });
    return set;
  }, [step.variables]);

  // 포인터 → 타깃 변수명 (예: a → "x")
  const targetNameMap = useMemo(() => {
    const map = new Map<string, string>();
    step.variables.forEach((v) => {
      if (v.isPointer && v.pointsTo) {
        const target = variableMap.get(v.pointsTo);
        if (target) map.set(v.id, target.name);
      }
    });
    return map;
  }, [step.variables, variableMap]);

  // 하이라이트 ID
  const highlightedIds = useMemo((): Set<string> => {
    if (!hoveredId) return new Set();
    const set = new Set<string>([hoveredId]);
    const hv = variableMap.get(hoveredId);
    if (hv?.pointsTo) set.add(hv.pointsTo);
    (connectionMap.get(hoveredId) ?? []).forEach((id) => set.add(id));
    return set;
  }, [hoveredId, variableMap, connectionMap]);

  // 힙 객체 정렬 (스택 참조 순서)
  const orderedHeapObjects = useMemo(() => {
    const placed = new Set<string>();
    const ordered: FlowVariable[] = [];
    for (const frame of [...stackFrames].reverse()) {
      for (const v of frame.variables) {
        if (v.pointsTo) {
          const obj = heapObjects.find((h) => h.id === v.pointsTo);
          if (obj && !placed.has(obj.id)) { ordered.push(obj); placed.add(obj.id); }
        }
      }
    }
    for (const h of heapObjects) {
      if (!placed.has(h.id)) ordered.push(h);
    }
    return ordered;
  }, [stackFrames, heapObjects]);

  // 화살표 쌍
  const arrowPairs = useMemo(
    () => step.variables
      .filter((v) => v.isPointer && v.pointsTo)
      .map((v) => ({ fromId: v.id, toId: v.pointsTo!, targetIsHeap: heapIdSet.has(v.pointsTo!) })),
    [step.variables, heapIdSet]
  );

  // DOM 측정 → 화살표 좌표
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (cancelled || !containerRef.current) return;
      const cr = containerRef.current.getBoundingClientRect();
      const result: ArrowInfo[] = [];

      for (const { fromId, toId, targetIsHeap } of arrowPairs) {
        const fromEl = containerRef.current.querySelector(`[data-var-id="${fromId}"]`);
        const toEl = containerRef.current.querySelector(`[data-variable-id="${toId}"]`);
        if (!fromEl || !toEl) continue;

        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();
        const isSameColumn = !targetIsHeap;

        result.push({
          id: `${fromId}->${toId}`, fromId, toId,
          sx: fr.right - cr.left,
          sy: fr.top + fr.height / 2 - cr.top,
          tx: isSameColumn ? tr.right - cr.left : tr.left - cr.left,
          ty: tr.top + tr.height / 2 - cr.top,
          isShared: (nameCountMap.get(toId) ?? 0) > 1,
          isSameColumn,
        });
      }
      setArrows(result);
    };

    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(measure, 150)));
    return () => { cancelled = true; };
  }, [arrowPairs, nameCountMap]);

  // prev step diff
  const prevIds = useMemo(() => new Set(prevStep?.variables.map((v) => v.id) ?? []), [prevStep]);
  const prevValues = useMemo(() => new Map(prevStep?.variables.map((v) => [v.id, v.value]) ?? []), [prevStep]);

  // 액티브 프레임 = 마지막 non-global
  const activeFrameName = useMemo(() => {
    const nonGlobal = stackFrames.filter((f) => f.name !== 'global');
    return nonGlobal.length > 0 ? nonGlobal[nonGlobal.length - 1].name : null;
  }, [stackFrames]);

  const anyHovered = hoveredId !== null;
  const hasHeap = orderedHeapObjects.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex gap-6 p-4 min-h-[120px]">
        {/* Stack — 항상 좁게 */}
        <div className="flex flex-col gap-3" style={{ width: '45%', maxWidth: 280, flexShrink: 0 }}>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stack</div>
          <AnimatePresence mode="popLayout">
            {[...stackFrames].reverse().map((frame) => (
              <StackFrame
                key={frame.name}
                frame={frame}
                isActive={frame.name === activeFrameName}
                highlightedIds={highlightedIds}
                interactiveIds={interactiveIds}
                targetNameMap={targetNameMap}
                onHoverStart={handleHoverStart}
                onHoverEnd={handleHoverEnd}
              />
            ))}
          </AnimatePresence>
          {stackFrames.length === 0 && (
            <span className="text-[12px] text-gray-400 italic">No frames</span>
          )}
        </div>

        {/* Heap (힙 객체가 있을 때만 표시) */}
        {hasHeap && (
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Heap</div>
            <div className="flex flex-col gap-5 pt-1 pb-3">
              <AnimatePresence mode="popLayout">
                {orderedHeapObjects.map((obj) => (
                  <HeapCard
                    key={obj.id}
                    object={obj}
                    nameCount={nameCountMap.get(obj.id) ?? 0}
                    isNew={!prevIds.has(obj.id)}
                    isUpdated={prevIds.has(obj.id) && prevValues.get(obj.id) !== obj.value}
                    isHighlighted={highlightedIds.has(obj.id)}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* SVG 화살표 */}
      {arrows.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5, overflow: 'visible' }}>
          <defs>
            <marker id="c-arr-def" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#22c55e" />
            </marker>
            <marker id="c-arr-shr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
            </marker>
            <marker id="c-arr-hi" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L9,3.5 z" fill="#f59e0b" />
            </marker>
          </defs>

          {arrows.map(({ id, fromId, toId, sx, sy, tx, ty, isShared, isSameColumn }) => {
            let d: string;
            if (isSameColumn) {
              // 스택→스택: 오른쪽으로 볼록한 커브
              const bulge = Math.max(50, Math.abs(sy - ty) * 0.35);
              d = `M ${sx} ${sy} C ${sx + bulge} ${sy} ${tx + bulge} ${ty} ${tx} ${ty}`;
            } else {
              // 스택→힙: 일반 좌→우
              const span = Math.max(40, Math.abs(tx - sx) * 0.45);
              d = `M ${sx} ${sy} C ${sx + span} ${sy} ${tx - span} ${ty} ${tx} ${ty}`;
            }

            const isActive = anyHovered && (highlightedIds.has(fromId) || highlightedIds.has(toId));
            const opacity = anyHovered ? (isActive ? 1 : 0.08) : 0.7;
            const stroke = isActive ? '#f59e0b' : isShared ? '#a78bfa' : '#22c55e';
            const markerId = isActive ? 'c-arr-hi' : isShared ? 'c-arr-shr' : 'c-arr-def';

            return (
              <path key={id} d={d} fill="none"
                stroke={stroke} strokeWidth={isActive ? 2.5 : 1.5}
                markerEnd={`url(#${markerId})`} opacity={opacity}
                style={{ transition: 'opacity 0.12s, stroke-width 0.12s' }}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
});

export default CReferenceView;
