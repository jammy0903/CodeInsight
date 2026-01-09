/**
 * MemoryPanel - 메모리 영역 (Stack/Heap 분리 표시)
 *
 * 레이아웃:
 * - Stack Section (위)
 * - Heap Section (아래)
 * - 각 섹션은 명확한 시각적 구분
 * - 메모리 블록: 주소 | 값 (강조됨) | 포인터 여부
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENT_COLORS, getPointerColor } from '@/features/visualizers/c/constants';
import type { LessonMemoryBlock } from '../../hooks/useLessonMemory';

interface MemoryPanelProps {
  stack: LessonMemoryBlock[];
  heap: LessonMemoryBlock[];
  changedBlocks: string[];
  hoveredVariable?: string | null;
}

interface MemoryBlockProps {
  block: LessonMemoryBlock;
  isChanged: boolean;
  isPointer: boolean;
  pointerIndex: number;
  segmentType: 'stack' | 'heap';
  isHovered?: boolean;
}

/**
 * 메모리 블록 - 넉넉한 메모리 위치 표시
 */
function MemoryBlock({
  block,
  isChanged,
  isPointer,
  pointerIndex,
  segmentType,
  isHovered,
}: MemoryBlockProps) {
  const segmentColor = SEGMENT_COLORS[segmentType];
  const pointerColor = isPointer ? getPointerColor(pointerIndex) : null;
  const mainColor = pointerColor?.main || segmentColor.main;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="mb-4 rounded-xl overflow-hidden transition-all"
      style={{
        backgroundColor: isHovered ? pointerColor?.bg || segmentColor.headerBg : 'white',
        border: `2px solid ${mainColor}`,
        boxShadow: isChanged
          ? `0 0 12px ${mainColor}50`
          : isHovered
            ? `0 0 8px ${mainColor}30`
            : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* 주소 헤더 */}
      <div
        className="px-4 py-2 text-sm font-mono font-bold text-white"
        style={{ backgroundColor: mainColor }}
      >
        {block.address}
      </div>

      {/* 내용 */}
      <div className="p-4">
        {/* 변수명 */}
        <div className="mb-3">
          <span className="text-xs text-gray-500">변수:</span>
          <span
            className="ml-2 text-lg font-bold"
            style={{ color: mainColor }}
          >
            {block.name}
          </span>
        </div>

        {/* 값 (크게 강조) */}
        <div
          className="px-4 py-3 rounded-lg font-mono font-bold text-xl text-center"
          style={{
            backgroundColor: isChanged ? '#fef3c7' : `${mainColor}15`,
            color: mainColor,
            border: `2px solid ${mainColor}40`,
          }}
        >
          {block.value}
          {isChanged && (
            <span className="ml-2 text-sm text-amber-600">⚡ 변경됨</span>
          )}
        </div>

        {/* 포인터 표시 */}
        {isPointer && (
          <div
            className="mt-3 px-3 py-2 rounded-lg text-sm font-bold text-center"
            style={{
              backgroundColor: `${mainColor}10`,
              color: mainColor,
            }}
          >
            → {block.points_to} 를 가리킴
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 메모리 섹션 (Stack 또는 Heap)
 */
function MemorySection({
  type,
  blocks,
  changedBlocks,
  hoveredVariable,
}: {
  type: 'stack' | 'heap';
  blocks: LessonMemoryBlock[];
  changedBlocks: string[];
  hoveredVariable?: string | null;
}) {
  const colors = SEGMENT_COLORS[type];
  const pointerBlocks = blocks.filter((b) => b.points_to !== null);

  const getPointerIndex = (block: LessonMemoryBlock) => {
    if (block.points_to === null) return 0;
    return pointerBlocks.findIndex((p) => p.name === block.name);
  };

  // 정렬: Stack은 내림차순, Heap은 오름차순
  const sortedBlocks = [...blocks].sort((a, b) => {
    const addrA = parseInt(a.address, 16);
    const addrB = parseInt(b.address, 16);
    return type === 'stack' ? addrB - addrA : addrA - addrB;
  });

  const isEmpty = blocks.length === 0;

  return (
    <div className="rounded-xl overflow-hidden">
      {/* 섹션 헤더 */}
      <div
        className="px-4 py-3 text-white font-bold text-sm"
        style={{ backgroundColor: colors.main }}
      >
        {type === 'stack' ? '📦 Stack' : '🎒 Heap'}
        <span className="font-normal ml-2 opacity-80 text-xs">
          {type === 'stack' ? '(자동 관리 영역)' : '(수동 할당 영역)'}
        </span>
      </div>

      {/* 메모리 블록 리스트 */}
      <div
        className="p-4"
        style={{
          backgroundColor: `${colors.main}08`,
          border: `2px solid ${colors.main}30`,
          borderTop: 'none',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
        }}
      >
        {isEmpty ? (
          <div className="text-center py-6 text-gray-400 italic">
            {type === 'stack' ? '스택 비어있음' : '힙 비어있음'}
          </div>
        ) : (
          <AnimatePresence>
            {sortedBlocks.map((block) => (
              <MemoryBlock
                key={`mem-${type}-${block.name}`}
                block={block}
                isChanged={changedBlocks.includes(block.name)}
                isPointer={block.points_to !== null}
                pointerIndex={getPointerIndex(block)}
                segmentType={type}
                isHovered={hoveredVariable === block.name}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/**
 * 메모리 패널 - 계획서대로 세로 블록 형식
 * 변수 영역 (상단) → Stack (중간) → Heap (하단)
 */
export function MemoryPanel({
  stack,
  heap,
  changedBlocks,
  hoveredVariable,
}: MemoryPanelProps) {
  const isEmpty = stack.length === 0 && heap.length === 0;

  return (
    <div className="flex-1 overflow-auto p-4">
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-gray-700">
          메모리 영역 (실제 값이 저장되는 곳)
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          메모리에 저장되는 것은 값뿐입니다. 포인터도 주소라는 값입니다.
        </p>
      </div>

      {/* 메모리 블록들 - 세로 배치 */}
      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500 italic"
        >
          메모리 할당 없음
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Stack 섹션 */}
          <MemorySection
            type="stack"
            blocks={stack}
            changedBlocks={changedBlocks}
            hoveredVariable={hoveredVariable}
          />

          {/* Heap 섹션 */}
          <MemorySection
            type="heap"
            blocks={heap}
            changedBlocks={changedBlocks}
            hoveredVariable={hoveredVariable}
          />
        </div>
      )}
    </div>
  );
}
