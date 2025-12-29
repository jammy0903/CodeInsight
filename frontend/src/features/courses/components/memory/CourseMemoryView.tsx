/**
 * CourseMemoryView - 코스용 간소화 메모리 시각화
 *
 * WHY: 기존 ProcessMemoryView는 tracer용 Step 타입에 결합 (rsp, rbp 필수).
 *      코스용은 단순히 변수와 값만 보여주면 됨.
 * TRADEOFF: 코드 중복 < 학습에 집중된 단순한 UX.
 * REVISIT: tracer와 course가 같은 타입 쓰면 통합 가능.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENT_COLORS, getPointerColor } from '@/features/visualizers/c/constants';
import type { CourseMemoryBlock } from '../../hooks/useCourseMemory';

interface CourseMemoryViewProps {
  stack: CourseMemoryBlock[];
  heap: CourseMemoryBlock[];
  changedBlocks: string[];
}

interface MemoryBlockItemProps {
  block: CourseMemoryBlock;
  isChanged: boolean;
  segmentType: 'stack' | 'heap';
  pointerIndex?: number;
}

function MemoryBlockItem({
  block,
  isChanged,
  segmentType,
  pointerIndex,
}: MemoryBlockItemProps) {
  const colors = SEGMENT_COLORS[segmentType];
  const isPointer = block.points_to !== null;
  const pointerColor = isPointer && pointerIndex !== undefined
    ? getPointerColor(pointerIndex)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        backgroundColor: isChanged ? colors.headerBg : colors.bg,
      }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 p-3 rounded-lg border"
      style={{
        borderColor: isPointer && pointerColor ? pointerColor.border : colors.border,
      }}
    >
      {/* 변수명 */}
      <div
        className="font-mono font-semibold min-w-[60px]"
        style={{ color: colors.main }}
      >
        {block.name}
      </div>

      {/* 주소 */}
      <div className="text-xs text-muted-foreground font-mono">
        {block.address}
      </div>

      {/* 화살표 */}
      <div className="text-muted-foreground">=</div>

      {/* 값 */}
      <div
        className="font-mono font-medium flex-1"
        style={{
          color: isPointer && pointerColor ? pointerColor.main : undefined,
        }}
      >
        {block.value}
        {isPointer && (
          <span className="ml-2 text-xs opacity-70">
            → {block.points_to}
          </span>
        )}
      </div>

      {/* 변경 표시 */}
      {isChanged && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 rounded-full bg-yellow-400"
        />
      )}
    </motion.div>
  );
}

interface MemorySectionProps {
  title: string;
  blocks: CourseMemoryBlock[];
  changedBlocks: string[];
  segmentType: 'stack' | 'heap';
}

function MemorySection({
  title,
  blocks,
  changedBlocks,
  segmentType,
}: MemorySectionProps) {
  const colors = SEGMENT_COLORS[segmentType];

  // 포인터 인덱스 계산 (포인터 색상 구분용)
  const pointerBlocks = blocks.filter((b) => b.points_to !== null);
  const getPointerIndex = (block: CourseMemoryBlock) => {
    if (block.points_to === null) return undefined;
    return pointerBlocks.findIndex((p) => p.name === block.name);
  };

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      {/* 헤더 */}
      <div
        className="font-semibold mb-3 pb-2 border-b"
        style={{
          color: colors.main,
          borderColor: colors.border,
        }}
      >
        {title}
      </div>

      {/* 블록 목록 */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {blocks.length === 0 ? (
            <div className="text-sm text-muted-foreground italic py-2">
              {segmentType === 'stack' ? '변수 없음' : '할당 없음'}
            </div>
          ) : (
            blocks.map((block) => (
              <MemoryBlockItem
                key={block.name}
                block={block}
                isChanged={changedBlocks.includes(block.name)}
                segmentType={segmentType}
                pointerIndex={getPointerIndex(block)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function CourseMemoryView({
  stack,
  heap,
  changedBlocks,
}: CourseMemoryViewProps) {
  return (
    <div className="h-full flex flex-col gap-4 overflow-auto p-2">
      {/* Stack */}
      <MemorySection
        title="Stack (지역 변수)"
        blocks={stack}
        changedBlocks={changedBlocks}
        segmentType="stack"
      />

      {/* Heap - 힙 블록이 있을 때만 표시 */}
      {heap.length > 0 && (
        <MemorySection
          title="Heap (동적 할당)"
          blocks={heap}
          changedBlocks={changedBlocks}
          segmentType="heap"
        />
      )}
    </div>
  );
}
