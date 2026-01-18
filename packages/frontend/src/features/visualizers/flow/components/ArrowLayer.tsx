/**
 * ArrowLayer Component
 *
 * 포인터/참조 화살표를 SVG로 렌더링
 * - 변수 간 연결선
 * - 애니메이션 지원 (Framer Motion)
 */

import { memo, useMemo, useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { FlowVariable } from '@codeinsight/shared';
import type { IFlowStyler, ArrowStyle } from '../adapters/base/types';
import { FLOW_SIZES } from '../styles';

// ============================================
// 타입 정의
// ============================================

interface ArrowLayerProps {
  /** 모든 변수들 */
  variables: FlowVariable[];
  /** 스타일러 */
  styler: IFlowStyler;
  /** 컨테이너 ref (위치 계산용) */
  containerRef?: React.RefObject<HTMLDivElement>;
}

interface ArrowData {
  id: string;
  from: FlowVariable;
  to: FlowVariable;
  style: ArrowStyle;
}

interface Position {
  x: number;
  y: number;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 두 점 사이의 베지어 곡선 경로 생성
 */
function createCurvePath(
  from: Position,
  to: Position,
  curveOffset: number = FLOW_SIZES.arrow.curveOffset
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // 수직 이동이 큰 경우 곡선 방향 조정
  const isVertical = Math.abs(dy) > Math.abs(dx);

  let controlX1, controlY1, controlX2, controlY2;

  if (isVertical) {
    controlX1 = from.x + curveOffset;
    controlY1 = from.y;
    controlX2 = to.x + curveOffset;
    controlY2 = to.y;
  } else {
    controlX1 = from.x;
    controlY1 = from.y + curveOffset;
    controlX2 = to.x;
    controlY2 = to.y - curveOffset;
  }

  return `M ${from.x} ${from.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${to.x} ${to.y}`;
}

// ============================================
// Arrow 컴포넌트
// ============================================

interface ArrowProps {
  data: ArrowData;
  fromPos: Position;
  toPos: Position;
}

const Arrow = memo(function Arrow({ data, fromPos, toPos }: ArrowProps) {
  const { style } = data;
  const path = createCurvePath(fromPos, toPos);

  return (
    <g className="arrow">
      {/* 화살표 마커 정의 */}
      <defs>
        <marker
          id={`arrowhead-${data.id}`}
          markerWidth={style.headSize}
          markerHeight={style.headSize}
          refX={style.headSize - 1}
          refY={style.headSize / 2}
          orient="auto"
        >
          <polygon
            points={`0 0, ${style.headSize} ${style.headSize / 2}, 0 ${style.headSize}`}
            fill={style.stroke}
            opacity={style.opacity ?? 1}
          />
        </marker>
      </defs>

      {/* 화살표 선 */}
      <motion.path
        d={path}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.dashArray}
        opacity={style.opacity ?? 1}
        markerEnd={`url(#arrowhead-${data.id})`}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: style.opacity ?? 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </g>
  );
});

// ============================================
// ArrowLayer 컴포넌트
// ============================================

export const ArrowLayer = memo(function ArrowLayer({
  variables,
  styler,
  containerRef,
}: ArrowLayerProps) {
  const [positions, setPositions] = useState<Map<string, Position>>(new Map());
  const svgRef = useRef<SVGSVGElement>(null);

  // 화살표 데이터 계산
  const arrows = useMemo(() => {
    const result: ArrowData[] = [];

    variables.forEach((variable) => {
      if (styler.shouldShowArrow(variable) && variable.pointsTo) {
        const target = variables.find((v) => v.id === variable.pointsTo);
        if (target) {
          result.push({
            id: `arrow-${variable.id}-${target.id}`,
            from: variable,
            to: target,
            style: styler.getArrowStyle(variable, target),
          });
        }
      }
    });

    return result;
  }, [variables, styler]);

  // 변수 위치 업데이트 (DOM에서 읽기)
  useEffect(() => {
    if (!containerRef?.current) return;

    const updatePositions = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newPositions = new Map<string, Position>();

      variables.forEach((variable) => {
        const element = container.querySelector(`[data-variable-id="${variable.id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          newPositions.set(variable.id, {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2,
          });
        }
      });

      setPositions(newPositions);
    };

    // 초기 위치 계산
    updatePositions();

    // ResizeObserver로 크기 변경 감지
    const observer = new ResizeObserver(updatePositions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [variables, containerRef]);

  // 화살표가 없으면 렌더링하지 않음
  if (arrows.length === 0) {
    return null;
  }

  return (
    <svg
      ref={svgRef}
      className="arrow-layer absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 10 }}
    >
      {arrows.map((arrow) => {
        const fromPos = positions.get(arrow.from.id);
        const toPos = positions.get(arrow.to.id);

        // 위치가 아직 계산되지 않았으면 렌더링하지 않음
        if (!fromPos || !toPos) return null;

        return (
          <Arrow
            key={arrow.id}
            data={arrow}
            fromPos={fromPos}
            toPos={toPos}
          />
        );
      })}
    </svg>
  );
});

export default ArrowLayer;
