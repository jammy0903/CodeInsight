/**
 * PointerArrow - C 메모리 포인터 화살표 시각화
 *
 * SVG 기반 베지어 곡선 화살표
 * - 포인터 변수 → 타겟 메모리 주소 연결
 * - 크로스 프레임 지원 (swap.a → main.x)
 */

import { memo } from 'react';
import { motion } from 'framer-motion';

// ============================================
// 타입 정의
// ============================================

export interface PointerArrowProps {
  /** 시작점 (포인터 변수 위치) */
  from: { x: number; y: number };
  /** 종료점 (타겟 변수 위치) */
  to: { x: number; y: number };
  /** 강조 상태 (현재 스텝에서 사용 중) */
  isActive?: boolean;
  /** 새로 생성된 화살표 */
  isNew?: boolean;
  /** 크로스 프레임 여부 (다른 함수 변수 가리킴) */
  isCrossFrame?: boolean;
  /** 화살표 ID (SVG marker용) */
  id: string;
}

// ============================================
// 색상 정의
// ============================================

const POINTER_COLORS = {
  default: '#f97316', // orange-500
  active: '#ea580c', // orange-600
  new: '#22c55e', // green-500
  crossFrame: '#8b5cf6', // violet-500
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 두 점 사이의 베지어 곡선 경로 생성
 * 포인터 화살표는 오른쪽으로 꺾이는 곡선
 */
function createPointerPath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // 곡선 오프셋 계산 (거리에 비례)
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curveOffset = Math.min(Math.max(distance * 0.3, 20), 60);

  // 오른쪽으로 휘는 곡선 (S자 형태)
  const midX = (from.x + to.x) / 2 + curveOffset;
  const midY = (from.y + to.y) / 2;

  // Quadratic bezier for smoother curve
  const cp1x = from.x + curveOffset;
  const cp1y = from.y;
  const cp2x = to.x + curveOffset;
  const cp2y = to.y;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

/**
 * 화살표 머리 좌표 계산
 */
function calculateArrowHead(
  to: { x: number; y: number },
  angle: number,
  size: number = 8
): string {
  const tip = to;
  const left = {
    x: to.x - size * Math.cos(angle - Math.PI / 6),
    y: to.y - size * Math.sin(angle - Math.PI / 6),
  };
  const right = {
    x: to.x - size * Math.cos(angle + Math.PI / 6),
    y: to.y - size * Math.sin(angle + Math.PI / 6),
  };

  return `${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`;
}

// ============================================
// PointerArrow 컴포넌트
// ============================================

export const PointerArrow = memo(function PointerArrow({
  from,
  to,
  isActive = false,
  isNew = false,
  isCrossFrame = false,
  id,
}: PointerArrowProps) {
  // 색상 결정
  const color = isNew
    ? POINTER_COLORS.new
    : isCrossFrame
      ? POINTER_COLORS.crossFrame
      : isActive
        ? POINTER_COLORS.active
        : POINTER_COLORS.default;

  // 경로 계산
  const path = createPointerPath(from, to);

  // 화살표 머리 각도 계산 (종료점 방향)
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);

  const strokeWidth = isActive ? 2.5 : 2;

  return (
    <g className="pointer-arrow">
      {/* 화살표 경로 */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          filter: isActive ? `drop-shadow(0 0 4px ${color})` : 'none',
        }}
      />

      {/* 화살표 머리 */}
      <motion.polygon
        points={calculateArrowHead(to, angle)}
        fill={color}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
        style={{
          transformOrigin: `${to.x}px ${to.y}px`,
          filter: isActive ? `drop-shadow(0 0 4px ${color})` : 'none',
        }}
      />

      {/* 크로스 프레임 표시 (점선 효과) */}
      {isCrossFrame && (
        <motion.path
          d={path}
          fill="none"
          stroke="white"
          strokeWidth={1}
          strokeDasharray="4 4"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </g>
  );
});

// ============================================
// PointerArrowOverlay 컨테이너
// ============================================

export interface PointerArrowOverlayProps {
  children: React.ReactNode;
  width: number;
  height: number;
}

export function PointerArrowOverlay({
  children,
  width,
  height,
}: PointerArrowOverlayProps) {
  return (
    <svg
      className="pointer-arrow-overlay absolute inset-0 pointer-events-none overflow-visible"
      width={width}
      height={height}
      style={{ zIndex: 20 }}
    >
      {children}
    </svg>
  );
}

export default PointerArrow;
