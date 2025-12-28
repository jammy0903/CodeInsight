/**
 * HeapDetailView
 * 힙 메모리 상세 뷰 - malloc 블록 시각화
 * 포인터로 참조되는 블록 하이라이트 지원
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryBlock } from '../types';
import { ANIMATION_DURATION, POINTER_COLORS } from '../constants';
import { formatAddress, sortBlocksByAddress } from '../utils';

interface HeapDetailViewProps {
  blocks: MemoryBlock[];
  onClose?: () => void;
  changedBlocks?: string[];
  animationSpeed?: 'slow' | 'normal' | 'fast';
  // 외부에서 스택 블록 전달 (cross-panel 하이라이트용)
  stackBlocks?: MemoryBlock[];
}


export function HeapDetailView({
  blocks,
  onClose,
  changedBlocks = [],
  animationSpeed = 'normal',
  stackBlocks = [],
}: HeapDetailViewProps) {
  const duration = ANIMATION_DURATION[animationSpeed] / 1000;
  const sortedBlocks = sortBlocksByAddress(blocks, false);

  // 선택된 힙 블록 (어떤 포인터가 이 블록을 가리키는지 보기 위함)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  // 이 힙 블록을 가리키는 포인터 찾기
  const getPointersToBlock = (blockAddress: string) => {
    return stackBlocks.filter((b) => b.points_to === blockAddress);
  };

  // 블록이 하이라이트 대상인지 확인
  const isHighlighted = (block: MemoryBlock) => {
    return block.address === selectedBlock;
  };

  // 힙 블록 클릭 핸들러
  const handleBlockClick = (block: MemoryBlock) => {
    setSelectedBlock((prev) => (prev === block.address ? null : block.address));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden"
      onClick={() => setSelectedBlock(null)}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-medium text-foreground">Heap Detail</h3>
          <span className="text-xs text-muted-foreground">
            {blocks.length} allocations
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close heap detail view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Heap Visualization - Excel Style */}
      <div className="flex-1 overflow-auto p-3">
        {blocks.length > 0 ? (
          <table className="w-full border-collapse text-xs">
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: '#d1fae5' }}>
                <th className="border border-emerald-300 px-3 py-2 text-left font-medium text-emerald-800">Address</th>
                <th className="border border-emerald-300 px-3 py-2 text-left font-medium text-emerald-800">Name</th>
                <th className="border border-emerald-300 px-3 py-2 text-left font-medium text-emerald-800">Type</th>
                <th className="border border-emerald-300 px-3 py-2 text-left font-medium text-emerald-800">Size</th>
                <th className="border border-emerald-300 px-3 py-2 text-left font-medium text-emerald-800">Value</th>
                <th className="border border-emerald-300 px-3 py-2 text-left font-medium text-emerald-800">Refs</th>
              </tr>
            </thead>
            {/* Body */}
            <tbody>
              <AnimatePresence mode="popLayout">
                {sortedBlocks.map((block, index) => {
                  const isChanged = changedBlocks.includes(block.address);
                  const isFreed = block.value === 'freed';
                  const highlighted = isHighlighted(block);
                  const pointers = getPointersToBlock(block.address);

                  // 행 배경색 결정
                  let rowBg = index % 2 === 0 ? '#f0fdf4' : '#dcfce7';
                  if (isFreed) rowBg = '#fee2e2';
                  if (isChanged && !highlighted) rowBg = '#d1fae5';
                  if (highlighted) rowBg = POINTER_COLORS.bg;

                  return (
                    <motion.tr
                      key={block.address}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isFreed ? 0.6 : 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration, delay: index * 0.02 }}
                      style={{ backgroundColor: rowBg }}
                      className="cursor-pointer hover:bg-emerald-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlockClick(block);
                      }}
                    >
                      {/* Address */}
                      <td className="border border-emerald-200 px-3 py-2 font-mono text-gray-600">
                        {formatAddress(block.address, true)}
                      </td>

                      {/* Name */}
                      <td className="border border-emerald-200 px-3 py-2 font-mono font-medium text-emerald-900">
                        {block.name}
                        {isFreed && <span className="ml-1 text-red-500">(freed)</span>}
                      </td>

                      {/* Type */}
                      <td className="border border-emerald-200 px-3 py-2 text-gray-500">
                        {block.type}
                      </td>

                      {/* Size */}
                      <td className="border border-emerald-200 px-3 py-2 font-mono text-gray-600">
                        {block.size}B
                      </td>

                      {/* Value */}
                      <td className="border border-emerald-200 px-3 py-2 font-mono text-gray-800">
                        {block.value}
                      </td>

                      {/* Pointer References */}
                      <td className="border border-emerald-200 px-3 py-2 text-gray-500">
                        {pointers.length > 0 ? (
                          <span style={{ color: POINTER_COLORS.main }}>
                            ← {pointers.map((p) => p.name).join(', ')}
                          </span>
                        ) : '-'}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground border border-emerald-200 rounded" style={{ backgroundColor: '#f0fdf4' }}>
            <p className="text-sm">No heap allocations (use malloc)</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-emerald-200 flex items-center justify-center gap-2 text-xs text-emerald-600" style={{ backgroundColor: '#d1fae5' }}>
        <span>Low Addr</span>
        <span>↑</span>
        <span>High Addr (grows up)</span>
      </div>
    </motion.div>
  );
}
