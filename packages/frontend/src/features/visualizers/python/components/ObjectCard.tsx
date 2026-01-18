/**
 * ObjectCard - Python 객체 시각화 카드
 * 컴팩트 디자인 + 호버 시 타입 오버레이
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PyObject, PyObjectRef } from '@/types/py-simulator';
import { getTypeColor, isMutableType, CHANGE_COLORS } from '../constants';

// 단순 타입 (이모지 표시용)
const SIMPLE_TYPES = ['int', 'float', 'str', 'bool', 'NoneType'];
const TYPE_EMOJI: Record<string, string> = {
  int: '🔢',
  float: '🔢',
  str: '📝',
  bool: '✓',
  NoneType: '∅',
};

interface ObjectCardProps {
  object: PyObject;
  allObjects?: PyObject[];
  isHighlighted?: boolean;
  isReferenced?: boolean;
  refCount?: number;
}

export function ObjectCard({
  object,
  allObjects = [],
  isHighlighted = false,
  isReferenced = false,
  refCount,
}: ObjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = getTypeColor(object.type);
  const isSimpleType = SIMPLE_TYPES.includes(object.type);
  const emoji = TYPE_EMOJI[object.type] || '';

  return (
    <motion.div
      data-object-id={object.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-lg px-3 py-2 cursor-pointer"
      style={{
        backgroundColor: isHighlighted ? CHANGE_COLORS.bg : colors.bg,
        border: `2px solid ${isHighlighted ? CHANGE_COLORS.border : colors.border}`,
        boxShadow: isHighlighted
          ? CHANGE_COLORS.glow
          : isReferenced
            ? `0 0 8px ${colors.border}`
            : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 호버 시 타입명 오버레이 (단순 타입 제외) */}
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

      {/* 값 렌더링 (컴팩트) */}
      <div
        className={`font-mono font-semibold ${isSimpleType ? 'text-base' : 'text-xs'}`}
        style={{ color: colors.text }}
      >
        {isSimpleType && emoji && <span className="mr-1">{emoji}</span>}
        <ObjectValue object={object} allObjects={allObjects} />
      </div>

      {/* 참조 카운트 (옵션) */}
      {refCount !== undefined && refCount > 1 && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: colors.border }}
        >
          {refCount}
        </div>
      )}
    </motion.div>
  );
}

/** 객체 값 렌더링 */
function ObjectValue({ object, allObjects }: { object: PyObject; allObjects: PyObject[] }) {
  const { type, value } = object;

  switch (type) {
    case 'int':
    case 'float':
      return <span>{String(value)}</span>;

    case 'str':
      return (
        <span className="text-amber-700">
          "{truncateString(String(value), 20)}"
        </span>
      );

    case 'bool':
      return (
        <span className={value ? 'text-green-600' : 'text-red-600'}>
          {value ? 'True' : 'False'}
        </span>
      );

    case 'NoneType':
      return <span className="text-[var(--theme-dashboard-text-muted)] italic">None</span>;

    case 'list':
      return <CollectionValue items={value as PyObjectRef[]} brackets="[]" allObjects={allObjects} />;

    case 'tuple':
      return <CollectionValue items={value as PyObjectRef[]} brackets="()" allObjects={allObjects} />;

    default:
      return <span>{String(value)}</span>;
  }
}

/** 컬렉션 값 렌더링 (list, tuple) */
function CollectionValue({
  items,
  brackets,
  allObjects,
}: {
  items: PyObjectRef[];
  brackets: '[]' | '()';
  allObjects: PyObject[];
}) {
  const [open, close] = brackets.split('');

  // items가 배열이 아니면 문자열로 표시
  if (!Array.isArray(items)) {
    return <span className="text-[var(--theme-dashboard-text-muted)]">{String(items) || brackets}</span>;
  }

  if (items.length === 0) {
    return <span className="text-[var(--theme-dashboard-text-muted)]">{brackets}</span>;
  }

  // objectId → 실제 객체 값 찾기
  const getObjectValue = (objectId: string): string => {
    const obj = allObjects.find((o) => o.id === objectId);
    if (!obj) return '?';
    return String(obj.value);
  };

  // 값들만 간단히 표시
  const values = items.map((item) => getObjectValue(item.objectId));

  return (
    <span>
      {open}{values.join(', ')}{close}
    </span>
  );
}

/** 문자열 자르기 */
function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
