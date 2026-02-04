/**
 * MemoryBlockRow - 메모리 블록 한 줄 표시
 *
 * CMemoryView에서 추출한 공유 컴포넌트.
 * stack-frame, heap-memory 모듈에서 재사용.
 */

import { motion } from 'framer-motion';
import type { MemoryBlock } from './types';

interface MemoryBlockRowProps {
  block: MemoryBlock;
  isChanged: boolean;
}

export function MemoryBlockRow({ block, isChanged }: MemoryBlockRowProps) {
  const highlighted = isChanged || block.highlight;

  // 포인터 타입 감지
  const isFunctionPointer =
    block.type === 'function_pointer' || block.type.toLowerCase().includes('function');
  const isDoublePointer = block.type.includes('**');

  let pointerIcon: string | null = null;
  let pointerColor: string | null = null;

  if (isFunctionPointer) {
    pointerIcon = '\u26A1';
    pointerColor = '#a855f7';
  } else if (isDoublePointer) {
    pointerIcon = '\uD83D\uDD17\uD83D\uDD17';
    pointerColor = '#f59e0b';
  } else if (block.type.includes('*') || block.points_to) {
    pointerIcon = '\u27A4';
    pointerColor = '#3b82f6';
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        border: `1px solid ${highlighted ? '#facc15' : 'var(--theme-memory-card-border, #30363d)'}`,
        backgroundColor: highlighted ? 'rgba(250, 204, 21, 0.25)' : 'var(--theme-memory-card-bg, rgba(13, 17, 23, 0.6))',
        transition: 'all 0.3s ease',
      }}
    >
      {pointerIcon && (
        <span
          style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0 }}
          title={
            isFunctionPointer
              ? 'Function Pointer'
              : isDoublePointer
              ? 'Double Pointer'
              : 'Pointer'
          }
        >
          {pointerIcon}
        </span>
      )}

      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          fontWeight: 600,
          color: pointerColor || 'var(--theme-memory-card-text, #e6edf3)',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {block.name}
      </span>

      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--theme-memory-card-muted, #8b949e)',
          padding: '3px 6px',
          backgroundColor: 'rgba(110, 118, 129, 0.2)',
          borderRadius: '4px',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {block.address}
      </span>

      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: 'var(--theme-memory-card-text, #e6edf3)',
          fontWeight: 700,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {block.value}
      </span>

      {block.points_to && (
        <span
          style={{
            fontSize: '11px',
            color: pointerColor || '#fb923c',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          \u2192 {block.points_to}
        </span>
      )}
    </motion.div>
  );
}
