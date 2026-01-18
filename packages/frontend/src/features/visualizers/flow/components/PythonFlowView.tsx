/**
 * PythonFlowView Component
 *
 * Python 전용 Flow 시각화 - "포스트잇 비유"
 *
 * 컨셉:
 * - 값(객체)이 주인공, 변수명은 그 위에 붙은 포스트잇
 * - 화살표 없이 직관적으로 "이름 → 값" 관계 표현
 * - 같은 객체를 가리키면 포스트잇이 나란히 표시
 */

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';

// ============================================
// 타입 정의
// ============================================

interface PythonFlowViewProps {
  step: FlowStep;
  prevStep?: FlowStep | null;
  className?: string;
}

interface ObjectWithNames {
  object: FlowVariable;
  names: FlowVariable[];
}

// ============================================
// 상수
// ============================================

// 타입별 이모지
const TYPE_EMOJI: Record<string, string> = {
  int: '🔢',
  float: '🔢',
  str: '📝',
  bool: '✓',
  NoneType: '∅',
  list: '📋',
  tuple: '📦',
  dict: '🗂️',
  set: '🎯',
  function: '⚙️',
  class: '🏛️',
  instance: '🧩',
};

// Mutable 타입
const MUTABLE_TYPES = new Set(['list', 'dict', 'set', 'instance']);

// 색상
const COLORS = {
  mutable: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-400',
    badge: 'bg-green-100 text-green-700',
  },
  immutable: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-400',
    badge: 'bg-purple-100 text-purple-700',
  },
  stickyNote: {
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    text: 'text-amber-900',
    shadow: 'shadow-amber-200',
  },
  highlight: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-500',
    ring: 'ring-2 ring-blue-400',
  },
};

// ============================================
// 유틸리티 함수
// ============================================

function getTypeEmoji(type: string): string {
  return TYPE_EMOJI[type] || '📦';
}

function isMutable(type: string): boolean {
  return MUTABLE_TYPES.has(type);
}

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return 'None';
  if (type === 'str') return `"${value}"`;
  if (type === 'bool') return value === true || value === 'True' ? 'True' : 'False';
  return String(value);
}

// ============================================
// ObjectCard 컴포넌트 (컴팩트 디자인)
// ============================================

interface ObjectCardProps {
  object: FlowVariable;
  names: FlowVariable[];
  isNew?: boolean;
  isUpdated?: boolean;
}

const ObjectCard = memo(function ObjectCard({ object, names, isNew, isUpdated }: ObjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mutable = isMutable(object.type);
  const colorSet = mutable ? COLORS.mutable : COLORS.immutable;
  const emoji = getTypeEmoji(object.type);
  const displayValue = formatValue(object.value, object.type);

  // 단순 타입만 이모지 표시
  const isSimpleType = ['int', 'float', 'str', 'bool', 'NoneType'].includes(object.type);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative px-3 py-2 rounded-lg border-2 cursor-pointer
        ${colorSet.bg} ${colorSet.border}
        ${isUpdated ? COLORS.highlight.ring : ''}
        shadow-sm
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 호버 시 클래스명 오버레이 (단순 타입 제외) */}
      {isHovered && !isSimpleType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg z-10"
        >
          <span className="text-white font-bold text-sm">
            {object.type}
          </span>
        </motion.div>
      )}

      {/* 컴팩트 레이아웃: 값 + 포스트잇 한 줄 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 값 */}
        <motion.span
          key={displayValue}
          initial={isUpdated ? { scale: 1.1, color: '#3b82f6' } : false}
          animate={{ scale: 1, color: 'inherit' }}
          className={`font-mono font-semibold ${isSimpleType ? 'text-lg' : 'text-xs'}`}
        >
          {isSimpleType && <span className="mr-1">{emoji}</span>}
          {displayValue}
        </motion.span>

        {/* 포스트잇들 (변수 이름) - 인라인 */}
        {names.length > 0 && (
          <div className="flex gap-1">
            {names.map((nameVar) => (
              <span
                key={nameVar.id}
                className={`
                  px-2 py-0.5 rounded text-xs font-mono font-bold
                  ${COLORS.stickyNote.bg} ${COLORS.stickyNote.text}
                  border-b-2 ${COLORS.stickyNote.border}
                  ${nameVar.state === 'updating' ? COLORS.highlight.ring : ''}
                `}
              >
                {nameVar.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// PythonFlowView 메인 컴포넌트
// ============================================

export const PythonFlowView = memo(function PythonFlowView({
  step,
  prevStep,
  className = '',
}: PythonFlowViewProps) {
  // 객체별로 이름 그룹화
  const objectsWithNames = useMemo(() => {
    const result: ObjectWithNames[] = [];
    const objectMap = new Map<string, FlowVariable>();
    const namesByObject = new Map<string, FlowVariable[]>();

    // 1. 객체와 이름 분류
    step.variables.forEach((variable) => {
      if (variable.scope === 'objects') {
        objectMap.set(variable.id, variable);
      } else if (variable.pointsTo) {
        const names = namesByObject.get(variable.pointsTo) || [];
        names.push(variable);
        namesByObject.set(variable.pointsTo, names);
      }
    });

    // 2. 객체 + 연결된 이름들 조합
    objectMap.forEach((object, objectId) => {
      const names = namesByObject.get(objectId) || [];
      result.push({ object, names });
    });

    // DEBUG
    if (import.meta.env.DEV) {
      console.log('[PythonFlowView] 📊 objects with names:', result.map(o => ({
        value: o.object.value,
        names: o.names.map(n => n.name),
      })));
    }

    return result;
  }, [step.variables]);

  // 터미널 출력
  const terminalOutput = step.terminalOutput?.text;

  return (
    <div className={`python-flow-view p-4 ${className}`}>
      {/* 헤더 */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>🐍</span>
        <span>Python 메모리: 이름표(포스트잇)가 값에 붙어있어요</span>
      </div>

      {/* 객체 카드들 - 컴팩트 플렉스 레이아웃 */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {objectsWithNames.map(({ object, names }) => {
            const isNew = prevStep
              ? !prevStep.variables.some(v => v.id === object.id)
              : false;
            const prevObject = prevStep?.variables.find(v => v.id === object.id);
            const isUpdated = prevObject && prevObject.value !== object.value;

            return (
              <ObjectCard
                key={object.id}
                object={object}
                names={names}
                isNew={isNew}
                isUpdated={isUpdated}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* 빈 상태 */}
      {objectsWithNames.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">🌱</span>
          <p>아직 생성된 값이 없어요</p>
          <p className="text-sm">코드가 실행되면 여기에 값들이 나타납니다</p>
        </div>
      )}

      {/* 터미널 출력 */}
      {terminalOutput && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-sm"
        >
          <div className="text-xs text-gray-500 mb-1">출력:</div>
          <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
        </motion.div>
      )}

      {/* 범례 */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${COLORS.stickyNote.bg} ${COLORS.stickyNote.border} border`} />
            <span>이름표 (변수)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${COLORS.immutable.bg} ${COLORS.immutable.border} border`} />
            <span>불변 (int, str...)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${COLORS.mutable.bg} ${COLORS.mutable.border} border`} />
            <span>가변 (list, dict...)</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PythonFlowView;
