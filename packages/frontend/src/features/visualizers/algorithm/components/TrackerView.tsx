/**
 * TrackerView - 변수 추적 시각화
 *
 * 그리디, 투포인터, 슬라이딩 윈도우 등에서
 * 변수 상태 카드 + 히스토리 테이블을 표시.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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

interface TrackerViewProps {
  data: TrackerData;
  prevData?: TrackerData | null;
}

// ============================================
// 색상 설정
// ============================================

const CARD_COLORS = [
  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af', label: '#3b82f6' },
  { bg: '#f0fdf4', border: '#86efac', text: '#166534', label: '#22c55e' },
  { bg: '#fefce8', border: '#fde047', text: '#854d0e', label: '#eab308' },
  { bg: '#fdf2f8', border: '#f9a8d4', text: '#9d174d', label: '#ec4899' },
  { bg: '#f5f3ff', border: '#c4b5fd', text: '#5b21b6', label: '#8b5cf6' },
  { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', label: '#f97316' },
];

// ============================================
// VariableCard 컴포넌트
// ============================================

const VariableCard = memo(function VariableCard({
  variable,
  colorIndex,
}: {
  variable: TrackerVariable;
  colorIndex: number;
}) {
  const color = CARD_COLORS[colorIndex % CARD_COLORS.length];
  const hasChanged = variable.prev !== undefined && variable.prev !== variable.value;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border-2 overflow-hidden min-w-[100px]
        ${variable.highlight ? 'ring-2 ring-amber-400 shadow-lg' : 'shadow-sm'}
      `}
      style={{
        borderColor: variable.highlight ? '#fbbf24' : color.border,
        backgroundColor: color.bg,
      }}
    >
      {/* Label */}
      <div
        className="px-3 py-1.5 text-xs font-bold font-mono text-center"
        style={{ backgroundColor: color.border + '40', color: color.label }}
      >
        {variable.name}
      </div>

      {/* Value */}
      <div className="px-3 py-3 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={String(variable.value)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold font-mono"
            style={{ color: color.text }}
          >
            {String(variable.value)}
          </motion.div>
        </AnimatePresence>

        {/* Previous value */}
        {hasChanged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-400 mt-1 font-mono line-through"
          >
            {String(variable.prev)}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// HistoryTable 컴포넌트
// ============================================

const HistoryTable = memo(function HistoryTable({
  history,
  variables,
}: {
  history: TrackerHistory[];
  variables: TrackerVariable[];
}) {
  const varNames = variables.map(v => v.name);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 border-b-2 border-gray-200">
              단계
            </th>
            {varNames.map((name, i) => (
              <th
                key={name}
                className="px-3 py-2 text-center text-xs font-bold font-mono border-b-2"
                style={{
                  color: CARD_COLORS[i % CARD_COLORS.length].label,
                  borderBottomColor: CARD_COLORS[i % CARD_COLORS.length].border,
                }}
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((row, rowIdx) => (
            <motion.tr
              key={rowIdx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIdx * 0.05 }}
              className={`
                border-b border-gray-100
                ${row.highlight ? 'bg-amber-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              `}
            >
              <td className="px-3 py-2 text-xs text-gray-600 font-medium whitespace-nowrap">
                {row.highlight && <span className="mr-1">&#x25B6;</span>}
                {row.step}
              </td>
              {varNames.map((name) => (
                <td
                  key={name}
                  className="px-3 py-2 text-center font-mono text-sm font-semibold"
                  style={{ color: '#374151' }}
                >
                  {row.values[name] !== undefined ? String(row.values[name]) : '-'}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ============================================
// TrackerView 메인 컴포넌트
// ============================================

export const TrackerView = memo(function TrackerView({
  data,
}: TrackerViewProps) {
  const { t } = useTranslation();
  if (!data || !data.variables) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>{t("visualizer.txt_bfda0c")}</p>
      </div>
    );
  }

  return (
    <div className="tracker-view p-4">
      {/* Variable Cards */}
      <div className="flex flex-wrap gap-3 justify-center mb-4">
        {data.variables.map((v, i) => (
          <VariableCard key={v.name} variable={v} colorIndex={i} />
        ))}
      </div>

      {/* Note */}
      {data.note && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg text-sm"
          style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}
        >
          <span style={{ fontSize: '1em' }}>&#x1F4A1;</span>
          <span>{data.note}</span>
        </motion.div>
      )}

      {/* History Table */}
      {data.history && data.history.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-500">{t("visualizer.txt_df4c59")}</span>
          </div>
          <HistoryTable history={data.history} variables={data.variables} />
        </div>
      )}
    </div>
  );
});

export default TrackerView;
