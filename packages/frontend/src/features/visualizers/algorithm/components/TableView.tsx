/**
 * TableView - DP 테이블 시각화
 *
 * 1D/2D 그리드로 DP 테이블을 표시.
 * - 현재 계산 중인 셀, 참조 중인 셀, 최적 경로 하이라이트
 * - 수식(formula) 표시
 * - 화살표(arrows)로 의존 관계 표시
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// 타입 정의
// ============================================

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

interface TableViewProps {
  data: TableData;
  prevData?: TableData | null;
}

// ============================================
// 색상 설정
// ============================================

const HIGHLIGHT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  current: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  computed: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  reading: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  optimal: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
};

// ============================================
// TableView 메인 컴포넌트
// ============================================

export const TableView = memo(function TableView({
  data,
}: TableViewProps) {
  const { t } = useTranslation();
  const tableRows = data?.data ?? [];
  const highlights = data?.highlights;

  const highlightMap = useMemo(() => {
    const map = new Map<string, TableHighlight>();
    highlights?.forEach(h => {
      map.set(`${h.row}-${h.col}`, h);
    });
    return map;
  }, [highlights]);

  if (!data || tableRows.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>{t("visualizer.txt_22a468")}</p>
      </div>
    );
  }
  const is1D = data.dimensions === 1 || tableRows.length === 1;
  const rows = tableRows;
  const colHeaders = data.headers?.cols;
  const rowHeaders = data.headers?.rows;

  return (
    <div className="table-view p-4">
      {/* Formula */}
      {data.formula && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg text-sm font-mono"
          style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#5b21b6' }}
        >
          <span style={{ fontSize: '1em' }}>&#x1F4D0;</span>
          <span>{data.formula}</span>
        </motion.div>
      )}

      {/* Table */}
      <div className="overflow-x-auto flex justify-center">
        <table className="border-collapse">
          {/* Column headers */}
          {colHeaders && (
            <thead>
              <tr>
                {rowHeaders && <th className="w-10" />}
                {colHeaders.map((h, i) => (
                  <th
                    key={i}
                    className="px-1 py-1 text-[10px] font-mono text-gray-400 font-semibold text-center"
                    style={{ minWidth: is1D ? '48px' : '40px' }}
                  >
                    {String(h)}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {/* Row header */}
                {rowHeaders && (
                  <td className="pr-2 text-[10px] font-mono text-gray-400 font-semibold text-right">
                    {String(rowHeaders[rowIdx] ?? rowIdx)}
                  </td>
                )}

                {/* Cells */}
                {row.map((cell, colIdx) => {
                  const highlight = highlightMap.get(`${rowIdx}-${colIdx}`);
                  const hColor = highlight ? (HIGHLIGHT_COLORS[highlight.state || 'current'] || HIGHLIGHT_COLORS.current) : null;

                  return (
                    <td key={colIdx} className="p-0.5">
                      <motion.div
                        layout
                        className={`
                          flex items-center justify-center font-mono text-sm font-semibold
                          rounded-lg border-2
                          ${is1D ? 'w-12 h-12' : 'w-10 h-10'}
                          ${highlight ? 'shadow-md' : 'shadow-sm'}
                        `}
                        style={{
                          backgroundColor: hColor ? hColor.bg : cell === null ? '#f9fafb' : '#ffffff',
                          borderColor: hColor ? hColor.border : '#e5e7eb',
                          color: hColor ? hColor.text : cell === null ? '#d1d5db' : '#374151',
                        }}
                        animate={
                          highlight?.state === 'current'
                            ? { scale: [1, 1.05, 1] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.3 }}
                      >
                        {cell !== null ? String(cell) : '-'}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Arrows (simplified text representation) */}
      {data.arrows && data.arrows.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 justify-center text-xs text-gray-500">
          {data.arrows.map((arrow, i) => (
            <span key={i} className="font-mono">
              [{arrow.from.row},{arrow.from.col}] &#x2192; [{arrow.to.row},{arrow.to.col}]
            </span>
          ))}
        </div>
      )}

      {/* Note */}
      {data.note && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 mt-4 rounded-lg text-sm"
          style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <span style={{ fontSize: '1em' }}>&#x1F4A1;</span>
          <span>{data.note}</span>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {Object.entries(HIGHLIGHT_COLORS).map(([state, color]) => (
          <div key={state} className="flex items-center gap-1 text-[10px]">
            <div
              className="w-3 h-3 rounded border-2"
              style={{ backgroundColor: color.bg, borderColor: color.border }}
            />
            <span className="text-gray-500">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default TableView;
