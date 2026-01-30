/**
 * JavaFlowView Component
 *
 * Java 전용 Flow 시각화 - Python 포스트잇 스타일
 *
 * 컨셉:
 * - 값(객체)이 주인공, 변수명은 포스트잇(이름표)
 * - 같은 객체를 참조하면 하나의 박스에 이름표 여러 개
 * - 화살표 없이 호버 하이라이트
 */

import { memo, useMemo, useState, useCallback } from 'react';
import type { FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';

// ============================================
// 타입 정의
// ============================================

interface JavaFlowViewProps {
  step: FlowStep;
  prevStep?: FlowStep | null;
  className?: string;
}

interface ObjectWithNames {
  object: FlowVariable;    // Heap 객체 또는 Primitive 값
  names: FlowVariable[];   // 이 객체를 가리키는 변수 이름들
}

// ============================================
// 상수 - 귀여운 파스텔톤
// ============================================

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  // Primitive (노란 계열)
  int: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
  double: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
  float: { bg: '#fef9c3', border: '#facc15', text: '#854d0e' },
  boolean: { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  char: { bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  // Reference (각각 다른 색)
  String: { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  'java.lang.String': { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  'int[]': { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
  'String[]': { bg: '#e0e7ff', border: '#818cf8', text: '#3730a3' },
  Array: { bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
  Object: { bg: '#f3e8ff', border: '#c084fc', text: '#6b21a8' },
  // Default
  default: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
};

const FRAME_COLORS = {
  main: { bg: '#eff6ff', border: '#3b82f6', header: '#dbeafe', label: '#1d4ed8' },
  method: { bg: '#f0fdf4', border: '#22c55e', header: '#dcfce7', label: '#15803d' },
};

// ============================================
// 유틸리티 함수
// ============================================

function getTypeColor(type: string) {
  if (type.includes('[]')) return TYPE_COLORS['Array'];
  if (type.includes('String')) return TYPE_COLORS['String'];
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

function getTypeEmoji(type: string): string {
  if (type.includes('String')) return '📝';
  if (type.includes('[]')) return '📋';
  if (type === 'int' || type === 'double' || type === 'float') return '🔢';
  if (type === 'boolean') return '✓';
  if (type === 'char') return '🔤';
  return '📦';
}

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return 'null';

  const strValue = String(value);

  // 참조 표시 제거 (-> 0x001 → 그냥 값으로)
  if (strValue.startsWith('->') || strValue.startsWith('→')) {
    return strValue; // 이건 나중에 객체로 대체될 예정
  }

  // 문자열
  if (type.includes('String')) {
    if (strValue.startsWith('"') && strValue.endsWith('"')) {
      return strValue;
    }
    return `"${strValue}"`;
  }

  // 배열
  if (type.includes('[]')) {
    if (strValue.startsWith('{') && strValue.endsWith('}')) {
      return strValue.replace('{', '[').replace('}', ']');
    }
    return strValue;
  }

  return strValue;
}

// ============================================
// ObjectCard 컴포넌트 (객체 + 이름표들)
// ============================================

interface ObjectCardProps {
  object: FlowVariable;
  names: FlowVariable[];
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  isNew?: boolean;
  isUpdated?: boolean;
}

const ObjectCard = memo(function ObjectCard({
  object,
  names,
  isHighlighted,
  onHover,
  isNew,
  isUpdated,
}: ObjectCardProps) {
  const colors = getTypeColor(object.type);
  const emoji = getTypeEmoji(object.type);
  const displayValue = formatValue(object.value, object.type);

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 cursor-pointer select-none
        transition-all duration-150 ease-out
        ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg scale-105' : 'hover:scale-102'}
        ${isNew ? 'animate-bounce-in' : ''}
        ${isUpdated ? 'animate-pulse-once' : ''}
      `}
      style={{
        backgroundColor: isHighlighted ? '#dbeafe' : colors.bg,
        borderColor: isHighlighted ? '#3b82f6' : colors.border,
        boxShadow: isHighlighted ? '0 0 12px rgba(59, 130, 246, 0.5)' : undefined,
      }}
      onMouseEnter={() => onHover(object.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* 이름표들 (포스트잇) - 상단에 나란히 */}
      {names.length > 0 && (
        <div className="absolute -top-3 left-2 flex gap-1">
          {names.map((nameVar) => (
            <span
              key={nameVar.id}
              className="px-2 py-0.5 rounded text-xs font-bold shadow-sm"
              style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fbbf24',
              }}
            >
              {nameVar.name}
            </span>
          ))}
        </div>
      )}

      {/* 값 (이모지 + 내용) */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-lg">{emoji}</span>
        <span
          className="font-mono font-semibold text-sm"
          style={{ color: colors.text }}
        >
          {displayValue}
        </span>
      </div>

      {/* 타입 - 우하단 */}
      <span
        className="absolute -bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px]"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        {object.type}
      </span>
    </div>
  );
});

// ============================================
// FrameCard 컴포넌트
// ============================================

interface FrameCardProps {
  name: string;
  objects: ObjectWithNames[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  isActive?: boolean;
  prevStep?: FlowStep | null;
}

const FrameCard = memo(function FrameCard({
  name,
  objects,
  hoveredId,
  onHover,
  isActive,
  prevStep,
}: FrameCardProps) {
  const colors = name === 'main' ? FRAME_COLORS.main : FRAME_COLORS.method;

  // 이전 스텝 객체들
  const prevObjIds = new Set(prevStep?.variables.map(v => v.id) || []);
  const prevObjValues = new Map(prevStep?.variables.map(v => [v.id, v.value]) || []);

  return (
    <div
      className={`
        rounded-xl overflow-hidden border-2
        ${isActive ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-sm'}
      `}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      {/* 프레임 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ backgroundColor: colors.header }}
      >
        <span className="text-sm">{name === 'main' ? '▶' : '→'}</span>
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: colors.label }}
        >
          {name}()
        </span>
        {isActive && (
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-blue-500 text-white">
            실행 중
          </span>
        )}
      </div>

      {/* 객체들 (포스트잇 스타일) */}
      <div className="p-4 pt-5 flex flex-wrap gap-6 min-h-[80px]">
        {objects.length > 0 ? (
          objects.map(({ object, names }) => {
            const isNew = !prevObjIds.has(object.id);
            const isUpdated = !isNew && prevObjValues.get(object.id) !== object.value;
            const isHighlighted = hoveredId === object.id;

            return (
              <ObjectCard
                key={object.id}
                object={object}
                names={names}
                isHighlighted={isHighlighted}
                onHover={onHover}
                isNew={isNew}
                isUpdated={isUpdated}
              />
            );
          })
        ) : (
          <span className="text-sm text-gray-400 italic">(비어 있음)</span>
        )}
      </div>
    </div>
  );
});

// ============================================
// JavaFlowView 메인 컴포넌트
// ============================================

export const JavaFlowView = memo(function JavaFlowView({
  step,
  prevStep,
  className = '',
}: JavaFlowViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // ========================================
  // Python 스타일: 객체 중심 + 이름표 그룹화
  // ========================================
  const { frameData } = useMemo(() => {
    // 1. 변수 맵 생성
    const variableMap = new Map<string, FlowVariable>();
    step.variables.forEach((v) => variableMap.set(v.id, v));

    // 2. Heap 객체들 (scope === 'heap')
    const heapObjects = new Map<string, FlowVariable>();
    step.variables.forEach((v) => {
      if (v.scope === 'heap') {
        heapObjects.set(v.id, v);
      }
    });

    // 3. 각 객체를 가리키는 이름들 그룹화
    const namesByObject = new Map<string, FlowVariable[]>();
    step.variables.forEach((v) => {
      if (v.pointsTo) {
        const names = namesByObject.get(v.pointsTo) || [];
        names.push(v);
        namesByObject.set(v.pointsTo, names);
      }
    });

    // 4. 프레임별 ObjectWithNames 생성
    const frames: Array<{ name: string; objects: ObjectWithNames[] }> = [];
    const processedObjectIds = new Set<string>();

    // 프레임 기반
    if (step.frames && step.frames.length > 0) {
      step.frames.forEach((frame) => {
        // Heap 프레임은 스킵 (객체들은 이름과 함께 표시됨)
        if (frame.name === 'heap' || frame.name === 'Objects (Heap)') {
          return;
        }

        const frameObjects: ObjectWithNames[] = [];

        frame.variableIds.forEach((varId) => {
          const variable = variableMap.get(varId);
          if (!variable) return;

          // 참조가 있는 경우 → 해당 Heap 객체 + 이름들
          if (variable.pointsTo) {
            const targetObj = variableMap.get(variable.pointsTo);
            if (targetObj && !processedObjectIds.has(targetObj.id)) {
              const allNames = namesByObject.get(targetObj.id) || [];
              // 같은 프레임의 이름들만 필터
              const frameNames = allNames.filter((n) => n.scope === frame.name);
              if (frameNames.length > 0) {
                frameObjects.push({ object: targetObj, names: frameNames });
                processedObjectIds.add(targetObj.id);
              }
            }
          }
          // Primitive 값 (참조 없음)
          else if (variable.scope !== 'heap') {
            // Primitive도 ObjectWithNames로 (이름표 = 자기 자신)
            frameObjects.push({
              object: variable,
              names: [variable], // 자기 이름이 이름표
            });
          }
        });

        if (frameObjects.length > 0 || frame.name === 'main') {
          frames.push({ name: frame.name, objects: frameObjects });
        }
      });
    } else {
      // 프레임이 없으면 모든 변수를 main으로
      const mainObjects: ObjectWithNames[] = [];

      // Heap 객체들에 이름 붙이기
      heapObjects.forEach((obj, objId) => {
        if (!processedObjectIds.has(objId)) {
          const names = namesByObject.get(objId) || [];
          mainObjects.push({ object: obj, names });
          processedObjectIds.add(objId);
        }
      });

      // Primitive 변수들
      step.variables.forEach((v) => {
        if (v.scope !== 'heap' && !v.pointsTo) {
          mainObjects.push({ object: v, names: [v] });
        }
      });

      if (mainObjects.length > 0) {
        frames.push({ name: 'main', objects: mainObjects });
      }
    }

    return { frameData: frames };
  }, [step]);

  // 마지막 프레임이 활성
  const activeFrameName = frameData.length > 0
    ? frameData[frameData.length - 1].name
    : null;

  return (
    <div className={`java-flow-view p-4 ${className}`}>
      {/* CSS for animations */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-once {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5); }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out; }
        .animate-pulse-once { animation: pulse-once 0.4s ease-in-out; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>

      {/* 헤더 */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>☕</span>
        <span>Java 메모리: 같은 객체면 이름표가 함께 붙어요</span>
      </div>

      {/* 프레임들 (역순 - 최근 호출이 위) */}
      <div className="flex flex-col gap-4">
        {frameData.slice().reverse().map(({ name, objects }) => (
          <FrameCard
            key={name}
            name={name}
            objects={objects}
            hoveredId={hoveredId}
            onHover={handleHover}
            isActive={name === activeFrameName}
            prevStep={prevStep}
          />
        ))}
      </div>

      {/* 빈 상태 */}
      {frameData.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">☕</span>
          <p>아직 생성된 변수가 없어요</p>
          <p className="text-sm">코드가 실행되면 여기에 변수들이 나타납니다</p>
        </div>
      )}

      {/* 범례 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' }}>
              이름
            </div>
            <span>변수 이름표</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fef9c3', border: '1px solid #facc15' }} />
            <span>숫자</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d1fae5', border: '1px solid #34d399' }} />
            <span>String</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ffedd5', border: '1px solid #fb923c' }} />
            <span>배열</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default JavaFlowView;
