/**
 * JavaFlowView Component
 *
 * Java 전용 Flow 시각화 - Stack/Heap + 포스트잇 스타일
 *
 * 컨셉:
 * - Stack 프레임별로 변수 표시 (main, method 등)
 * - Heap에 참조 객체 표시 (String, Array, Object)
 * - 화살표 대신 호버 시 연결된 요소 하이라이트
 * - Python처럼 귀여운 디자인
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

// ============================================
// 상수
// ============================================

// 타입별 색상 (귀여운 파스텔톤)
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  // Primitive
  int: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  double: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  float: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  boolean: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  char: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  // Reference
  String: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  'int[]': { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  'String[]': { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
  Array: { bg: '#ffedd5', border: '#f97316', text: '#9a3412' },
  Object: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  // Default
  default: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' },
};

// 프레임별 색상
const FRAME_COLORS: Record<string, { bg: string; border: string; header: string; label: string }> = {
  main: {
    bg: '#eff6ff',
    border: '#3b82f6',
    header: '#dbeafe',
    label: '#1d4ed8',
  },
  heap: {
    bg: '#fefce8',
    border: '#eab308',
    header: '#fef08a',
    label: '#a16207',
  },
  method: {
    bg: '#f0fdf4',
    border: '#22c55e',
    header: '#dcfce7',
    label: '#15803d',
  },
};

// ============================================
// 유틸리티 함수
// ============================================

function getTypeColor(type: string) {
  // Array 타입 체크
  if (type.includes('[]')) {
    return TYPE_COLORS['Array'];
  }
  return TYPE_COLORS[type] || TYPE_COLORS.default;
}

function getFrameColor(name: string) {
  if (name === 'main') return FRAME_COLORS.main;
  if (name === 'heap') return FRAME_COLORS.heap;
  return FRAME_COLORS.method;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    // 참조 표시
    if (value.startsWith('→')) return value;
    // 문자열 값
    if (value.length > 10) return `"${value.slice(0, 8)}..."`;
    return value.startsWith('"') ? value : `"${value}"`;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.length <= 4) return `[${value.join(', ')}]`;
    return `[${value.slice(0, 3).join(', ')}, ...]`;
  }
  return String(value);
}

// ============================================
// VariableCard 컴포넌트 (포스트잇 스타일)
// ============================================

interface VariableCardProps {
  variable: FlowVariable;
  isHighlighted: boolean;
  onHover: (refAddress: string | null) => void;
  isNew?: boolean;
  isUpdated?: boolean;
}

const VariableCard = memo(function VariableCard({
  variable,
  isHighlighted,
  onHover,
  isNew,
  isUpdated,
}: VariableCardProps) {
  const colors = getTypeColor(variable.type);
  const hasRef = variable.pointsTo != null;
  const displayValue = formatValue(variable.value);

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg border-2 cursor-pointer select-none
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
      onMouseEnter={() => hasRef && onHover(variable.pointsTo!)}
      onMouseLeave={() => onHover(null)}
    >
      {/* 변수명 라벨 (포스트잇) */}
      <span
        className="absolute -top-2.5 left-2 px-1.5 py-0.5 rounded text-xs font-bold"
        style={{
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #f59e0b',
        }}
      >
        {variable.name}
      </span>

      {/* 값 */}
      <span
        className="font-mono font-semibold text-sm"
        style={{ color: colors.text }}
      >
        {displayValue}
      </span>

      {/* 타입 */}
      <span
        className="absolute -bottom-2 right-2 px-1 rounded text-[10px] opacity-70"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
        }}
      >
        {variable.type}
      </span>

      {/* 참조 표시 */}
      {hasRef && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
      )}
    </div>
  );
});

// ============================================
// HeapObjectCard 컴포넌트
// ============================================

interface HeapObjectCardProps {
  variable: FlowVariable;
  isHighlighted: boolean;
  onHover: (address: string | null) => void;
}

const HeapObjectCard = memo(function HeapObjectCard({
  variable,
  isHighlighted,
  onHover,
}: HeapObjectCardProps) {
  const colors = getTypeColor(variable.type);
  const displayValue = formatValue(variable.value);

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl border-2 cursor-pointer select-none
        transition-all duration-150 ease-out
        ${isHighlighted ? 'ring-2 ring-blue-400 shadow-lg scale-105' : ''}
      `}
      style={{
        backgroundColor: isHighlighted ? '#dbeafe' : colors.bg,
        borderColor: isHighlighted ? '#3b82f6' : colors.border,
        boxShadow: isHighlighted ? '0 0 12px rgba(59, 130, 246, 0.5)' : undefined,
      }}
      onMouseEnter={() => variable.id && onHover(variable.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* 주소 라벨 */}
      <span
        className="absolute -top-2.5 left-3 px-1.5 py-0.5 rounded text-[10px] font-mono"
        style={{
          backgroundColor: '#e5e7eb',
          color: '#4b5563',
        }}
      >
        {variable.address || variable.id}
      </span>

      {/* 타입 이모지 + 값 */}
      <div className="flex items-center gap-2">
        <span className="text-lg">
          {variable.type.includes('String') ? '📝' :
           variable.type.includes('[]') ? '📋' : '📦'}
        </span>
        <span
          className="font-mono font-semibold text-sm"
          style={{ color: colors.text }}
        >
          {displayValue}
        </span>
      </div>

      {/* 타입 */}
      <span
        className="absolute -bottom-2 right-3 px-1.5 rounded text-[10px]"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        }}
      >
        {variable.type}
      </span>
    </div>
  );
});

// ============================================
// FrameCard 컴포넌트
// ============================================

interface FrameCardProps {
  frame: FlowFrame;
  variables: FlowVariable[];
  hoveredRef: string | null;
  onHover: (ref: string | null) => void;
  isActive?: boolean;
  prevStep?: FlowStep | null;
}

const FrameCard = memo(function FrameCard({
  frame,
  variables,
  hoveredRef,
  onHover,
  isActive,
  prevStep,
}: FrameCardProps) {
  const colors = getFrameColor(frame.name);
  const isHeap = frame.name === 'heap';

  // 변경된 변수 ID 목록
  const prevVarIds = new Set(prevStep?.variables.map(v => v.id) || []);
  const prevVarValues = new Map(prevStep?.variables.map(v => [v.id, v.value]) || []);

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
        <span className="text-sm">
          {isHeap ? '📦' : frame.name === 'main' ? '▶' : '→'}
        </span>
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: colors.label }}
        >
          {isHeap ? 'Heap (객체들)' : `${frame.name}()`}
        </span>
        {isActive && (
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded bg-blue-500 text-white">
            실행 중
          </span>
        )}
      </div>

      {/* 변수들 */}
      <div className="p-4 flex flex-wrap gap-4 min-h-[60px]">
        {variables.length > 0 ? (
          variables.map((variable) => {
            const isNew = !prevVarIds.has(variable.id);
            const isUpdated = prevVarValues.get(variable.id) !== variable.value;
            const isHighlighted = hoveredRef != null && (
              variable.pointsTo === hoveredRef ||
              variable.id === hoveredRef
            );

            return isHeap ? (
              <HeapObjectCard
                key={variable.id}
                variable={variable}
                isHighlighted={isHighlighted}
                onHover={onHover}
              />
            ) : (
              <VariableCard
                key={variable.id}
                variable={variable}
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
  // 호버 상태 (연결된 요소 하이라이트용)
  const [hoveredRef, setHoveredRef] = useState<string | null>(null);

  const handleHover = useCallback((ref: string | null) => {
    setHoveredRef(ref);
  }, []);

  // 프레임별 변수 분류
  const { frameData, heapVariables } = useMemo(() => {
    const frames: Array<{ frame: FlowFrame; variables: FlowVariable[] }> = [];
    const heap: FlowVariable[] = [];

    // 프레임 기반 정리
    if (step.frames && step.frames.length > 0) {
      step.frames.forEach((frame) => {
        if (frame.name === 'heap' || frame.name === 'Objects (Heap)') {
          // Heap 변수들
          frame.variableIds.forEach((varId) => {
            const v = step.variables.find((sv) => sv.id === varId);
            if (v) heap.push(v);
          });
        } else {
          // Stack 프레임
          const frameVars = frame.variableIds
            .map((varId) => step.variables.find((sv) => sv.id === varId))
            .filter((v): v is FlowVariable => v != null);

          if (frameVars.length > 0 || frame.name === 'main') {
            frames.push({ frame, variables: frameVars });
          }
        }
      });
    } else {
      // 프레임이 없으면 scope 기반 분류
      step.variables.forEach((v) => {
        if (v.scope === 'heap' || v.scope === 'objects') {
          heap.push(v);
        }
      });

      // main 프레임 생성
      const stackVars = step.variables.filter(
        (v) => v.scope !== 'heap' && v.scope !== 'objects'
      );
      if (stackVars.length > 0) {
        frames.push({
          frame: { name: 'main', variableIds: stackVars.map((v) => v.id) },
          variables: stackVars,
        });
      }
    }

    return { frameData: frames, heapVariables: heap };
  }, [step]);

  // 마지막 프레임이 활성
  const activeFrameName = frameData.length > 0
    ? frameData[frameData.length - 1].frame.name
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
        <span>Java 메모리: 변수를 호버하면 연결된 객체가 반짝여요</span>
      </div>

      {/* Stack 프레임들 (역순 - 최근 호출이 위) */}
      <div className="flex flex-col gap-4">
        {frameData.slice().reverse().map(({ frame, variables }) => (
          <FrameCard
            key={frame.name}
            frame={frame}
            variables={variables}
            hoveredRef={hoveredRef}
            onHover={handleHover}
            isActive={frame.name === activeFrameName}
            prevStep={prevStep}
          />
        ))}

        {/* Heap */}
        {heapVariables.length > 0 && (
          <FrameCard
            frame={{ name: 'heap', variableIds: heapVariables.map((v) => v.id) }}
            variables={heapVariables}
            hoveredRef={hoveredRef}
            onHover={handleHover}
            prevStep={prevStep}
          />
        )}
      </div>

      {/* 빈 상태 */}
      {frameData.length === 0 && heapVariables.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">☕</span>
          <p>아직 생성된 변수가 없어요</p>
          <p className="text-sm">코드가 실행되면 여기에 변수들이 나타납니다</p>
        </div>
      )}

      {/* 터미널 출력 */}
      {step.terminalOutput?.text && (
        <div className="mt-6 p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
          <div className="text-xs text-gray-500 mb-1">출력:</div>
          <pre className="whitespace-pre-wrap">{step.terminalOutput.text}</pre>
        </div>
      )}

      {/* 범례 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }} />
            <span>숫자</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#d1fae5', border: '1px solid #10b981' }} />
            <span>String</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ffedd5', border: '1px solid #f97316' }} />
            <span>배열</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f3e8ff', border: '1px solid #a855f7' }} />
            <span>객체</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>참조 연결</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default JavaFlowView;
