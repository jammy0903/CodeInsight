/**
 * CourseMemoryView - 통합 메모리 테이블 시각화
 *
 * 레이아웃:
 * - Stack과 Heap을 하나의 테이블로 통합
 * - 컬럼 순서: 주소 → 변수 → 값 → ptr → 역할 → 세그먼트
 * - 실제 메모리 배치: Stack(높은주소→낮은주소), Heap(낮은주소→높은주소)
 * - 오른쪽에 성장 방향 라벨
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SEGMENT_COLORS, getPointerColor } from '@/features/visualizers/c/constants';
import type { LessonMemoryBlock } from '../../hooks/useLessonMemory';

interface CourseMemoryViewProps {
  stack: LessonMemoryBlock[];
  heap: LessonMemoryBlock[];
  changedBlocks: string[];
}

interface MemoryRowProps {
  block: LessonMemoryBlock;
  isChanged: boolean;
  segmentType: 'stack' | 'heap';
  pointerIndex?: number;
}

/**
 * 단일 메모리 행
 * 컬럼 순서: 주소 | 변수 | 값 | ptr | 역할 | 세그먼트
 */
function MemoryRow({ block, isChanged, segmentType, pointerIndex }: MemoryRowProps) {
  const colors = SEGMENT_COLORS[segmentType];
  const isPointer = block.points_to !== null;
  const pointerColor = isPointer && pointerIndex !== undefined
    ? getPointerColor(pointerIndex)
    : null;

  // 역할 결정
  const getRole = () => {
    if (segmentType === 'heap') return 'malloc';
    if (isPointer) return 'ptr';
    return 'var';
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: 1,
        x: 0,
        backgroundColor: isChanged ? 'rgba(250, 204, 21, 0.3)' : 'transparent',
      }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
      className="border-b border-gray-200 hover:bg-gray-50"
    >
      {/* 주소 */}
      <td className="px-3 py-2 font-mono text-xs text-gray-500">
        {block.address}
      </td>

      {/* 변수 */}
      <td
        className="px-3 py-2 font-mono font-semibold text-sm"
        style={{ color: pointerColor?.main || colors.main }}
      >
        {block.name}
        {isChanged && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-yellow-400"
          />
        )}
      </td>

      {/* 값 */}
      <td className="px-3 py-2 font-mono text-sm text-gray-800">
        {block.value}
      </td>

      {/* ptr (포인터 화살표) */}
      <td className="px-3 py-2 text-center">
        {isPointer && (
          <span
            className="text-sm font-bold"
            style={{ color: pointerColor?.main || '#f97316' }}
          >
            → {block.points_to}
          </span>
        )}
      </td>

      {/* 역할 */}
      <td className="px-3 py-2 text-xs text-gray-600">
        {getRole()}
      </td>

      {/* 세그먼트 */}
      <td className="px-3 py-2">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: colors.bg,
            color: colors.main,
            border: `1px solid ${colors.border}`,
          }}
        >
          {segmentType === 'stack' ? 'Stack' : 'Heap'}
        </span>
      </td>
    </motion.tr>
  );
}

/**
 * 성장 방향 라벨
 */
function GrowthLabel({ type, rowCount }: { type: 'stack' | 'heap'; rowCount: number }) {
  const isStack = type === 'stack';
  const colors = SEGMENT_COLORS[type];

  if (rowCount === 0) return null;

  return (
    <div
      className="flex flex-col items-center justify-center px-2 text-xs"
      style={{ color: colors.main }}
    >
      <span className="font-semibold">{isStack ? 'Stack' : 'Heap'}</span>
      <span className="text-gray-500">{isStack ? '높은주소' : '낮은주소'}</span>
      <span className="text-lg">{isStack ? '↓' : '↑'}</span>
      <span className="text-gray-500">{isStack ? '낮은주소' : '높은주소'}</span>
    </div>
  );
}

export function CourseMemoryView({
  stack,
  heap,
  changedBlocks,
}: CourseMemoryViewProps) {
  // 포인터 인덱스 계산 (포인터 색상 구분용)
  const allBlocks = [...stack, ...heap];
  const pointerBlocks = allBlocks.filter((b) => b.points_to !== null);
  const getPointerIndex = (block: LessonMemoryBlock) => {
    if (block.points_to === null) return undefined;
    return pointerBlocks.findIndex((p) => p.name === block.name);
  };

  // Stack: 주소 내림차순 (높은 주소가 위, 낮은 주소가 아래)
  const sortedStack = [...stack].sort((a, b) => {
    const addrA = parseInt(a.address, 16);
    const addrB = parseInt(b.address, 16);
    return addrB - addrA; // 내림차순
  });

  // Heap: 주소 오름차순 (낮은 주소가 위, 높은 주소가 아래)
  const sortedHeap = [...heap].sort((a, b) => {
    const addrA = parseInt(a.address, 16);
    const addrB = parseInt(b.address, 16);
    return addrA - addrB; // 오름차순
  });

  const isEmpty = stack.length === 0 && heap.length === 0;

  return (
    <div className="h-full flex gap-2 overflow-auto p-2">
      {/* 메인 테이블 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">주소</th>
              <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">변수</th>
              <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">값</th>
              <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide text-center">ptr</th>
              <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">역할</th>
              <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase tracking-wide">세그먼트</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {isEmpty ? (
                <tr>
                  <td colSpan={6} className="text-sm text-gray-500 italic py-8 text-center">
                    메모리 할당 없음
                  </td>
                </tr>
              ) : (
                <>
                  {/* Stack 영역 */}
                  {sortedStack.map((block) => (
                    <MemoryRow
                      key={`stack-${block.name}`}
                      block={block}
                      isChanged={changedBlocks.includes(block.name)}
                      segmentType="stack"
                      pointerIndex={getPointerIndex(block)}
                    />
                  ))}

                  {/* 구분선 (Stack과 Heap 사이) */}
                  {stack.length > 0 && heap.length > 0 && (
                    <tr>
                      <td colSpan={6} className="py-2">
                        <div className="border-t-2 border-dashed border-gray-300" />
                      </td>
                    </tr>
                  )}

                  {/* Heap 영역 */}
                  {sortedHeap.map((block) => (
                    <MemoryRow
                      key={`heap-${block.name}`}
                      block={block}
                      isChanged={changedBlocks.includes(block.name)}
                      segmentType="heap"
                      pointerIndex={getPointerIndex(block)}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* 오른쪽 성장 방향 라벨 */}
      {!isEmpty && (
        <div className="flex flex-col justify-between shrink-0 border-l border-gray-200 pl-2">
          <GrowthLabel type="stack" rowCount={stack.length} />
          <GrowthLabel type="heap" rowCount={heap.length} />
        </div>
      )}
    </div>
  );
}
