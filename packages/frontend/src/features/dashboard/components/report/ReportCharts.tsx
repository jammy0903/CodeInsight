/**
 * ReportCharts - PDF report charts (weekly + hourly)
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

// PDF-friendly colors
const CHART_COLORS = {
  active: '#8b5cf6',
  inactive: '#e5e7eb',
};

export function ReportCharts({ weeklyData, timeSlotData }: ReportChartsProps) {
  // Find most active day/slot
  const maxWeekly = Math.max(...weeklyData.map((d) => d.count));
  const mostActiveDay = weeklyData.find((d) => d.count === maxWeekly)?.day || '-';

  const maxTimeSlot = Math.max(...timeSlotData.map((d) => d.count));
  const mostActiveSlot = timeSlotData.find((d) => d.count === maxTimeSlot)?.slot || '-';

  const weeklyUnit = weeklyData[0]?.unit || '분';
  const timeSlotUnit = timeSlotData[0]?.unit || '분';

  return (
    <div className="keep-together mb-8 page-break-before">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">학습 패턴 분석</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly chart */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-800">요일별 학습</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
              {mostActiveDay}요일 가장 활발
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [`${value}${weeklyUnit}`, '학습']}
                  contentStyle={{ fontSize: 12, backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? CHART_COLORS.active : CHART_COLORS.inactive}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time slot chart */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-800">시간대별 학습</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
              {mostActiveSlot.split(' ')[0]} 선호
            </span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSlotData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                <YAxis
                  dataKey="slot"
                  type="category"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  width={85}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}${timeSlotUnit}`, '학습']}
                  contentStyle={{ fontSize: 12, backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {timeSlotData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? CHART_COLORS.active : CHART_COLORS.inactive}
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
