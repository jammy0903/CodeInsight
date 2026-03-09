/**
 * MemoryPanel - 레슨용 메모리 시각화 (오케스트레이터)
 *
 * 구조:
 * - Stack: 스택 프레임별 색상, 배열 그룹핑
 * - Heap: 동적 할당 영역
 * - Lower: BSS / Data / Text 섹션
 */

import type { ChangedBlocksType, MemoryPanelProps } from './types';
import { StackSection } from './StackSection';
import { HeapSection } from './HeapSection';
import { LowerMemorySections } from './LowerMemorySections';

const INITIAL_CHANGED_BLOCKS: ChangedBlocksType = { stack: [], heap: [] };

export function MemoryPanel({
  stack,
  heap,
  changedBlocks = INITIAL_CHANGED_BLOCKS,
  emptyMessage,
  frames = [{ name: 'main' }],
  dataSection = [],
  textSection = [],
}: MemoryPanelProps) {
  const isEmpty = stack.length === 0 && heap.length === 0;

  return (
    <div className="p-2 space-y-2 relative">
      {isEmpty ? (
        <div
          className="text-center py-8 text-sm italic"
          style={{ color: 'var(--theme-memory-card-muted)' }}
        >
          {emptyMessage || '메모리 할당 없음'}
        </div>
      ) : (
        <>
          <StackSection
            blocks={stack}
            changedBlocks={changedBlocks}
            frames={frames}
          />
          <HeapSection
            blocks={heap}
            changedBlocks={changedBlocks}
          />
          <LowerMemorySections
            dataSection={dataSection}
            textSection={textSection}
          />
        </>
      )}
    </div>
  );
}
