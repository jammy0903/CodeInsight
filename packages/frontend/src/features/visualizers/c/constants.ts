/**
 * Memory Visualization Constants
 * 메모리 시각화 색상 상수
 *
 * 색상 철학: Light Neon Highlighter 느낌
 * - Stack: 부드러운 보라색 (연한 형광펜)
 * - Heap: 부드러운 초록색 (연한 형광펜)
 * - 포인터들: 밝고 생생한 형광색 계열
 * - 변경: 밝은 노란색 형광펜
 */

// 메모리 세그먼트 색상 (인라인 스타일용 hex)
// Light neon highlighter style - 더 밝고 부드러운 색상
export const SEGMENT_COLORS = {
  stack: {
    main: '#c084fc',           // 연한 형광 보라색 (lighter purple)
    bg: 'rgba(192, 132, 252, 0.08)',     // 매우 밝은 배경
    headerBg: 'rgba(192, 132, 252, 0.20)', // 밝은 헤더 배경
    border: 'rgba(192, 132, 252, 0.5)',    // 더 선명한 테두리
  },
  heap: {
    main: '#4ade80',           // 연한 형광 초록색 (lighter green)
    bg: 'rgba(74, 222, 128, 0.08)',      // 매우 밝은 배경
    headerBg: 'rgba(74, 222, 128, 0.20)', // 밝은 헤더 배경
    border: 'rgba(74, 222, 128, 0.5)',     // 더 선명한 테두리
  },
} as const;

// 포인터별 색상 팔레트 (최대 6개 포인터 지원, 순환)
// Light neon highlighter style - 밝고 생생한 형광색
export const POINTER_PALETTE = [
  { main: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.6)', glow: 'rgba(251, 146, 60, 0.3)' },  // 밝은 오렌지 (neon orange)
  { main: '#06d6a6', bg: 'rgba(6, 214, 166, 0.12)', border: 'rgba(6, 214, 166, 0.6)', glow: 'rgba(6, 214, 166, 0.3)' },    // 청록색 형광펜 (cyan-green)
  { main: '#ff6b9d', bg: 'rgba(255, 107, 157, 0.12)', border: 'rgba(255, 107, 157, 0.6)', glow: 'rgba(255, 107, 157, 0.3)' }, // 밝은 핑크 형광펜
  { main: '#bfff00', bg: 'rgba(191, 255, 0, 0.12)', border: 'rgba(191, 255, 0, 0.6)', glow: 'rgba(191, 255, 0, 0.3)' }, // 형광 라임
  { main: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)', border: 'rgba(167, 139, 250, 0.6)', glow: 'rgba(167, 139, 250, 0.3)' }, // 형광 보라색
  { main: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.6)', glow: 'rgba(251, 191, 36, 0.3)' }, // 형광 노란색
] as const;

/**
 * 포인터 인덱스로 색상 가져오기 (순환)
 * @param index - 포인터 인덱스 (0부터 시작)
 */
export function getPointerColor(index: number) {
  return POINTER_PALETTE[index % POINTER_PALETTE.length];
}
