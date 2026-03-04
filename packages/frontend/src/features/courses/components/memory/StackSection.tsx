/**
 * StackSection - 스택 메모리 영역
 *
 * 프레임별 색상 매핑, 배열 그룹핑, 호버 하이라이팅
 */

import { useState, useMemo } from 'react';
import type { MemoryBlock } from '@/types';

import { COLORS } from './utils/frameColors';
import type { FrameColor } from './utils/frameColors';
import { getFrameFromBlock, isArrayElement, getArrayBaseName, getArrayIndex } from './utils/memoryHelpers';
import type { ChangedBlocksType } from './types';
import { MemoryBlockCard } from './MemoryBlockCard';
import { ArrayBlock } from './ArrayBlock';

interface StackSectionProps {
  blocks: MemoryBlock[];
  changedBlocks: ChangedBlocksType;
  frames: Array<{ name: string }>;
}

export function StackSection({
  blocks,
  changedBlocks,
  frames,
}: StackSectionProps) {
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);
  const [expandedArrays, setExpandedArrays] = useState<Set<string>>(new Set());

  // 주소순 정렬 (높은 주소 → 낮은 주소), NaN 방어
  const sortedBlocks = useMemo(() => {
    return [...blocks].sort((a, b) => {
      const addrA = parseInt(a.address, 16);
      const addrB = parseInt(b.address, 16);
      if (isNaN(addrA) && isNaN(addrB)) return 0;
      if (isNaN(addrA)) return 1;
      if (isNaN(addrB)) return -1;
      return addrB - addrA;
    });
  }, [blocks]);

  // 블록별 프레임 매핑
  const blockFrameMap = useMemo(() => {
    const map = new Map<string, string>();
    const defaultFrame = frames[0]?.name || 'main';
    sortedBlocks.forEach((block) => {
      const extractedFrame = getFrameFromBlock(block, defaultFrame);
      map.set(block.name, extractedFrame);
    });
    return map;
  }, [sortedBlocks, frames]);

  // 프레임별 색상 매핑
  const frameColorMap = useMemo(() => {
    const map = new Map<string, FrameColor>();

    if (frames.length > 0) {
      frames.forEach((frame, idx) => {
        map.set(frame.name, COLORS.frame[idx % COLORS.frame.length]);
      });
    } else {
      const uniqueFrames = new Set<string>();
      sortedBlocks.forEach((block) => {
        const frameName = getFrameFromBlock(block, 'main');
        uniqueFrames.add(frameName);
      });

      Array.from(uniqueFrames).forEach((frameName, idx) => {
        map.set(frameName, COLORS.frame[idx % COLORS.frame.length]);
      });
    }

    return map;
  }, [frames, sortedBlocks]);

  // 배열 그룹핑
  const { arrays, regularBlocks } = useMemo(() => {
    const arrayMap = new Map<string, MemoryBlock[]>();
    const regular: MemoryBlock[] = [];

    sortedBlocks.forEach((block) => {
      if (isArrayElement(block.name)) {
        const baseName = getArrayBaseName(block.name);
        if (!arrayMap.has(baseName)) {
          arrayMap.set(baseName, []);
        }
        arrayMap.get(baseName)!.push(block);
      } else {
        regular.push(block);
      }
    });

    arrayMap.forEach((elements) => {
      elements.sort((a, b) => getArrayIndex(a.name) - getArrayIndex(b.name));
    });

    return { arrays: arrayMap, regularBlocks: regular };
  }, [sortedBlocks]);

  const toggleArray = (arrayName: string) => {
    setExpandedArrays((prev) => {
      const next = new Set(prev);
      if (next.has(arrayName)) {
        next.delete(arrayName);
      } else {
        next.add(arrayName);
      }
      return next;
    });
  };

  if (sortedBlocks.length === 0) {
    return (
      <div
        className="rounded-lg p-3"
        style={{
          backgroundColor: 'var(--theme-memory-stack-bg)',
          border: `1px solid ${'var(--theme-memory-stack-border)'}25`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--theme-memory-stack-label)' }}>
            📦 Stack
          </span>
          <span className="text-[9px]" style={{ color: 'var(--theme-memory-stack-label)' }}>
            ↓ 낮은 주소
          </span>
        </div>
        <div className="text-center py-3 text-[10px] italic" style={{ color: 'var(--theme-memory-card-muted)' }}>
          (비어있음)
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-3"
      style={{
        backgroundColor: 'var(--theme-memory-stack-bg)',
        border: `1px solid ${'var(--theme-memory-stack-border)'}25`,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase" style={{ color: 'var(--theme-memory-stack-label)' }}>
          📦 Stack
        </span>
        <span className="text-[9px]" style={{ color: 'var(--theme-memory-stack-label)' }}>
          ↓ 낮은 주소
        </span>
      </div>

      <div className="flex gap-4 relative">
        <div className="flex-1 space-y-2 relative">
          {(() => {
            const items: Array<{ type: 'block' | 'array'; data: MemoryBlock | [string, MemoryBlock[]] }> = [];

            arrays.forEach((elements, arrayName) => {
              items.push({ type: 'array', data: [arrayName, elements] });
            });

            regularBlocks.forEach((block) => {
              items.push({ type: 'block', data: block });
            });

            // 주소순 정렬
            items.sort((a, b) => {
              const addrA = a.type === 'array'
                ? parseInt((a.data as [string, MemoryBlock[]])[1][0].address, 16)
                : parseInt((a.data as MemoryBlock).address, 16);
              const addrB = b.type === 'array'
                ? parseInt((b.data as [string, MemoryBlock[]])[1][0].address, 16)
                : parseInt((b.data as MemoryBlock).address, 16);
              if (isNaN(addrA) && isNaN(addrB)) return 0;
              if (isNaN(addrA)) return 1;
              if (isNaN(addrB)) return -1;
              return addrB - addrA;
            });

            return items.map((item) => {
              if (item.type === 'array') {
                const [arrayName, elements] = item.data as [string, MemoryBlock[]];
                const frameName = blockFrameMap.get(elements[0].name) || 'main';
                const frameColor = frameColorMap.get(frameName) || COLORS.frame[0];
                const isChanged = elements.some((el) => changedBlocks.stack.includes(el.name) || changedBlocks.heap.includes(el.name));

                return (
                  <ArrayBlock
                    key={`array-${arrayName}`}
                    arrayName={arrayName}
                    elements={elements}
                    isExpanded={expandedArrays.has(arrayName)}
                    isChanged={isChanged}
                    frameColor={frameColor}
                    frameName={frameName}
                    onToggle={() => toggleArray(arrayName)}
                    onMouseEnter={() => setHoveredFrame(frameName)}
                    onMouseLeave={() => setHoveredFrame(null)}
                  />
                );
              } else {
                const block = item.data as MemoryBlock;
                const frameName = blockFrameMap.get(block.name) || 'main';
                const frameColor = frameColorMap.get(frameName) || COLORS.frame[0];
                const isHovered = hoveredFrame === frameName;

                return (
                  <MemoryBlockCard
                    key={`stack-${block.name}-${block.address}`}
                    block={block}
                    isChanged={changedBlocks.stack.includes(block.name) || changedBlocks.heap.includes(block.name)}
                    isHovered={isHovered}
                    frameColor={frameColor}
                    frameName={frameName}
                    onMouseEnter={() => setHoveredFrame(frameName)}
                    onMouseLeave={() => setHoveredFrame(null)}
                  />
                );
              }
            });
          })()}
        </div>
      </div>
    </div>
  );
}
