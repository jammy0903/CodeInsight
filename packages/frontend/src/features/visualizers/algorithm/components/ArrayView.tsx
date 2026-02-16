/**
 * ArrayView - 배열 시각화
 *
 * 정렬, 이진탐색 등에서 배열 상태를 가로 박스 + 포인터 마커로 표시.
 * - 각 셀의 state로 색상 구분 (comparing, swapping, sorted, pivot, found)
 * - 포인터(left, right, mid 등) 표시
 * - 영역(region) 하이라이트
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// 타입 정의
// ============================================

interface ArrayCell {
  value: number | string;
  state?: 'default' | 'comparing' | 'swapping' | 'sorted' | 'pivot' | 'found';
}

interface ArrayPointer {
  label: string;
  index: number;
  color?: string;
}

interface ArrayRegion {
  from: number;
  to: number;
  label?: string;
  color?: string;
}

interface ArrayData {
  values: ArrayCell[];
  pointers?: ArrayPointer[];
  regions?: ArrayRegion[];
  note?: string;
}

interface ArrayViewProps {
  data: ArrayData;
  prevData?: ArrayData | null;
}

// ============================================
// 색상 설정
// ============================================

const CELL_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  default: { bg: '#ffffff', border: '#d1d5db', text: '#374151' },
  comparing: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  swapping: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  sorted: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  pivot: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  found: { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
};

const POINTER_COLORS = ['#3b82f6', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'];

// ============================================
// ArrayCell 컴포넌트
// ============================================

const ArrayCellBox = memo(function ArrayCellBox({
  cell,
  index,
}: {
  cell: ArrayCell;
  index: number;
}) {
  const state = cell.state || 'default';
  const color = CELL_COLORS[state] || CELL_COLORS.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center"
    >
      {/* Index */}
      <span className="text-[10px] text-gray-400 font-mono mb-1">{index}</span>

      {/* Cell */}
      <motion.div
        className={`
          w-12 h-12 flex items-center justify-center
          rounded-lg border-2 font-mono font-bold text-sm
          ${state !== 'default' ? 'shadow-md' : 'shadow-sm'}
        `}
        style={{
          backgroundColor: color.bg,
          borderColor: color.border,
          color: color.text,
        }}
        animate={{
          scale: state === 'swapping' ? [1, 1.1, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={String(cell.value)}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
          >
            {String(cell.value)}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});

// ============================================
// PointerMarker 컴포넌트
// ============================================

const PointerMarker = memo(function PointerMarker({
  pointer,
  colorIndex,
}: {
  pointer: ArrayPointer;
  colorIndex: number;
}) {
  const color = pointer.color || POINTER_COLORS[colorIndex % POINTER_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center"
      style={{
        position: 'absolute',
        left: `${pointer.index * 60 + 24}px`,
        bottom: '-28px',
        transform: 'translateX(-50%)',
      }}
    >
      <span style={{ color, fontSize: '14px', lineHeight: 1 }}>&#x25B2;</span>
      <span
        className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded mt-0.5"
        style={{ color: '#fff', backgroundColor: color }}
      >
        {pointer.label}
      </span>
    </motion.div>
  );
});

// ============================================
// ArrayView 메인 컴포넌트
// ============================================

export const ArrayView = memo(function ArrayView({
  data,
}: ArrayViewProps) {
  if (!data || !data.values) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>배열 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="array-view p-4">
      {/* Array */}
      <div className="flex justify-center mb-8">
        <div className="relative inline-flex gap-1.5 pb-8">
          {/* Region highlights (behind cells) */}
          {data.regions?.map((region, i) => {
            const regionColor = region.color || '#e0e7ff';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute rounded-lg"
                style={{
                  left: `${region.from * 60 - 4}px`,
                  width: `${(region.to - region.from + 1) * 60 - 2}px`,
                  top: '8px',
                  bottom: '32px',
                  backgroundColor: regionColor + '30',
                  border: `2px dashed ${regionColor}`,
                  zIndex: 0,
                }}
              >
                {region.label && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: regionColor, color: '#fff' }}
                  >
                    {region.label}
                  </span>
                )}
              </motion.div>
            );
          })}

          {/* Cells */}
          {data.values.map((cell, i) => (
            <div key={i} className="relative z-10" style={{ width: '48px', margin: '0 6px' }}>
              <ArrayCellBox cell={cell} index={i} />
            </div>
          ))}

          {/* Pointers */}
          {data.pointers?.map((ptr, i) => (
            <PointerMarker key={ptr.label} pointer={ptr} colorIndex={i} />
          ))}
        </div>
      </div>

      {/* Note */}
      {data.note && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <span style={{ fontSize: '1em' }}>&#x1F4A1;</span>
          <span>{data.note}</span>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {Object.entries(CELL_COLORS).filter(([k]) => k !== 'default').map(([state, color]) => (
          <div key={state} className="flex items-center gap-1 text-[10px]">
            <div
              className="w-3 h-3 rounded border"
              style={{ backgroundColor: color.bg, borderColor: color.border }}
            />
            <span className="text-gray-500">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ArrayView;
