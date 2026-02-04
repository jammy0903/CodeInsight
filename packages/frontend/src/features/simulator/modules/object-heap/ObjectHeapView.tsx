/**
 * ObjectHeapView - 힙 객체 시각화
 *
 * Python/Java/JS 힙 위의 객체를 카드로 표시.
 * 타입별 색상: mutable(초록), immutable(보라), 기본(파랑).
 */

import { motion } from 'framer-motion';
import { useObjectHeapStore } from './store';

/** Python 불변 타입 목록 */
const IMMUTABLE_TYPES = new Set([
  'int', 'float', 'str', 'bool', 'NoneType', 'tuple', 'frozenset',
]);

function getTypeColor(type: string, mutable?: boolean): { bg: string; border: string; text: string } {
  // 명시적 mutable 필드가 있으면 우선
  if (mutable === true) {
    return { bg: 'rgba(74, 222, 128, 0.1)', border: '#4ade80', text: '#4ade80' };
  }
  if (mutable === false || IMMUTABLE_TYPES.has(type)) {
    return { bg: 'rgba(167, 139, 250, 0.1)', border: '#a78bfa', text: '#a78bfa' };
  }
  // 기본 (mutable로 간주)
  return { bg: 'rgba(74, 222, 128, 0.1)', border: '#4ade80', text: '#4ade80' };
}

/** 타입별 이모지 */
function getTypeEmoji(type: string): string {
  switch (type) {
    case 'int':
    case 'float': return '\uD83D\uDD22';
    case 'str': return '\uD83D\uDCDD';
    case 'bool': return '\u2713';
    case 'NoneType': return '\u2205';
    case 'list': return '\uD83D\uDCCB';
    case 'tuple': return '\uD83D\uDD12';
    case 'dict': return '\uD83D\uDDC2\uFE0F';
    case 'set': return '\uD83D\uDD73\uFE0F';
    case 'function': return '\u0192';
    case 'class': return '\uD83C\uDFED';
    case 'instance': return '\uD83D\uDCE6';
    default: return '\uD83D\uDCE6';
  }
}

/** 값을 표시 문자열로 변환 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length <= 5) return `[${value.join(', ')}]`;
    return `[${value.slice(0, 3).join(', ')}, ... +${value.length - 3}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length <= 3) {
      return `{${entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ')}}`;
    }
    return `{${entries.slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(', ')}, ...}`;
  }
  return String(value);
}

export function ObjectHeapView() {
  const objects = useObjectHeapStore((s) => s.objects);

  if (objects.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#8b949e',
          fontSize: '12px',
        }}
      >
        No objects in heap
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {objects.map((obj) => {
        const color = getTypeColor(obj.type, obj.mutable);
        return (
          <motion.div
            key={obj.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${obj.highlight ? '#facc15' : color.border}`,
              backgroundColor: obj.highlight ? 'rgba(250, 204, 21, 0.1)' : color.bg,
              fontFamily: 'monospace',
              fontSize: '12px',
              transition: 'all 0.3s ease',
            }}
          >
            {/* 타입 이모지 */}
            <span style={{ fontSize: '14px', flexShrink: 0 }}>
              {getTypeEmoji(obj.type)}
            </span>

            {/* 객체 ID */}
            <span
              style={{
                fontSize: '10px',
                color: '#8b949e',
                backgroundColor: 'rgba(110, 118, 129, 0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
                flexShrink: 0,
              }}
            >
              {obj.id}
            </span>

            {/* 타입 */}
            <span
              style={{
                fontSize: '11px',
                color: color.text,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {obj.type}
            </span>

            {/* 값 */}
            <span
              style={{
                color: '#e6edf3',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {formatValue(obj.value)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
