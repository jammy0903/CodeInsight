/**
 * GraphView - 그래프 시각화
 *
 * BFS/DFS, 최단경로, 그래프이론 문제에서
 * SVG 노드+엣지 다이어그램 + 큐/스택 표시.
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

// ============================================
// 타입 정의
// ============================================

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

interface GraphViewProps {
  data: GraphData;
  prevData?: GraphData | null;
}

// ============================================
// 색상 설정
// ============================================

const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  default: { fill: '#ffffff', stroke: '#9ca3af', text: '#374151' },
  current: { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
  visited: { fill: '#d1fae5', stroke: '#10b981', text: '#065f46' },
  queued: { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e40af' },
  discovered: { fill: '#fce7f3', stroke: '#ec4899', text: '#9d174d' },
  finished: { fill: '#e5e7eb', stroke: '#6b7280', text: '#374151' },
};

const EDGE_COLORS: Record<string, string> = {
  default: '#d1d5db',
  active: '#f59e0b',
  relaxed: '#10b981',
  tree: '#3b82f6',
  back: '#ef4444',
};

const NODE_RADIUS = 24;
const SVG_PADDING = 40;

// ============================================
// 자동 레이아웃 (원형 배치)
// ============================================

function computeLayout(nodes: GraphNode[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const n = nodes.length;

  if (n === 0) return positions;

  // If all nodes have explicit positions, use them
  const allHavePositions = nodes.every(node => node.x !== undefined && node.y !== undefined);
  if (allHavePositions) {
    nodes.forEach(node => {
      positions.set(node.id, { x: node.x!, y: node.y! });
    });
    return positions;
  }

  // Circular layout
  const centerX = 160;
  const centerY = 130;
  const radius = Math.min(120, Math.max(60, n * 20));

  nodes.forEach((node, i) => {
    if (node.x !== undefined && node.y !== undefined) {
      positions.set(node.id, { x: node.x, y: node.y });
    } else {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  });

  return positions;
}

// ============================================
// GraphView 메인 컴포넌트
// ============================================

export const GraphView = memo(function GraphView({
  data,
}: GraphViewProps) {
  const nodes = data?.nodes;
  const edges = data?.edges ?? [];

  const positions = useMemo(() => computeLayout(nodes ?? []), [nodes]);

  // Compute SVG viewBox
  const viewBox = useMemo(() => {
    if (positions.size === 0) return '0 0 320 260';
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    positions.forEach(({ x, y }) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    const pad = SVG_PADDING + NODE_RADIUS;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [positions]);

  if (!data || !nodes || nodes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>그래프 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="graph-view p-4">
      {/* SVG Graph */}
      <div className="flex justify-center mb-4">
        <svg
          viewBox={viewBox}
          className="w-full max-w-md"
          style={{ maxHeight: '300px' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#9ca3af" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const fromPos = positions.get(edge.from);
            const toPos = positions.get(edge.to);
            if (!fromPos || !toPos) return null;

            const edgeColor = EDGE_COLORS[edge.state || 'default'] || EDGE_COLORS.default;
            const isActive = edge.state && edge.state !== 'default';

            // Compute line endpoints offset by node radius
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return null;

            const ux = dx / len;
            const uy = dy / len;
            const x1 = fromPos.x + ux * NODE_RADIUS;
            const y1 = fromPos.y + uy * NODE_RADIUS;
            const x2 = toPos.x - ux * (NODE_RADIUS + (edge.directed !== false ? 8 : 0));
            const y2 = toPos.y - uy * (NODE_RADIUS + (edge.directed !== false ? 8 : 0));

            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2;

            return (
              <g key={`${edge.from}-${edge.to}-${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edgeColor}
                  strokeWidth={isActive ? 3 : 2}
                  markerEnd={edge.directed !== false ? (isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)') : undefined}
                />
                {edge.weight !== undefined && (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fill={edgeColor}
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {edge.weight}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const state = node.state || 'default';
            const color = NODE_COLORS[state] || NODE_COLORS.default;

            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={state === 'current' ? 3 : 2}
                />
                <text
                  x={pos.x}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color.text}
                  fontSize="14"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.label || node.id}
                </text>
                {node.distance !== undefined && (
                  <text
                    x={pos.x}
                    y={pos.y + NODE_RADIUS + 14}
                    textAnchor="middle"
                    fill="#6b7280"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    d={String(node.distance)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Queue / Stack */}
      {data.queue && data.queue.length > 0 && (
        <div className="flex items-center gap-2 justify-center mb-4">
          <span className="text-xs font-semibold text-gray-500">
            {data.queueLabel || 'Queue'}:
          </span>
          <div className="flex gap-1">
            {data.queue.map((item, i) => (
              <motion.span
                key={`${item}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-2 py-1 rounded-md border text-xs font-mono font-bold"
                style={{
                  backgroundColor: '#dbeafe',
                  borderColor: '#93c5fd',
                  color: '#1e40af',
                }}
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      {data.note && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <span style={{ fontSize: '1em' }}>&#x1F4A1;</span>
          <span>{data.note}</span>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {Object.entries(NODE_COLORS).filter(([k]) => k !== 'default').map(([state, color]) => (
          <div key={state} className="flex items-center gap-1 text-[10px]">
            <div
              className="w-3 h-3 rounded-full border-2"
              style={{ backgroundColor: color.fill, borderColor: color.stroke }}
            />
            <span className="text-gray-500">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default GraphView;
