/**
 * ActivityChart - 일별 학습 활동 차트
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ActivityChartProps {
  dailyActivity: Record<string, number>;
  period: '7d' | '30d' | '90d' | '1y';
}

export function ActivityChart({ dailyActivity, period }: ActivityChartProps) {
  // 기간에 따른 날짜 배열 생성
  const { dates, maxValue } = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const result: { date: string; value: number; label: string }[] = [];

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const value = dailyActivity[dateStr] || 0;

      result.push({
        date: dateStr,
        value,
        label: formatDateLabel(date, period),
      });
    }

    const max = Math.max(...result.map((d) => d.value), 1);
    return { dates: result, maxValue: max };
  }, [dailyActivity, period]);

  // 기간이 길면 그룹화
  const displayData = useMemo(() => {
    if (period === '7d' || period === '30d') {
      return dates;
    }

    // 90d, 1y는 주 단위로 그룹화
    const grouped: { date: string; value: number; label: string }[] = [];
    const chunkSize = period === '90d' ? 7 : 7; // 주 단위

    for (let i = 0; i < dates.length; i += chunkSize) {
      const chunk = dates.slice(i, i + chunkSize);
      const totalValue = chunk.reduce((sum, d) => sum + d.value, 0);
      const avgValue = Math.round(totalValue / chunk.length);

      grouped.push({
        date: chunk[0].date,
        value: avgValue,
        label: chunk[0].label,
      });
    }

    return grouped;
  }, [dates, period]);

  const groupedMaxValue = Math.max(...displayData.map((d) => d.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 학습 활동</h3>

      <div className="relative h-48">
        {/* Y축 눈금 */}
        <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-gray-400">
          <span>{formatDuration(groupedMaxValue)}</span>
          <span>{formatDuration(Math.round(groupedMaxValue / 2))}</span>
          <span>0</span>
        </div>

        {/* 차트 영역 */}
        <div className="ml-14 h-full flex items-end gap-1 pb-6">
          {displayData.map((data, index) => {
            const heightPercent = (data.value / groupedMaxValue) * 100;

            return (
              <div key={data.date} className="flex-1 flex flex-col items-center group">
                {/* 바 */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPercent, 2)}%` }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className={`w-full max-w-8 rounded-t-sm transition-colors ${
                    data.value > 0
                      ? 'bg-gradient-to-t from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500'
                      : 'bg-gray-200'
                  }`}
                  style={{ minHeight: data.value > 0 ? '4px' : '2px' }}
                />

                {/* 툴팁 */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {data.label}: {formatDuration(data.value)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X축 라벨 (7일/30일만) */}
        {(period === '7d' || period === '30d') && (
          <div className="ml-14 flex justify-between text-xs text-gray-400 mt-1">
            {period === '7d' ? (
              displayData.map((d) => (
                <span key={d.date} className="flex-1 text-center">
                  {d.label}
                </span>
              ))
            ) : (
              <>
                <span>{displayData[0]?.label}</span>
                <span>{displayData[Math.floor(displayData.length / 2)]?.label}</span>
                <span>{displayData[displayData.length - 1]?.label}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateLabel(date: Date, period: string): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (period === '7d') {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    return weekdays[date.getDay()];
  }

  return `${month}/${day}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}
