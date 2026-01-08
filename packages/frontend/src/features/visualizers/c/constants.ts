/**
 * Memory Visualization Constants
 * 메모리 시각화 색상 상수
 */

// 메모리 세그먼트 색상 (인라인 스타일용 hex)
export const SEGMENT_COLORS = {
  stack: {
    main: '#a855f7',      // purple-500
    bg: 'rgba(168, 85, 247, 0.1)',
    headerBg: 'rgba(168, 85, 247, 0.25)',
    border: 'rgba(168, 85, 247, 0.4)',
  },
  heap: {
    main: '#22c55e',      // green-500
    bg: 'rgba(34, 197, 94, 0.1)',
    headerBg: 'rgba(34, 197, 94, 0.25)',
    border: 'rgba(34, 197, 94, 0.4)',
  },
} as const;

// 포인터별 색상 팔레트 (최대 6개 포인터 지원, 순환)
export const POINTER_PALETTE = [
  { main: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.6)', glow: 'rgba(249, 115, 22, 0.4)' },  // orange
  { main: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.6)', glow: 'rgba(6, 182, 212, 0.4)' },    // cyan
  { main: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.6)', glow: 'rgba(236, 72, 153, 0.4)' }, // pink
  { main: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)', border: 'rgba(132, 204, 22, 0.6)', glow: 'rgba(132, 204, 22, 0.4)' }, // lime
  { main: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.6)', glow: 'rgba(139, 92, 246, 0.4)' }, // violet
  { main: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.6)', glow: 'rgba(245, 158, 11, 0.4)' }, // amber
] as const;

/**
 * 포인터 인덱스로 색상 가져오기 (순환)
 * @param index - 포인터 인덱스 (0부터 시작)
 */
export function getPointerColor(index: number) {
  return POINTER_PALETTE[index % POINTER_PALETTE.length];
}
