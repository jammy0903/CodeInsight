/**
 * AlgorithmView - 알고리즘 시각화 라우터
 *
 * algorithmState.subType에 따라 적절한 서브뷰로 라우팅.
 * - tracker: 변수 카드 + 히스토리 (그리디, 투포인터)
 * - array: 배열 박스 + 포인터 (정렬, 이진탐색)
 * - table: DP 테이블 (1D/2D 그리드)
 * - graph: SVG 노드+엣지 (BFS/DFS, 최단경로)
 */

import { memo } from 'react';
import { TrackerView } from './components/TrackerView';
import { ArrayView } from './components/ArrayView';
import { TableView } from './components/TableView';
import { GraphView } from './components/GraphView';

// ============================================
// 타입 정의
// ============================================

interface TrackerVariable {
  name: string;
  value: string | number;
  highlight?: boolean;
  prev?: string | number;
}

interface TrackerHistory {
  step: string;
  values: Record<string, string | number>;
  highlight?: boolean;
}

interface TrackerData {
  variables: TrackerVariable[];
  history?: TrackerHistory[];
  note?: string;
}

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

interface TableHighlight {
  row: number;
  col: number;
  state?: 'current' | 'computed' | 'reading' | 'optimal';
}

interface TableArrow {
  from: { row: number; col: number };
  to: { row: number; col: number };
}

interface TableData {
  dimensions: 1 | 2;
  headers?: { rows?: (string | number)[]; cols?: (string | number)[] };
  data: (number | string | null)[][];
  highlights?: TableHighlight[];
  formula?: string;
  arrows?: TableArrow[];
  note?: string;
}

interface GraphNode {
  id: string;
  label?: string;
  state?: 'default' | 'current' | 'visited' | 'queued' | 'discovered' | 'finished';
  distance?: number | string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
  directed?: boolean;
  state?: 'default' | 'active' | 'relaxed' | 'tree' | 'back';
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  queue?: string[];
  queueLabel?: string;
  note?: string;
}

export interface AlgorithmState {
  subType: 'array' | 'table' | 'graph' | 'tracker';
  tracker?: TrackerData;
  array?: ArrayData;
  table?: TableData;
  graph?: GraphData;
}

interface AlgorithmViewProps {
  algorithmState: AlgorithmState;
  prevAlgorithmState?: AlgorithmState | null;
}

// ============================================
// 메인 컴포넌트
// ============================================

export const AlgorithmView = memo(function AlgorithmView({
  algorithmState,
  prevAlgorithmState,
}: AlgorithmViewProps) {
  if (!algorithmState || !algorithmState.subType) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>알고리즘 시각화 데이터가 없습니다</p>
      </div>
    );
  }

  switch (algorithmState.subType) {
    case 'tracker':
      return (
        <TrackerView
          data={algorithmState.tracker!}
          prevData={prevAlgorithmState?.tracker}
        />
      );
    case 'array':
      return (
        <ArrayView
          data={algorithmState.array!}
          prevData={prevAlgorithmState?.array}
        />
      );
    case 'table':
      return (
        <TableView
          data={algorithmState.table!}
          prevData={prevAlgorithmState?.table}
        />
      );
    case 'graph':
      return (
        <GraphView
          data={algorithmState.graph!}
          prevData={prevAlgorithmState?.graph}
        />
      );
    default:
      return (
        <div className="p-4 text-center text-gray-400">
          <p>알 수 없는 알고리즘 서브타입: {algorithmState.subType}</p>
        </div>
      );
  }
});

export default AlgorithmView;
