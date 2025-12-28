/**
 * MemorySegment
 * 메모리 세그먼트 컴포넌트 (CODE, DATA, HEAP, STACK)
 * 포인터 하이라이트 지원 + Xarrow ID + 역할 라벨 + 행 구분선
 */

import { motion } from 'framer-motion';
import type { SegmentType, MemoryBlock } from '../types';
import { SEGMENT_COLORS, getRoleLabel, SEGMENT_DESCRIPTIONS, PULSE_VARIANTS } from '../constants';
import { toBlockId } from '../utils';

// 포인터 색상 타입
type PointerColorSet = { main: string; bg: string; border: string; glow: string } | null;

interface MemorySegmentProps {
  type: SegmentType;
  label: string;
  blocks?: MemoryBlock[];
  onClick?: () => void;
  className?: string;
  // 포인터 하이라이트 props
  onPointerClick?: (e: React.MouseEvent, block: MemoryBlock) => void;
  isBlockHighlighted?: (block: MemoryBlock) => boolean;
  getBlockColor?: (block: MemoryBlock) => PointerColorSet;
}

export function MemorySegment({
  type,
  label,
  blocks = [],
  onClick,
  className = '',
  onPointerClick,
  isBlockHighlighted,
  getBlockColor,
}: MemorySegmentProps) {
  const colors = SEGMENT_COLORS[type];
  const hasBlocks = blocks.length > 0;
  const isStaticSegment = type === 'data' || type === 'code';

  return (
    <motion.div
      className={`relative rounded-lg overflow-hidden cursor-pointer ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      {/* Header */}
      <div
        className="px-3 py-1.5 flex items-center justify-between"
        style={{ backgroundColor: colors.headerBg }}
      >
        <span
          className="text-base font-bold uppercase tracking-wider"
          style={{ color: colors.main }}
        >
          {label}
        </span>
        {hasBlocks && (
          <span className="text-sm text-muted-foreground">
            {blocks.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className={`p-2 ${isStaticSegment && !hasBlocks ? '' : 'min-h-[40px]'}`}>
        {hasBlocks ? (
          // 블록이 있을 때: 행별로 구분선
          <div className="flex flex-col divide-y divide-border/30">
            {blocks.slice(0, 3).map((block) => {
              const hasPointer = !!block.points_to;
              const highlighted = isBlockHighlighted?.(block) ?? false;
              const ptrColor = getBlockColor?.(block);
              const roleLabel = getRoleLabel(block.type, type);

              return (
                <motion.div
                  key={block.address}
                  id={toBlockId(block.address)}
                  className="grid items-center gap-2 py-1.5"
                  style={{ gridTemplateColumns: '30% 1fr 18%' }}
                  variants={PULSE_VARIANTS}
                  animate={highlighted ? 'pulse' : 'idle'}
                  onClick={(e) => {
                    if (hasPointer && onPointerClick) {
                      onPointerClick(e, block);
                    }
                  }}
                >
                  {/* Role label */}
                  <div className="text-center text-muted-foreground font-mono text-xs">
                    {roleLabel}
                  </div>
                  {/* Name + Value */}
                  <div
                    className="flex items-center justify-center gap-2 px-2 py-1 rounded text-sm"
                    style={{
                      backgroundColor: highlighted && ptrColor ? ptrColor.bg : 'rgba(0,0,0,0.2)',
                      border: highlighted && ptrColor ? `2px solid ${ptrColor.border}` : '2px solid transparent',
                      cursor: hasPointer ? 'pointer' : 'default',
                    }}
                  >
                    <span className="font-medium truncate" style={{ color: colors.main }}>
                      {block.name}
                      {hasPointer && ptrColor && <span style={{ color: ptrColor.main }}> →</span>}
                    </span>
                    <span className="text-muted-foreground text-xs">= {block.value}</span>
                  </div>
                  {/* Address */}
                  <div className="font-mono text-muted-foreground text-center text-xs">
                    {block.address.slice(-4)}
                  </div>
                </motion.div>
              );
            })}
            {blocks.length > 3 && (
              <div className="text-sm text-muted-foreground text-center py-1">
                +{blocks.length - 3} more
              </div>
            )}
          </div>
        ) : isStaticSegment ? (
          // DATA/CODE가 비었을 때: 간단한 설명 (한 행)
          <div
            className="grid items-center gap-2 py-1"
            style={{ gridTemplateColumns: '30% 1fr' }}
          >
            <div className="text-center text-muted-foreground font-mono text-sm">
              {type === 'data' ? '전역 변수' : '프로그램'}
            </div>
            <div className="text-muted-foreground text-center text-sm">
              {SEGMENT_DESCRIPTIONS[type]}
            </div>
          </div>
        ) : (
          // HEAP이 비었을 때
          <div className="text-sm text-muted-foreground text-center py-2">
            Empty
          </div>
        )}
      </div>
    </motion.div>
  );
}
