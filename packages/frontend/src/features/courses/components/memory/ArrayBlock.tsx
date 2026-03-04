/**
 * ArrayBlock - 배열 메모리 블록 (접기/펼치기 지원)
 *
 * 접힌 상태: arr[0..N] 요약 + 주소 범위
 * 펼친 상태: 개별 MemoryBlockCard 나열
 */

import { motion } from 'framer-motion';
import type { MemoryBlock } from '@/types';

import { COLORS } from './utils/frameColors';
import type { FrameColor } from './utils/frameColors';
import { getDisplayName } from './utils/memoryHelpers';
import { MemoryBlockCard } from './MemoryBlockCard';

export interface ArrayBlockProps {
  arrayName: string;
  elements: MemoryBlock[];
  isExpanded: boolean;
  isChanged: boolean;
  frameColor: FrameColor;
  frameName: string;
  onToggle: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function ArrayBlock({
  arrayName,
  elements,
  isExpanded,
  isChanged,
  frameColor,
  frameName,
  onToggle,
  onMouseEnter,
  onMouseLeave,
}: ArrayBlockProps) {
  const displayName = getDisplayName(arrayName);
  const elementCount = elements.length;
  const firstElement = elements[0];
  const lastElement = elements[elements.length - 1];

  if (!isExpanded) {
    // 접힌 상태: 요약 표시
    return (
      <motion.div
        layout
        className="rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer relative"
        style={{
          backgroundColor: 'var(--theme-memory-card-bg)',
          border: `2px solid ${frameColor.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggle}
              className="text-xs p-1 rounded transition-colors"
              style={{ color: 'var(--theme-memory-card-muted)' }}
            >
              &#9654;
            </button>

            <span className="text-xs font-semibold" style={{ color: frameColor.text }}>
              {displayName}[0..{elementCount - 1}]
            </span>
            <span className="text-[10px]" style={{ color: 'var(--theme-memory-card-muted)' }}>
              ({elementCount}개 요소)
            </span>
          </div>

          <span className="text-[10px] font-mono" style={{ color: 'var(--theme-memory-card-muted)' }}>
            {firstElement.address} ~ {lastElement.address}
          </span>
        </div>

      </motion.div>
    );
  }

  // 펼친 상태: 개별 요소 표시
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-2">
        <button
          onClick={onToggle}
          className="text-xs p-1 rounded transition-colors"
          style={{ color: 'var(--theme-memory-card-muted)' }}
        >
          &#9660;
        </button>
        <span className="text-xs font-semibold" style={{ color: frameColor.text }}>
          {displayName}[{elementCount}]
        </span>
      </div>

      <div className="pl-6 space-y-1">
        {elements.map((element) => (
          <MemoryBlockCard
            key={element.name}
            block={element}
            isChanged={isChanged}
            isHovered={false}
            frameColor={frameColor}
            frameName={frameName}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        ))}
      </div>
    </div>
  );
}
