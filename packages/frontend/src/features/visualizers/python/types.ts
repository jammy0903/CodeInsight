/**
 * Python Visualizer Types
 * 참조 기반 객체 모델 시각화를 위한 타입 정의
 */

import type { PyName, PyObject, PyChange } from '@/types/py-simulator';

/** Python 시각화 상태 */
export interface PyVisualizationState {
  names: PyName[];
  objects: PyObject[];
  changes?: PyChange[];
}

/** PyVisualizerView Props */
export interface PyVisualizerViewProps {
  state: PyVisualizationState;
  animate?: boolean;
  compact?: boolean;
}

/** NamesPanel Props */
export interface NamesPanelProps {
  names: PyName[];
  highlightedNames?: string[];
  onNameHover?: (name: string | null) => void;
  hoveredName?: string | null;
}

/** ObjectsPanel Props */
export interface ObjectsPanelProps {
  objects: PyObject[];
  highlightedObjects?: string[];
  hoveredObjectId?: string | null;
  nameToObjectMap?: Map<string, string>;
}

/** ObjectCard Props */
export interface ObjectCardProps {
  object: PyObject;
  isHighlighted?: boolean;
  isReferenced?: boolean;
  refCount?: number;
}

/** ReferenceArrow Props */
export interface ReferenceArrowProps {
  fromId: string;
  toId: string;
  color: string;
  isActive?: boolean;
  animate?: boolean;
}

/** 위치 정보 (화살표 그리기용) */
export interface ElementPosition {
  id: string;
  rect: DOMRect;
}
