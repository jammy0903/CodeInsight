/**
 * Reference Arrows
 * Stack 변수에서 Heap 객체로의 참조 화살표
 */

import React, { useEffect, useRef, useState } from 'react';
import { StackSnapshot, HeapSnapshot } from '../memory-types';

export interface ReferenceArrowsProps {
  stack: StackSnapshot;
  heap: HeapSnapshot;
  theme: 'dark' | 'soft' | 'minimal';
}

interface Arrow {
  from: { x: number; y: number };
  to: { x: number; y: number };
  varName: string;
  objectId: string;
}

export function ReferenceArrows({ stack, heap, theme }: ReferenceArrowsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  useEffect(() => {
    // 참조 화살표 계산
    const newArrows: Arrow[] = [];

    stack.frames.forEach((frame) => {
      frame.localVariables.forEach(([varName, value]) => {
        if (value.isReference && value.objectId) {
          // Stack 변수 위치 가져오기
          const varElement = document.querySelector(
            `[data-var-name="${varName}"]`
          );

          // Heap 객체 위치 가져오기
          const objElement = document.querySelector(
            `[data-object-id="${value.objectId}"]`
          );

          if (varElement && objElement && svgRef.current) {
            const svgRect = svgRef.current.getBoundingClientRect();
            const varRect = varElement.getBoundingClientRect();
            const objRect = objElement.getBoundingClientRect();

            newArrows.push({
              from: {
                x: varRect.right - svgRect.left,
                y: varRect.top + varRect.height / 2 - svgRect.top,
              },
              to: {
                x: objRect.left - svgRect.left,
                y: objRect.top + objRect.height / 2 - svgRect.top,
              },
              varName,
              objectId: value.objectId,
            });
          }
        }
      });
    });

    setArrows(newArrows);
  }, [stack, heap]);

  const getArrowColor = (theme: string): string => {
    switch (theme) {
      case 'dark':
        return '#fbbf24';
      case 'soft':
        return '#ea580c';
      case 'minimal':
        return '#dc2626';
      default:
        return '#fbbf24';
    }
  };

  return (
    <svg
      ref={svgRef}
      className="reference-arrows"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={getArrowColor(theme)}
          />
        </marker>
      </defs>

      {arrows.map((arrow, index) => {
        const { from, to } = arrow;
        const midX = (from.x + to.x) / 2;

        // 곡선 경로 생성 (Cubic Bezier)
        const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;

        return (
          <path
            key={`${arrow.varName}-${arrow.objectId}-${index}`}
            d={path}
            stroke={getArrowColor(theme)}
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            opacity="0.8"
            className="arrow-path"
          />
        );
      })}

      <style jsx>{`
        .arrow-path {
          transition: opacity 0.2s ease;
        }

        .arrow-path:hover {
          opacity: 1;
          stroke-width: 3;
        }
      `}</style>
    </svg>
  );
}
