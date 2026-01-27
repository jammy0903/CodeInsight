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
  /** 원본 LessonStep (callStack 등 접근용) */
  rawStep?: unknown;
  rawPrevStep?: unknown;
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
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-300 dark:border-slate-600',
    header: 'bg-slate-200 dark:bg-slate-700',
    label: 'text-slate-700 dark:text-slate-300',
  },
  function: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-500',
    header: 'bg-blue-200 dark:bg-blue-800',
    label: 'text-blue-800 dark:text-blue-200',
  },
  heap: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
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
  rawStep,
  rawPrevStep,
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

  // 콜스택 데이터 (시뮬레이터에서 직접 제공 - rawStep에서 가져옴)
  const callStack = (rawStep as any)?.callStack as Array<{
    functionName: string;
    depth: number;
    localNames: Array<{ name: string; scope?: string; pointsTo: string }>;
  }> | undefined;

  // 프레임별 객체 그룹화
  const frameData = useMemo(() => {
    const result: Array<{
      name: string;
      objects: ObjectWithNames[];
      isNew: boolean;
      isActive: boolean;
    }> = [];

    // 1. Global/Main 프레임 - global 스코프의 변수들
    const globalObjects: ObjectWithNames[] = [];
    objectMap.forEach((object, objectId) => {
      const names = namesByObject.get(objectId) || [];
      const globalNames = names.filter((n) => n.scope === 'global' || !n.scope);

      if (globalNames.length > 0) {
        globalObjects.push({ object, names: globalNames });
      }
    });

    // global 프레임은 항상 표시
    result.push({
      name: 'global',
      objects: globalObjects,
      isNew: false,
      isActive: !callStack?.length, // 콜스택 없으면 global이 활성
    });

    // 2. 콜스택이 있으면 함수 프레임들 추가
    if (callStack && callStack.length > 0) {
      // depth 순서로 정렬 (낮은 것이 먼저 = 먼저 호출된 함수)
      const sortedStack = [...callStack].sort((a, b) => a.depth - b.depth);

      sortedStack.forEach((frame, index) => {
        const frameObjects: ObjectWithNames[] = [];

        // 프레임의 로컬 변수들
        frame.localNames.forEach((localName) => {
          // 해당 로컬 변수가 가리키는 객체 찾기
          const targetObjVar = variableMap.get(`obj-${localName.pointsTo}`);
          if (targetObjVar) {
            const allNames = namesByObject.get(targetObjVar.id) || [];
            const localNames = allNames.filter((n) =>
              n.scope === frame.functionName || n.name === localName.name
            );
            if (!frameObjects.some(fo => fo.object.id === targetObjVar.id)) {
              frameObjects.push({ object: targetObjVar, names: localNames });
            }
          }
        });

        // 이전 스텝에 없던 프레임이면 새로 생성
        const prevCallStack = (rawPrevStep as any)?.callStack as typeof callStack;
        const isNew = !prevCallStack?.some((f) => f.functionName === frame.functionName);

        // 마지막 프레임(가장 최근 호출)이 활성
        const isActive = index === sortedStack.length - 1;

        result.push({
          name: frame.functionName,
          objects: frameObjects,
          isNew,
          isActive,
        });
      });
    }

    // Objects (Heap) 프레임 제거 - global + 함수 프레임만 표시

    return result;
  }, [step, callStack, variableMap, objectMap, namesByObject, prevStep]);

  // 터미널 출력
  const terminalOutput = step.terminalOutput?.text;

  // 콜스택에 함수 호출이 있는 경우
  const hasFrames = callStack && callStack.length > 0;

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
