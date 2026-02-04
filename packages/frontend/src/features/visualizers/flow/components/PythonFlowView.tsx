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
    bg: 'bg-green-50 dark:bg-green-900 bg-opacity-20',
    border: 'border-green-400',
    badge: 'bg-green-100 text-green-700',
  },
  immutable: {
    bg: 'bg-purple-50 dark:bg-purple-900 bg-opacity-20',
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
    bg: 'bg-blue-100 dark:bg-blue-900 bg-opacity-30',
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
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-lg z-10"
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
// FrameCard 컴포넌트 (함수 프레임 박스)
// ============================================

interface FrameCardProps {
  name: string;
  objects: ObjectWithNames[];
  isNew?: boolean;
  isActive?: boolean;
  prevStep?: FlowStep | null;
}

const FRAME_COLORS: Record<string, { bg: string; border: string; header: string; label: string }> = {
  global: {
    bg: 'bg-slate-50 dark:bg-slate-800 bg-opacity-50',
    border: 'border-slate-300 dark:border-slate-600',
    header: 'bg-slate-200 dark:bg-slate-700',
    label: 'text-slate-700 dark:text-slate-300',
  },
  function: {
    bg: 'bg-blue-50 dark:bg-blue-900 bg-opacity-30',
    border: 'border-blue-400 dark:border-blue-500',
    header: 'bg-blue-200 dark:bg-blue-800',
    label: 'text-blue-800 dark:text-blue-200',
  },
  heap: {
    bg: 'bg-amber-50 dark:bg-amber-900 bg-opacity-20',
    border: 'border-amber-400 dark:border-amber-500',
    header: 'bg-amber-200 dark:bg-amber-800',
    label: 'text-amber-800 dark:text-amber-200',
  },
};

const FrameCard = memo(function FrameCard({
  name,
  objects,
  isNew,
  isActive,
  prevStep,
}: FrameCardProps) {
  // 프레임 타입에 따른 색상
  const frameType = name === 'global' ? 'global' : 'function';
  const colors = FRAME_COLORS[frameType];

  // 프레임 아이콘
  const getFrameIcon = () => {
    if (name === 'global') return '🌐';
    return '→';
  };

  // 표시 이름 (global은 괄호 없이)
  const displayName = name === 'global' ? 'global' : `${name}()`;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, scale: 0.9, y: -20 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`
        rounded-lg overflow-hidden border-2
        ${colors.bg} ${colors.border}
        ${isActive ? 'ring-2 ring-blue-400 shadow-lg' : 'shadow-sm'}
      `}
    >
      {/* 프레임 헤더 */}
      <div className={`flex items-center gap-2 px-3 py-2 ${colors.header}`}>
        <span className="text-sm">{getFrameIcon()}</span>
        <span className={`font-mono text-sm font-semibold ${colors.label}`}>
          {displayName}
        </span>
        {isActive && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto text-xs px-1.5 py-0.5 rounded bg-blue-500 text-white"
          >
            실행 중
          </motion.span>
        )}
      </div>

      {/* 프레임 내용 */}
      <div className="p-3">
        {objects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {objects.map(({ object, names }) => {
                const isObjNew = prevStep
                  ? !prevStep.variables.some(v => v.id === object.id)
                  : false;
                const prevObject = prevStep?.variables.find(v => v.id === object.id);
                const isUpdated = prevObject && prevObject.value !== object.value;

                return (
                  <ObjectCard
                    key={object.id}
                    object={object}
                    names={names}
                    isNew={isObjNew}
                    isUpdated={isUpdated}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <span className="text-sm text-gray-400 italic">(비어 있음)</span>
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
  // 변수 ID → 변수 맵
  const variableMap = useMemo(() => {
    const map = new Map<string, FlowVariable>();
    step.variables.forEach((v) => map.set(v.id, v));
    return map;
  }, [step.variables]);

  // 객체와 이름 분류
  const { objectMap, namesByObject } = useMemo(() => {
    const objMap = new Map<string, FlowVariable>();
    const namesMap = new Map<string, FlowVariable[]>();

    step.variables.forEach((variable) => {
      if (variable.scope === 'objects') {
        objMap.set(variable.id, variable);
      } else if (variable.pointsTo) {
        const names = namesMap.get(variable.pointsTo) || [];
        names.push(variable);
        namesMap.set(variable.pointsTo, names);
      }
    });

    return { objectMap: objMap, namesByObject: namesMap };
  }, [step.variables]);

  // step.frames 기반 프레임 데이터 구성 (PyTransformer가 callStack→frames 변환 완료)
  const frameData = useMemo(() => {
    const result: Array<{
      name: string;
      objects: ObjectWithNames[];
      isNew: boolean;
      isActive: boolean;
    }> = [];

    // step.frames에서 각 프레임의 객체 + 이름 조합
    step.frames.forEach((frame, index) => {
      const frameObjects: ObjectWithNames[] = [];
      const addedObjectIds = new Set<string>();

      // 프레임의 변수(이름)들이 가리키는 객체 수집
      frame.variableIds.forEach((varId) => {
        const nameVar = variableMap.get(varId);
        if (nameVar?.pointsTo) {
          const objVar = objectMap.get(nameVar.pointsTo);
          if (objVar && !addedObjectIds.has(objVar.id)) {
            addedObjectIds.add(objVar.id);
            const allNames = namesByObject.get(objVar.id) || [];
            // 이 프레임에 속한 이름만 필터
            const frameNames = allNames.filter((n) =>
              frame.variableIds.includes(n.id)
            );
            frameObjects.push({ object: objVar, names: frameNames });
          }
        }
      });

      // 이전 스텝에 없던 프레임이면 새로 생성
      const isNew = prevStep
        ? !prevStep.frames?.some((f) => f.name === frame.name)
        : false;

      // 마지막 프레임이 활성 (가장 최근 호출)
      const isActive = index === step.frames.length - 1;

      result.push({
        name: frame.name,
        objects: frameObjects,
        isNew,
        isActive,
      });
    });

    return result;
  }, [step.frames, variableMap, objectMap, namesByObject, prevStep]);

  // 함수 프레임이 있는 경우 (global 외에 추가 프레임 존재)
  const hasFrames = step.frames.length > 1;

  return (
    <div className={`python-flow-view p-4 ${className}`}>
      {/* 헤더 */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>🐍</span>
        <span>
          {hasFrames
            ? 'Python 콜스택: 함수 호출 시 새 프레임이 생성됩니다'
            : 'Python 메모리: 이름표(포스트잇)가 값에 붙어있어요'}
        </span>
      </div>

      {/* 프레임들 (콜스택 역순 - 최근 호출이 위) */}
      <div className="flex flex-col-reverse gap-4">
        <AnimatePresence mode="popLayout">
          {frameData.map((frame) => (
            <FrameCard
              key={frame.name}
              name={frame.name}
              objects={frame.objects}
              isNew={frame.isNew}
              isActive={frame.isActive}
              prevStep={prevStep}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 빈 상태 */}
      {frameData.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <span className="text-4xl mb-2 block">🌱</span>
          <p>아직 생성된 값이 없어요</p>
          <p className="text-sm">코드가 실행되면 여기에 값들이 나타납니다</p>
        </div>
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
          {hasFrames && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-200 border border-blue-400" />
              <span>함수 프레임</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PythonFlowView;
