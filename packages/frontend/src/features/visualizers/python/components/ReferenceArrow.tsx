/**
 * ReferenceArrow - 이름 → 객체 연결 화살표
 * SVG 기반 베지어 곡선 화살표
 */

import { motion } from 'framer-motion';
import { ARROW_COLORS } from '../constants';

interface ReferenceArrowProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isActive?: boolean;
  isNew?: boolean;
  animate?: boolean;
}

export function ReferenceArrow({
  from,
  to,
  isActive = false,
  isNew = false,
  animate = true,
}: ReferenceArrowProps) {
  // 베지어 곡선 경로 계산
  const path = calculatePath(from, to);

  const color = isNew
    ? ARROW_COLORS.new
    : isActive
      ? ARROW_COLORS.active
      : ARROW_COLORS.inactive;

  return (
    <g>
      {/* 화살표 경로 */}
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 2.5 : 2}
        strokeLinecap="round"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          filter: isActive ? `drop-shadow(0 0 4px ${color})` : 'none',
        }}
      />

      {/* 화살표 머리 */}
      <motion.polygon
        points={calculateArrowHead(from, to)}
        fill={color}
        initial={animate ? { opacity: 0, scale: 0 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.2 }}
        style={{
          transformOrigin: 'center',
          filter: isActive ? `drop-shadow(0 0 4px ${color})` : 'none',
        }}
      />
    </g>
  );
}

/** 베지어 곡선 경로 계산 */
function calculatePath(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // 수직 연결 (이름 → 객체)
  const controlOffset = Math.abs(dy) * 0.5;

  const cp1x = from.x;
  const cp1y = from.y + controlOffset;
  const cp2x = to.x;
  const cp2y = to.y - controlOffset;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

/** 화살표 머리 좌표 계산 */
function calculateArrowHead(
  from: { x: number; y: number },
  to: { x: number; y: number }
): string {
  const size = 8;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

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

/** 화살표 오버레이 컨테이너 */
export function ArrowOverlay({
  children,
  width,
  height,
}: {
  children: React.ReactNode;
  width: number;
  height: number;
}) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      {children}
    </svg>
  );
}
