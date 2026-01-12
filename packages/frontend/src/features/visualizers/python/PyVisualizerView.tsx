/**
 * PyVisualizerView - Python 참조 모델 시각화 메인 컴포넌트
 *
 * 구조:
 * ┌──────────────────────────────────┐
 * │ NamesPanel (변수 이름들)         │
 * │ ┌───┐ ┌───┐ ┌───┐               │
 * │ │ a │ │ b │ │ c │               │
 * │ └─┬─┘ └─┬─┘ └─┬─┘               │
 * │   │     │     │ (화살표)         │
 * ├───┼─────┼─────┼──────────────────┤
 * │   ▼     ▼     ▼                  │
 * │ ObjectsPanel (객체들)            │
 * │ ┌─────┐ ┌─────┐ ┌─────────┐     │
 * │ │obj_1│ │obj_2│ │obj_3    │     │
 * │ │ 42  │ │"hi" │ │[1,2,3]  │     │
 * │ └─────┘ └─────┘ └─────────┘     │
 * └──────────────────────────────────┘
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { PyName, PyObject, PyChange } from '@/types/py-simulator';
import { NamesPanel } from './components/NamesPanel';
import { ObjectsPanel } from './components/ObjectsPanel';
import { ReferenceArrow, ArrowOverlay } from './components/ReferenceArrow';

export interface PyVisualizerViewProps {
  names: PyName[];
  objects: PyObject[];
  changes?: PyChange[];
  animate?: boolean;
  compact?: boolean;
}

export function PyVisualizerView({
  names,
  objects,
  changes = [],
  animate = true,
  compact = false,
}: PyVisualizerViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [arrowPositions, setArrowPositions] = useState<ArrowPosition[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 변경된 이름/객체 추출
  const highlightedNames = changes
    .filter((c) => c.name)
    .map((c) => c.name as string);

  const highlightedObjects = changes.map((c) => c.objectId);

  // 이름 → 객체 매핑
  const nameToObjectMap = new Map<string, string>();
  names.forEach((n) => nameToObjectMap.set(n.name, n.pointsTo));

  // 화살표 위치 계산
  const calculateArrows = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    setContainerSize({
      width: containerRect.width,
      height: containerRect.height,
    });

    const arrows: ArrowPosition[] = [];

    names.forEach((pyName) => {
      const nameEl = container.querySelector(
        `[data-name-id="${pyName.name}"]`
      ) as HTMLElement;
      const objectEl = container.querySelector(
        `[data-object-id="${pyName.pointsTo}"]`
      ) as HTMLElement;

      if (nameEl && objectEl) {
        const nameRect = nameEl.getBoundingClientRect();
        const objectRect = objectEl.getBoundingClientRect();

        arrows.push({
          id: `${pyName.name}->${pyName.pointsTo}`,
          from: {
            x: nameRect.left - containerRect.left + nameRect.width / 2,
            y: nameRect.bottom - containerRect.top,
          },
          to: {
            x: objectRect.left - containerRect.left + objectRect.width / 2,
            y: objectRect.top - containerRect.top,
          },
          name: pyName.name,
          objectId: pyName.pointsTo,
        });
      }
    });

    setArrowPositions(arrows);
  }, [names]);

  // 위치 재계산 (리사이즈, 데이터 변경 시)
  useEffect(() => {
    calculateArrows();

    const resizeObserver = new ResizeObserver(() => {
      calculateArrows();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [calculateArrows, names, objects]);

  return (
    <div
      ref={containerRef}
      className={`relative ${compact ? 'space-y-2' : 'space-y-4'}`}
    >
      {/* Names Panel */}
      <NamesPanel
        names={names}
        highlightedNames={highlightedNames}
        hoveredName={hoveredName}
        onNameHover={setHoveredName}
      />

      {/* Objects Panel */}
      <ObjectsPanel
        objects={objects}
        highlightedObjects={highlightedObjects}
        hoveredObjectId={null}
        nameToObjectMap={nameToObjectMap}
        hoveredName={hoveredName}
      />

      {/* Arrow Overlay */}
      {containerSize.width > 0 && (
        <ArrowOverlay
          width={containerSize.width}
          height={containerSize.height}
        >
          {arrowPositions.map((arrow) => (
            <ReferenceArrow
              key={arrow.id}
              from={arrow.from}
              to={arrow.to}
              isActive={hoveredName === arrow.name}
              isNew={highlightedNames.includes(arrow.name)}
              animate={animate}
            />
          ))}
        </ArrowOverlay>
      )}
    </div>
  );
}

interface ArrowPosition {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  name: string;
  objectId: string;
}

export default PyVisualizerView;
