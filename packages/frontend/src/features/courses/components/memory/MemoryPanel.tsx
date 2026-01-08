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
 * 메모리 블록 - 단일 메모리 위치 표시
 * 강조점: 메모리에 저장되는 것은 "값"이라는 것
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
      className="mb-3 rounded-lg overflow-hidden transition-all"
      style={{
        backgroundColor: isHovered ? pointerColor?.bg || segmentColor.headerBg : 'white',
        border: `2px solid ${mainColor}`,
        boxShadow: isChanged
          ? `0 0 12px ${mainColor}60, inset 0 0 8px ${mainColor}20`
          : isHovered
            ? `0 0 8px ${mainColor}40`
            : 'none',
      }}
    >
      {/* 메모리 주소 (헤더) */}
      <div
        className="px-3 py-2 text-xs font-bold text-white"
        style={{ backgroundColor: mainColor }}
      >
        {block.address}
      </div>

      {/* 메모리 값 (메인 콘텐츠) */}
      <div className="px-4 py-3">
        {/* 값 레이블 */}
        <div className="text-xs font-semibold text-gray-600 mb-1">값:</div>

        {/* 값 표시 (강조됨) */}
        <div
          className="px-3 py-2 rounded font-mono font-bold text-sm transition-all"
          style={{
            backgroundColor: `${mainColor}15`,
            color: mainColor,
            border: `1px solid ${mainColor}40`,
            boxShadow: isChanged ? `0 0 8px ${mainColor}40` : 'none',
          }}
        >
          {block.value}

          {/* 포인터 화살표 및 설명 */}
          {isPointer && (
            <div className="mt-2 text-xs" style={{ color: mainColor }}>
              <span className="font-bold">→ 가리킴:</span> {block.points_to}
            </div>
          )}
        </div>

        {/* 변수명 (이 메모리 위치를 참조하는 변수) */}
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-semibold">변수:</span>{' '}
          <span style={{ color: mainColor, fontWeight: 'bold' }}>{block.name}</span>
          가 이 주소를 참조
        </div>

        {/* 변경 표시 */}
        {isChanged && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-2 py-1 rounded text-xs font-semibold"
            style={{ backgroundColor: '#fbbf24', color: '#78350f' }}
          >
            ⚡ 값 변경됨
          </motion.div>
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
  if (blocks.length === 0) return null;

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

  return (
    <div className="mb-4">
      {/* 섹션 헤더 */}
      <div
        className="px-4 py-3 rounded-t-lg text-white font-bold text-sm"
        style={{ backgroundColor: colors.main }}
      >
        {type === 'stack' ? (
          <>
            📦 Stack (메모리 자동 관리)
            <span className="text-xs font-normal ml-2">↓ 낮은 주소</span>
          </>
        ) : (
          <>
            🎒 Heap (수동 할당)
            <span className="text-xs font-normal ml-2">↑ 높은 주소</span>
          </>
        )}
      </div>

      {/* 메모리 블록 리스트 */}
      <div
        className="px-4 py-4 rounded-b-lg"
        style={{ backgroundColor: `${colors.main}08` }}
      >
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
      </div>
    </div>
  );
}

/**
 * 메모리 패널 - Stack과 Heap을 명확히 분리
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
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
          메모리 영역 (실제 값이 저장되는 곳)
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          메모리에 저장되는 것은 값뿐입니다. 포인터도 주소라는 값입니다.
        </p>
      </div>

      {/* 메모리 블록들 */}
      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500 italic"
        >
          메모리 할당 없음
        </motion.div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
