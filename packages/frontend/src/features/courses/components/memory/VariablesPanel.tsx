/**
 * VariablesPanel - 변수 영역 (메모리가 아님, 별칭만 표시)
 *
 * 핵심 개념:
 * - 변수는 메모리에 저장되지 않음 (단순히 메모리 주소의 값을 참조하는 이름)
 * - 변수 = "별칭(alias)" → 메모리 주소의 값을 참조
 * - 이 패널은 변수명과 그들이 참조하는 메모리 블록을 시각적으로 연결
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENT_COLORS, getPointerColor } from '@/features/visualizers/c/constants';
import type { LessonMemoryBlock } from '../../hooks/useLessonMemory';

interface VariablePanelProps {
  stack: LessonMemoryBlock[];
  heap: LessonMemoryBlock[];
  changedBlocks: string[];
  onVariableHover?: (varName: string | null) => void;
}

interface VariableTagProps {
  block: LessonMemoryBlock;
  isChanged: boolean;
  isPointer: boolean;
  pointerIndex: number;
  segmentType: 'stack' | 'heap';
  onHover?: (varName: string | null) => void;
}

/**
 * 변수 태그 (single variable display)
 * - 변수명
 * - 색상 코딩
 * - 변경 표시
 * - 포인터 여부 표시
 */
function VariableTag({
  block,
  isChanged,
  isPointer,
  pointerIndex,
  segmentType,
  onHover,
}: VariableTagProps) {
  const segmentColor = SEGMENT_COLORS[segmentType];
  const pointerColor = isPointer ? getPointerColor(pointerIndex) : null;
  const displayColor = pointerColor?.main || segmentColor.main;
  const bgColor = pointerColor?.bg || segmentColor.bg;

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => onHover?.(block.name)}
      onHoverEnd={() => onHover?.(null)}
      className="relative"
    >
      <div
        className="px-3 py-2 rounded-lg font-mono font-bold text-sm cursor-pointer transition-all hover:shadow-md"
        style={{
          color: displayColor,
          backgroundColor: bgColor,
          border: `2px solid ${displayColor}`,
          boxShadow: isChanged ? `0 0 8px ${displayColor}40` : 'none',
        }}
      >
        {/* 변수명 */}
        <span>{block.name}</span>

        {/* 포인터 표시 */}
        {isPointer && (
          <span
            className="ml-1 inline-block text-xs font-bold"
            style={{ color: displayColor }}
          >
            *
          </span>
        )}

        {/* 변경 표시 (작은 펄스 점) */}
        {isChanged && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            className="ml-2 inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#fbbf24' }}
          />
        )}

        {/* 세그먼트 배지 */}
        <div className="mt-1 text-xs opacity-70">
          {segmentType === 'stack' ? '🔵 Stack' : '🟢 Heap'}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 변수 영역 - 모든 변수를 태그로 표시
 */
export function VariablesPanel({
  stack,
  heap,
  changedBlocks,
  onVariableHover,
}: VariablePanelProps) {
  const allBlocks = [...stack, ...heap];
  const pointerBlocks = allBlocks.filter((b) => b.points_to !== null);

  const getPointerIndex = (block: LessonMemoryBlock) => {
    if (block.points_to === null) return 0;
    return pointerBlocks.findIndex((p) => p.name === block.name);
  };

  const isEmpty = stack.length === 0 && heap.length === 0;

  return (
    <div className="border-b-2 border-gray-300 bg-gray-50 p-4">
      {/* 헤더 */}
      <div className="mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
          변수 영역 (메모리가 아님 - 단순 별칭)
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          변수는 메모리에 저장되지 않습니다. 메모리 주소의 값을 참조하는 이름일 뿐입니다.
        </p>
      </div>

      {/* 변수 태그 그리드 */}
      <div className="flex flex-wrap gap-3">
        <AnimatePresence>
          {isEmpty ? (
            <motion.span
              key="empty-vars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-500 italic"
            >
              변수 없음
            </motion.span>
          ) : (
            [
              /* Stack 변수들 */
              ...stack.map((block) => (
                <VariableTag
                  key={`var-${block.name}`}
                  block={block}
                  isChanged={changedBlocks.includes(block.name)}
                  isPointer={block.points_to !== null}
                  pointerIndex={getPointerIndex(block)}
                  segmentType="stack"
                  onHover={onVariableHover}
                />
              )),

              /* Heap 변수들 */
              ...heap.map((block) => (
                <VariableTag
                  key={`var-heap-${block.name}`}
                  block={block}
                  isChanged={changedBlocks.includes(block.name)}
                  isPointer={block.points_to !== null}
                  pointerIndex={getPointerIndex(block)}
                  segmentType="heap"
                  onHover={onVariableHover}
                />
              )),
            ]
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
