/**
 * ReferenceGraphView - 공통 참조 그래프 시각화 컴포넌트
 *
 * Python, Java, JavaScript의 메모리 시각화를 통합하는 공통 뷰.
 * 레이아웃: 스택 프레임(위) → 변수 칩 → 짧은 선 → 값 박스(아래)
 *
 * - 같은 객체 참조 시 여러 변수명이 한 박스에 모임
 * - Primitive 값은 인라인 표시 (선 없음)
 * - 언어별 색상/라벨은 LanguageConfig로 커스터마이징
 */

import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowStep, FlowVariable } from '@codeinsight/shared';

// ============================================
// 타입 정의
// ============================================

interface ReferenceGraphViewProps {
  step: FlowStep;
  prevStep?: FlowStep | null;
  language: 'python' | 'java' | 'javascript';
  className?: string;
}

interface ObjectWithNames {
  object: FlowVariable;
  names: FlowVariable[];
}

// ============================================
// 언어별 설정
// ============================================

interface LanguageTheme {
  icon: string;
  label: string;
  description: string;
  frameColors: {
    global: { bg: string; border: string; header: string; headerText: string };
    function: { bg: string; border: string; header: string; headerText: string };
  };
  typeColors: Record<string, { bg: string; border: string; text: string }>;
  nameTagColor: { bg: string; text: string; border: string };
  globalFrameName: string;
  showMutability?: boolean;
}

const LANG_THEMES: Record<string, LanguageTheme> = {
  python: {
    icon: '🐍',
    label: 'Python',
    description: '이름표(포스트잇)가 값에 붙어있어요',
    globalFrameName: 'global',
    showMutability: true,
    frameColors: {
      global: { bg: '#f8fafc', border: '#cbd5e1', header: '#e2e8f0', headerText: '#475569' },
      function: { bg: '#eff6ff', border: '#60a5fa', header: '#dbeafe', headerText: '#1d4ed8' },
    },
    typeColors: {
      int: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
      float: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
      str: { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
      bool: { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
      NoneType: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
      list: { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
      tuple: { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
      dict: { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
      set: { bg: '#fae8ff', border: '#c084fc', text: '#6b21a8' },
      function: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
      class: { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
      instance: { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
      default: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
    },
    nameTagColor: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  },
  java: {
    icon: '☕',
    label: 'Java',
    description: '같은 객체면 이름표가 함께 붙어요',
    globalFrameName: 'main',
    frameColors: {
      global: { bg: '#eff6ff', border: '#3b82f6', header: '#dbeafe', headerText: '#1d4ed8' },
      function: { bg: '#f0fdf4', border: '#22c55e', header: '#dcfce7', headerText: '#15803d' },
    },
    typeColors: {
      int: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
      double: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
      float: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
      boolean: { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
      char: { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
      String: { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
      'java.lang.String': { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
      Array: { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
      Object: { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
      default: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
    },
    nameTagColor: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  },
  javascript: {
    icon: '🟨',
    label: 'JavaScript',
    description: '마우스를 올려 연결 관계를 확인하세요',
    globalFrameName: '__main__',
    frameColors: {
      global: { bg: '#fffbeb', border: '#f59e0b', header: '#fef3c7', headerText: '#b45309' },
      function: { bg: '#f0fdf4', border: '#22c55e', header: '#dcfce7', headerText: '#15803d' },
    },
    typeColors: {
      number: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
      string: { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
      boolean: { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
      undefined: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
      null: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
      Array: { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
      Object: { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
      Function: { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
      Reference: { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
      default: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
    },
    nameTagColor: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
  },
};

// ============================================
// 유틸리티
// ============================================

function getTypeColor(type: string, theme: LanguageTheme) {
  const normalized = type.toLowerCase();
  // 직접 매칭
  if (theme.typeColors[type]) return theme.typeColors[type];
  // 부분 매칭
  if (normalized.includes('array') || normalized.includes('[]')) return theme.typeColors['Array'] || theme.typeColors['list'] || theme.typeColors.default;
  if (normalized.includes('string')) return theme.typeColors['String'] || theme.typeColors['string'] || theme.typeColors['str'] || theme.typeColors.default;
  if (normalized.includes('object')) return theme.typeColors['Object'] || theme.typeColors.default;
  if (normalized.includes('function')) return theme.typeColors['Function'] || theme.typeColors['function'] || theme.typeColors.default;
  return theme.typeColors.default;
}

function getTypeEmoji(type: string, language: string): string {
  const t = type.toLowerCase();
  if (language === 'python') {
    const map: Record<string, string> = { int: '🔢', float: '🔢', str: '📝', bool: '✓', NoneType: '∅', list: '📋', tuple: '📦', dict: '🗂️', set: '🎯', function: '⚙️', class: '🏛️', instance: '🧩' };
    return map[type] || '📦';
  }
  if (t.includes('array') || t.includes('[]')) return '📋';
  if (t.includes('string') || t === 'str') return '📝';
  if (t.includes('function')) return '⚡';
  if (t === 'number' || t === 'int' || t === 'double' || t === 'float') return '🔢';
  if (t === 'boolean' || t === 'bool') return '✓';
  if (t === 'undefined' || t === 'null' || t === 'nonetype') return '∅';
  if (t.includes('object')) return '📦';
  return '📦';
}

// ============================================
// ValueCard 컴포넌트
// ============================================

interface ValueCardProps {
  object: FlowVariable;
  names: FlowVariable[];
  theme: LanguageTheme;
  language: string;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  isNew: boolean;
  isUpdated: boolean;
}

const ValueCard = memo(function ValueCard({
  object,
  names,
  theme,
  language,
  isHighlighted,
  onHover,
  isNew,
  isUpdated,
}: ValueCardProps) {
  const colors = getTypeColor(object.type, theme);
  const emoji = getTypeEmoji(object.type, language);
  const displayValue = String(object.value ?? 'null');
  const meta = object.metadata as Record<string, unknown> | undefined;

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative px-3.5 py-2.5 rounded-xl border-2 cursor-pointer select-none
        transition-shadow duration-150
        ${isHighlighted ? 'shadow-lg ring-2 ring-amber-300' : 'shadow-sm hover:shadow-md'}
      `}
      style={{
        backgroundColor: isHighlighted ? '#fefce8' : colors.bg,
        borderColor: isHighlighted ? '#fbbf24' : meta?.isNew ? '#22c55e' : colors.border,
      }}
      onMouseEnter={() => onHover(object.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* NEW badge - top left corner */}
      {meta?.isNew && (
        <span
          className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded text-[10px] font-bold z-20"
          style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #22c55e' }}
        >
          NEW
        </span>
      )}

      {/* Name tags - positioned above the card */}
      {names.length > 0 && (
        <div className="absolute -top-3 left-2 flex gap-1 z-10" style={meta?.isNew ? { left: '2.5rem' } : undefined}>
          {names.map((n) => {
            const nameMeta = n.metadata as Record<string, unknown> | undefined;
            return (
              <span
                key={n.id}
                className="px-2 py-0.5 rounded text-xs font-bold font-mono shadow-sm flex items-center gap-0.5"
                style={{
                  backgroundColor: nameMeta?.sameRef ? '#e0e7ff' : theme.nameTagColor.bg,
                  color: nameMeta?.sameRef ? '#4338ca' : theme.nameTagColor.text,
                  border: `1px solid ${nameMeta?.sameRef ? '#818cf8' : theme.nameTagColor.border}`,
                }}
              >
                {n.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Value + emoji */}
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-base">{emoji}</span>
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

      {/* hashCode - small text below value */}
      {meta?.hashCode && (
        <div className="text-[10px] font-mono text-gray-500 mt-0.5">
          {String(meta.hashCode)}
        </div>
      )}

      {/* Type badge - bottom right */}
      <span
        className="absolute -bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        {object.type}
      </span>

      {/* refCount badge - bottom left */}
      {meta?.refCount != null && (
        <span
          className="absolute -bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono"
          style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #60a5fa' }}
        >
          refs: {String(meta.refCount)}
        </span>
      )}
    </motion.div>
  );
});

// ============================================
// FrameSection 컴포넌트
// ============================================

interface FrameSectionProps {
  name: string;
  objects: ObjectWithNames[];
  theme: LanguageTheme;
  language: string;
  hoveredId: string | null;
  connectedIds: Set<string>;
  onHover: (id: string | null) => void;
  isActive: boolean;
  isNew: boolean;
  prevVariableIds: Set<string>;
  prevVariableValues: Map<string, unknown>;
}

const FrameSection = memo(function FrameSection({
  name,
  objects,
  theme,
  language,
  hoveredId,
  connectedIds,
  onHover,
  isActive,
  isNew,
  prevVariableIds,
  prevVariableValues,
}: FrameSectionProps) {
  const isGlobal = name === theme.globalFrameName || name === 'global' || name === '__main__' || name === 'main';
  const isStringPool = name === 'String Pool';
  const colors = isGlobal ? theme.frameColors.global : theme.frameColors.function;
  const displayName = isGlobal ? (language === 'python' ? 'global' : name) : isStringPool ? name : `${name}()`;

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -12 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        rounded-xl overflow-hidden border-2
        ${isActive ? 'ring-2 ring-blue-300 shadow-md' : 'shadow-sm'}
      `}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      {/* Frame header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ backgroundColor: colors.header }}
      >
        <span className="text-sm">{isGlobal ? theme.icon : '→'}</span>
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: colors.headerText }}
        >
          {displayName}
        </span>
        {isActive && (
          <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-md bg-blue-500 text-white font-medium">
            실행 중
          </span>
        )}
      </div>

      {/* Objects within frame */}
      <div className="p-4 pt-5 flex flex-wrap gap-5 min-h-[64px]">
        {objects.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {objects.map(({ object, names }) => {
              const isObjNew = !prevVariableIds.has(object.id);
              const isUpdated = !isObjNew && prevVariableValues.get(object.id) !== object.value;
              const isHighlighted = hoveredId === object.id || connectedIds.has(object.id);

              return (
                <ValueCard
                  key={object.id}
                  object={object}
                  names={names}
                  theme={theme}
                  language={language}
                  isHighlighted={isHighlighted}
                  onHover={onHover}
                  isNew={isObjNew}
                  isUpdated={isUpdated}
                />
              );
            })}
          </AnimatePresence>
        ) : (
          <span className="text-sm text-gray-400 italic">(비어 있음)</span>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// ReferenceGraphView 메인 컴포넌트
// ============================================

export const ReferenceGraphView = memo(function ReferenceGraphView({
  step,
  prevStep,
  language,
  className = '',
}: ReferenceGraphViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);

  const theme = LANG_THEMES[language] || LANG_THEMES.javascript;

  // Build frame data: group objects by frame, attach name tags
  const { frameData, connectionMap } = useMemo(() => {
    const variableMap = new Map<string, FlowVariable>();
    step.variables.forEach((v) => variableMap.set(v.id, v));

    // Objects on the heap
    const heapObjects = new Map<string, FlowVariable>();
    step.variables.forEach((v) => {
      if (v.scope === 'heap' || v.scope === 'objects') {
        heapObjects.set(v.id, v);
      }
    });

    // Connection map (bidirectional) for hover highlight
    const connMap = new Map<string, string>();
    step.variables.forEach((v) => {
      if (v.pointsTo) {
        connMap.set(v.id, v.pointsTo);
        connMap.set(v.pointsTo, v.id);
      }
    });

    // Group names by target object
    const namesByObject = new Map<string, FlowVariable[]>();
    step.variables.forEach((v) => {
      if (v.pointsTo) {
        const names = namesByObject.get(v.pointsTo) || [];
        names.push(v);
        namesByObject.set(v.pointsTo, names);
      }
    });

    // Build frames
    const frames: Array<{ name: string; objects: ObjectWithNames[] }> = [];
    const processedObjectIds = new Set<string>();

    if (step.frames && step.frames.length > 0) {
      step.frames.forEach((frame) => {
        // Skip heap/objects frame
        if (frame.name === 'heap' || frame.name === 'Objects (Heap)' || frame.name === 'objects') {
          return;
        }

        const frameObjects: ObjectWithNames[] = [];

        frame.variableIds.forEach((varId) => {
          const variable = variableMap.get(varId);
          if (!variable) return;

          if (variable.pointsTo) {
            const targetObj = variableMap.get(variable.pointsTo);
            if (targetObj && !processedObjectIds.has(targetObj.id)) {
              const allNames = namesByObject.get(targetObj.id) || [];
              const frameNames = allNames.filter(
                (n) => n.scope === frame.name || frame.variableIds.includes(n.id)
              );
              if (frameNames.length > 0) {
                frameObjects.push({ object: targetObj, names: frameNames });
                processedObjectIds.add(targetObj.id);
              }
            } else if (!targetObj) {
              // Dangling reference (e.g. Cache[127]) — show variable itself as a value card
              frameObjects.push({ object: variable, names: [variable] });
            }
          } else if (variable.scope !== 'heap' && variable.scope !== 'objects') {
            frameObjects.push({ object: variable, names: [variable] });
          }
        });

        const isGlobalFrame = frame.name === theme.globalFrameName
          || frame.name === 'global'
          || frame.name === '__main__'
          || frame.name === 'main';

        if (frameObjects.length > 0 || isGlobalFrame) {
          frames.push({ name: frame.name, objects: frameObjects });
        }
      });
    } else {
      // No frames — put everything in a default frame
      const mainObjects: ObjectWithNames[] = [];

      heapObjects.forEach((obj, objId) => {
        if (!processedObjectIds.has(objId)) {
          const names = namesByObject.get(objId) || [];
          mainObjects.push({ object: obj, names });
          processedObjectIds.add(objId);
        }
      });

      step.variables.forEach((v) => {
        if (v.scope !== 'heap' && v.scope !== 'objects' && !v.pointsTo) {
          mainObjects.push({ object: v, names: [v] });
        }
      });

      if (mainObjects.length > 0) {
        frames.push({ name: theme.globalFrameName, objects: mainObjects });
      }
    }

    return { frameData: frames, connectionMap: connMap };
  }, [step, theme.globalFrameName]);

  // Hover highlight connected IDs
  const connectedIds = useMemo(() => {
    const ids = new Set<string>();
    if (hoveredId && connectionMap.has(hoveredId)) {
      ids.add(connectionMap.get(hoveredId)!);
    }
    return ids;
  }, [hoveredId, connectionMap]);

  // Previous step data for diff
  const { prevVariableIds, prevVariableValues } = useMemo(() => {
    const ids = new Set(prevStep?.variables.map((v) => v.id) || []);
    const values = new Map(prevStep?.variables.map((v) => [v.id, v.value]) || []);
    return { prevVariableIds: ids, prevVariableValues: values };
  }, [prevStep]);

  const prevFrameNames = useMemo(
    () => new Set(prevStep?.frames?.map((f) => f.name) || []),
    [prevStep]
  );

  // Last frame is active
  const activeFrameName = frameData.length > 0 ? frameData[frameData.length - 1].name : null;

  return (
    <div className={`reference-graph-view p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>{theme.icon}</span>
        <span>{theme.label}: {theme.description}</span>
      </div>

      {/* Frames (reversed — latest call on top) */}
      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {frameData.slice().reverse().map(({ name, objects }) => (
            <FrameSection
              key={name}
              name={name}
              objects={objects}
              theme={theme}
              language={language}
              hoveredId={hoveredId}
              connectedIds={connectedIds}
              onHover={handleHover}
              isActive={name === activeFrameName}
              isNew={!prevFrameNames.has(name)}
              prevVariableIds={prevVariableIds}
              prevVariableValues={prevVariableValues}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {frameData.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">{theme.icon}</span>
          <p>아직 생성된 변수가 없어요</p>
          <p className="text-sm">코드가 실행되면 여기에 변수들이 나타납니다</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: theme.nameTagColor.bg,
                color: theme.nameTagColor.text,
                border: `1px solid ${theme.nameTagColor.border}`,
              }}
            >
              이름
            </div>
            <span>변수 이름표</span>
          </div>
          {language === 'python' && (
            <>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fef3c7', border: '1px solid #fbbf24' }} />
                <span>불변 (int, str...)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ffedd5', border: '1px solid #fb923c' }} />
                <span>가변 (list, dict...)</span>
              </div>
            </>
          )}
          {language !== 'python' && (
            <>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fef9c3', border: '1px solid #facc15' }} />
                <span>숫자</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d1fae5', border: '1px solid #34d399' }} />
                <span>문자열</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ffedd5', border: '1px solid #fb923c' }} />
                <span>배열</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f3e8ff', border: '1px solid #c084fc' }} />
                <span>객체</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default ReferenceGraphView;
