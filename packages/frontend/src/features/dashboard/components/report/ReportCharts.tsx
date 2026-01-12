/**
 * ReportCharts - PDF report charts (weekly + hourly)
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Calendar, Clock } from 'lucide-react';
import { REPORT_COLORS } from './colors';

interface WeeklyDataItem {
  day: string;
  count: number;
  unit?: string;
}

interface TimeSlotDataItem {
  slot: string;
  count: number;
  unit?: string;
}

interface ReportChartsProps {
  weeklyData: WeeklyDataItem[];
  timeSlotData: TimeSlotDataItem[];
}

export function ReportCharts({ weeklyData, timeSlotData }: ReportChartsProps) {
  const maxWeekly = Math.max(...weeklyData.map((d) => d.count));
  const mostActiveDay = weeklyData.find((d) => d.count === maxWeekly)?.day || '-';

  const maxTimeSlot = Math.max(...timeSlotData.map((d) => d.count));
  const mostActiveSlot = timeSlotData.find((d) => d.count === maxTimeSlot)?.slot || '-';

  const weeklyUnit = weeklyData[0]?.unit || '분';
  const timeSlotUnit = timeSlotData[0]?.unit || '분';

  const cardStyle = {
    backgroundColor: REPORT_COLORS.bg.light,
    borderRadius: '0.5rem',
    padding: '1rem',
    border: `1px solid ${REPORT_COLORS.border.light}`,
  };

  const badgeStyle = {
    fontSize: '0.75rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    backgroundColor: REPORT_COLORS.accent.purpleLight,
    color: REPORT_COLORS.accent.purpleDark,
  };

  return (
    <div className="keep-together mb-8 page-break-before">
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: REPORT_COLORS.text.secondary,
          marginBottom: '1rem',
        }}
      >
        학습 패턴 분석
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        {/* Weekly chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Calendar style={{ width: '1rem', height: '1rem', color: REPORT_COLORS.text.muted }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: REPORT_COLORS.text.secondary }}>
              요일별 학습
            </h3>
            <span style={badgeStyle}>{mostActiveDay}요일 가장 활발</span>
          </div>
          <div style={{ height: '10rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: REPORT_COLORS.text.muted }} />
                <YAxis tick={{ fontSize: 12, fill: REPORT_COLORS.text.muted }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [`${value}${weeklyUnit}`, '학습']}
                  contentStyle={{
                    fontSize: 12,
                    backgroundColor: REPORT_COLORS.bg.white,
                    border: `1px solid ${REPORT_COLORS.border.light}`,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? REPORT_COLORS.chart.active : REPORT_COLORS.chart.inactive}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time slot chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Clock style={{ width: '1rem', height: '1rem', color: REPORT_COLORS.text.muted }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: REPORT_COLORS.text.secondary }}>
              시간대별 학습
            </h3>
            <span style={badgeStyle}>{mostActiveSlot.split(' ')[0]} 선호</span>
          </div>
          <div style={{ height: '10rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12, fill: REPORT_COLORS.text.muted }} allowDecimals={false} />
                <YAxis
                  dataKey="slot"
                  type="category"
                  tick={{ fontSize: 11, fill: REPORT_COLORS.text.muted }}
                  width={85}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}${timeSlotUnit}`, '학습']}
                  contentStyle={{
                    fontSize: 12,
                    backgroundColor: REPORT_COLORS.bg.white,
                    border: `1px solid ${REPORT_COLORS.border.light}`,
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {timeSlotData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? REPORT_COLORS.chart.active : REPORT_COLORS.chart.inactive}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
