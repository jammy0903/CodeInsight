/**
 * ObjectsPanel - Python 객체 영역
 * 모든 객체를 그리드로 표시
 */

import type { PyObject } from '@/types/py-simulator';
import { ObjectCard } from './ObjectCard';

interface ObjectsPanelProps {
  objects: PyObject[];
  highlightedObjects?: string[];
  hoveredObjectId: string | null;
  nameToObjectMap: Map<string, string>;
  hoveredName: string | null;
}

export function ObjectsPanel({
  objects,
  highlightedObjects = [],
  hoveredObjectId,
  nameToObjectMap,
  hoveredName,
}: ObjectsPanelProps) {
  // 참조 카운트 계산
  const refCounts = new Map<string, number>();
  nameToObjectMap.forEach((objectId) => {
    refCounts.set(objectId, (refCounts.get(objectId) ?? 0) + 1);
  });

  // 호버된 이름이 가리키는 객체 ID
  const hoveredTargetId = hoveredName ? nameToObjectMap.get(hoveredName) : null;

  return (
    <div className="p-4 bg-[var(--theme-dashboard-card-bg)] rounded-lg border border-[var(--theme-dashboard-card-border)]">
      <h3 className="text-sm font-semibold text-[var(--theme-dashboard-text-muted)] mb-3">
        Objects (객체)
      </h3>

      <div className="flex flex-wrap gap-3">
        {objects.map((obj) => (
          <ObjectCard
            key={obj.id}
            object={obj}
            allObjects={objects}
            isHighlighted={highlightedObjects.includes(obj.id)}
            isReferenced={
              hoveredObjectId === obj.id || hoveredTargetId === obj.id
            }
            refCount={refCounts.get(obj.id)}
          />
        ))}

        {objects.length === 0 && (
          <div className="text-sm text-[var(--theme-dashboard-text-muted)] italic">
            아직 객체가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
