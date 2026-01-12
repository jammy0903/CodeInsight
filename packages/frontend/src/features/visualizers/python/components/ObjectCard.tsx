/**
 * ObjectCard - Python 객체 시각화 카드
 * 타입별로 다른 렌더링 (int, str, list, tuple 등)
 */

import { motion } from 'framer-motion';
import type { PyObject, PyObjectRef } from '@/types/py-simulator';
import { getTypeColor, isMutableType, CHANGE_COLORS } from '../constants';

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
  const colors = getTypeColor(object.type);
  const mutable = isMutableType(object.type);

  return (
    <motion.div
      data-object-id={object.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-lg p-3 min-w-[80px]"
      style={{
        backgroundColor: isHighlighted ? CHANGE_COLORS.bg : colors.bg,
        border: `2px solid ${isHighlighted ? CHANGE_COLORS.border : colors.border}`,
        boxShadow: isHighlighted
          ? CHANGE_COLORS.glow
          : isReferenced
            ? `0 0 8px ${colors.border}`
            : 'none',
      }}
    >
      {/* 객체 ID */}
      <div
        className="text-[10px] font-mono mb-1 opacity-60"
        style={{ color: colors.text }}
      >
        {object.id}
      </div>

      {/* 타입 + 뮤터블 표시 */}
      <div className="flex items-center gap-1 mb-2">
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: colors.border,
            color: 'white',
          }}
        >
          {object.type}
        </span>
        {mutable && (
          <span className="text-[9px] text-orange-500">(mutable)</span>
        )}
      </div>

      {/* 값 렌더링 */}
      <div className="font-mono text-sm" style={{ color: colors.text }}>
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
      return <span className="text-gray-400 italic">None</span>;

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

  if (items.length === 0) {
    return <span className="text-gray-400">{brackets}</span>;
  }

  // objectId → 실제 객체 값 찾기
  const getObjectValue = (objectId: string): string => {
    const obj = allObjects.find((o) => o.id === objectId);
    if (!obj) return '?';
    return String(obj.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span>{open}</span>
      {items.map((item, idx) => {
        const objId = item.objectId.replace('obj_', '');
        const objValue = getObjectValue(item.objectId);
        return (
          <span key={idx} className="flex items-center">
            <span
              className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
              title={`→ ${item.objectId}: ${objValue}`}
            >
              →{objId}({objValue})
            </span>
            {idx < items.length - 1 && <span className="text-gray-400">,</span>}
          </span>
        );
      })}
      <span>{close}</span>
    </div>
  );
}

/** 문자열 자르기 */
function truncateString(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
