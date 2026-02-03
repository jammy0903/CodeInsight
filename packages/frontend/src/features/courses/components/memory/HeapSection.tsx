/**
 * HeapSection - 힙 메모리 영역
 *
 * 낮은 주소 → 높은 주소 순서로 블록 표시
 * 빈 경우 한 줄로 축소
 */

import { useMemo } from 'react';
import type { MemoryBlock } from '@/types';

import { COLORS } from './utils/frameColors';
import type { ChangedBlocksType } from './types';
import { MemoryBlockCard } from './MemoryBlockCard';

interface HeapSectionProps {
  blocks: MemoryBlock[];
  changedBlocks: ChangedBlocksType;
}

export function HeapSection({
  blocks,
  changedBlocks,
}: HeapSectionProps) {
  // 주소순 정렬 (낮은 주소 → 높은 주소)
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => {
      const addrA = parseInt(a.address, 16);
      const addrB = parseInt(b.address, 16);
      return addrA - addrB;
    });
  }, [blocks]);

  if (sortedBlocks.length === 0) {
    return (
      <div
        className="rounded-md px-2 py-1.5 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--theme-memory-heap-bg)',
          border: `1px solid ${'var(--theme-memory-heap-border)'}25`,
        }}
      >
        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--theme-memory-heap-label)' }}>
          🎒 Heap
        </span>
        <span className="text-[9px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
          (비어있음)
        </span>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-2"
      style={{
        backgroundColor: 'var(--theme-memory-heap-bg)',
        border: `1px solid ${'var(--theme-memory-heap-border)'}25`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--theme-memory-heap-label)' }}>
          🎒 Heap
        </span>
        <span className="text-[9px]" style={{ color: 'var(--theme-memory-heap-label)' }}>
          ↑ 높은 주소
        </span>
      </div>

      <div className="space-y-1.5">
        {sortedBlocks.map((block) => (
          <MemoryBlockCard
            key={`heap-${block.name}-${block.address}`}
            block={block}
            isChanged={changedBlocks.stack.includes(block.name) || changedBlocks.heap.includes(block.name)}
            isHovered={false}
            frameColor={COLORS.frame[2]}
            frameName="heap"
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
