/**
 * StackDetailView
 * 스택 메모리 상세 뷰 - 스택 프레임 시각화
 * 포인터 탭 시 연결된 블록 하이라이트
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Xarrow from 'react-xarrows';
import type { MemoryBlock } from '../types';
import { REGISTER_COLORS, ANIMATION_DURATION, getPointerColor, ARROW_CONFIG } from '../constants';
import { formatAddress, isPointerType, sortBlocksByAddress, toBlockId } from '../utils';

interface StackDetailViewProps {
  blocks: MemoryBlock[];
  rsp: string;
  rbp: string;
  onClose?: () => void;
  changedBlocks?: string[];
  animationSpeed?: 'slow' | 'normal' | 'fast';
  // 외부에서 힙 블록 전달 (cross-panel 하이라이트용)
  heapBlocks?: MemoryBlock[];
}


export function StackDetailView({
  blocks,
  rsp,
  rbp,
  onClose,
  changedBlocks = [],
  animationSpeed = 'normal',
  heapBlocks = [],
}: StackDetailViewProps) {
  const duration = ANIMATION_DURATION[animationSpeed] / 1000;
  const sortedBlocks = sortBlocksByAddress(blocks, true);

  // 선택된 포인터 (로컬 상태)
  const [selectedPointer, setSelectedPointer] = useState<string | null>(null);

  // 모든 블록 (스택 + 힙)
  const allBlocks = useMemo(() => [...blocks, ...heapBlocks], [blocks, heapBlocks]);

  // 포인터 블록들의 인덱스 맵 (주소 -> 색상 인덱스)
  const pointerIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    for (const block of blocks) {
      if (block.points_to) {
        map.set(block.address, idx++);
      }
    }
    return map;
  }, [blocks]);

  // 포인터 연결 정보 (화살표용)
  const pointerConnections = useMemo(() => {
    const heapAddresses = new Set(heapBlocks.map(b => b.address));
    return blocks
      .filter(b => b.points_to && heapAddresses.has(b.points_to))
      .map(b => ({
        from: b.address,
        to: b.points_to!,
        colorIndex: pointerIndexMap.get(b.address) ?? 0,
      }));
  }, [blocks, heapBlocks, pointerIndexMap]);

  // 블록의 포인터 색상 가져오기
  const getBlockPointerColor = (block: MemoryBlock) => {
    const idx = pointerIndexMap.get(block.address);
    if (idx !== undefined) return getPointerColor(idx);
    // 타겟 블록인 경우 소스 포인터의 색상 찾기
    for (const [addr, i] of pointerIndexMap) {
      const srcBlock = blocks.find(b => b.address === addr);
      if (srcBlock?.points_to === block.address) return getPointerColor(i);
    }
    return null;
  };

  // 블록이 하이라이트 대상인지 확인
  const isHighlighted = (block: MemoryBlock) => {
    if (!selectedPointer) return false;
    const selectedBlock = allBlocks.find((b) => b.address === selectedPointer);
    return block.address === selectedPointer || block.address === selectedBlock?.points_to;
  };

  // 포인터 블록 클릭 핸들러
  const handlePointerClick = (block: MemoryBlock) => {
    if (block.points_to) {
      setSelectedPointer((prev) => (prev === block.address ? null : block.address));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden"
      onClick={() => setSelectedPointer(null)}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <h3 className="text-sm font-medium text-foreground">Stack Detail</h3>
          <span className="text-xs text-muted-foreground">
            {blocks.length} variables
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close stack detail view"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Stack Visualization - Excel Style */}
      <div className="flex-1 overflow-auto p-3">
        {/* Excel-like Table */}
        <table className="w-full border-collapse text-xs">
          {/* Header */}
          <thead>
            <tr style={{ backgroundColor: '#e8d5f0' }}>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800 w-12"></th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Address</th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Name</th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Type</th>
              <th className="border border-purple-300 px-3 py-2 text-left font-medium text-purple-800">Value</th>
            </tr>
          </thead>
          {/* Body */}
          <tbody>
            <AnimatePresence mode="popLayout">
              {sortedBlocks.map((block, index) => {
                const isRspHere = block.address === rsp;
                const isRbpHere = block.address === rbp;
                const isChanged = changedBlocks.includes(block.address);
                const isPointer = isPointerType(block.type);
                const highlighted = isHighlighted(block);
                const ptrColor = getBlockPointerColor(block);

                // 행 배경색 결정
                let rowBg = index % 2 === 0 ? '#faf5ff' : '#f3e8ff';
                if (isChanged && !highlighted) rowBg = '#ede9fe';
                if (highlighted && ptrColor) rowBg = ptrColor.bg;

                // 행 테두리 스타일 (하이라이트 시 포인터 색상)
                const rowBorder = highlighted && ptrColor ? `2px solid ${ptrColor.border}` : undefined;

                return (
                  <motion.tr
                    key={block.address}
                    id={toBlockId(block.address)}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration, delay: index * 0.02 }}
                    style={{ backgroundColor: rowBg, outline: rowBorder }}
                    className={`${isPointer ? 'cursor-pointer hover:bg-purple-100' : ''}`}
                    onClick={(e) => {
                      if (isPointer) {
                        e.stopPropagation();
                        handlePointerClick(block);
                      }
                    }}
                  >
                    {/* RSP/RBP Indicator */}
                    <td className="border border-purple-200 px-2 py-2 text-right font-mono">
                      {isRbpHere && (
                        <span className="text-xs font-bold" style={{ color: REGISTER_COLORS.rbp }}>RBP→</span>
                      )}
                      {isRspHere && (
                        <span className="text-xs font-bold" style={{ color: REGISTER_COLORS.rsp }}>RSP→</span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="border border-purple-200 px-3 py-2 font-mono text-gray-600">
                      {formatAddress(block.address, true)}
                    </td>

                    {/* Name */}
                    <td className="border border-purple-200 px-3 py-2 font-mono font-medium text-purple-900">
                      {block.name}
                    </td>

                    {/* Type */}
                    <td className="border border-purple-200 px-3 py-2 text-gray-500">
                      {block.type}
                    </td>

                    {/* Value */}
                    <td className="border border-purple-200 px-3 py-2 font-mono text-gray-800">
                      {isPointer && block.points_to ? (
                        <span className="flex items-center gap-1">
                          <span style={{ color: ptrColor?.main }}>→</span>
                          <span style={{ color: highlighted && ptrColor ? ptrColor.main : undefined }}>
                            {formatAddress(block.points_to, true)}
                          </span>
                        </span>
                      ) : (
                        block.value
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {/* Empty State */}
        {blocks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground border border-purple-200 rounded mt-2" style={{ backgroundColor: '#faf5ff' }}>
            <p className="text-sm">Stack is empty</p>
          </div>
        )}

        {/* 포인터 화살표 렌더링 */}
        {pointerConnections.map((conn) => {
          const color = getPointerColor(conn.colorIndex);
          const isSelected = selectedPointer === conn.from;
          return (
            <Xarrow
              key={`arrow-${conn.from}-${conn.to}`}
              start={toBlockId(conn.from)}
              end={toBlockId(conn.to)}
              color={color.main}
              strokeWidth={isSelected ? ARROW_CONFIG.strokeWidth + 1 : ARROW_CONFIG.strokeWidth}
              headSize={ARROW_CONFIG.headSize}
              path={ARROW_CONFIG.path}
              gridBreak={ARROW_CONFIG.gridBreak}
              startAnchor="right"
              endAnchor="right"
              dashness={isSelected ? false : { animation: 1 }}
              showHead={true}
              _cpx1Offset={40 + conn.colorIndex * 15}
              _cpx2Offset={40 + conn.colorIndex * 15}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-purple-200 flex items-center justify-center gap-2 text-xs text-purple-600" style={{ backgroundColor: '#f3e8ff' }}>
        <span>High Addr</span>
        <span>↓</span>
        <span>Low Addr (grows down)</span>
      </div>
    </motion.div>
  );
}
