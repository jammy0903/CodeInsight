/**
 * ReportTrend - PDF report weekly trend comparison
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReportTrendProps {
  dailyActivity: Record<string, number>;
}

function getTrendIcon(percent: number) {
  if (percent > 5) return <TrendingUp className="w-5 h-5 text-green-500" />;
  if (percent < -5) return <TrendingDown className="w-5 h-5 text-red-500" />;
  return <Minus className="w-5 h-5 text-gray-400" />;
}

function getTrendColor(percent: number): string {
  if (percent > 5) return 'text-green-600';
  if (percent < -5) return 'text-red-600';
  return 'text-gray-600';
}

function getTrendLabel(percent: number): string {
  if (percent > 5) return '증가';
  if (percent < -5) return '감소';
  return '유지';
}

export function ReportTrend({ dailyActivity }: ReportTrendProps) {
  // Get dates for this week and last week
  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

  // Calculate totals
  let thisWeekTotal = 0;
  let lastWeekTotal = 0;
  let thisWeekDays = 0;
  let lastWeekDays = 0;

  Object.entries(dailyActivity).forEach(([dateStr, seconds]) => {
    const date = new Date(dateStr);
    if (date >= thisWeekStart && date <= today) {
      thisWeekTotal += seconds;
      thisWeekDays++;
    } else if (date >= lastWeekStart && date <= lastWeekEnd) {
      lastWeekTotal += seconds;
      lastWeekDays++;
    }
  });

  const thisWeekMinutes = Math.round(thisWeekTotal / 60);
  const lastWeekMinutes = Math.round(lastWeekTotal / 60);

  // Calculate percentage change
  const percentChange = lastWeekMinutes > 0
    ? Math.round(((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100)
    : thisWeekMinutes > 0 ? 100 : 0;

  return (
    <div className="keep-together mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">주간 트렌드</h2>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          {/* Last week */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">지난주</p>
            <p className="text-2xl font-bold text-gray-700">{lastWeekMinutes}</p>
            <p className="text-xs text-gray-500">분</p>
            <p className="text-xs text-gray-400 mt-1">{lastWeekDays}일 학습</p>
          </div>

          {/* Trend indicator */}
          <div className="flex flex-col items-center justify-center">
            {getTrendIcon(percentChange)}
            <p className={`text-lg font-semibold mt-1 ${getTrendColor(percentChange)}`}>
              {percentChange > 0 ? '+' : ''}{percentChange}%
            </p>
            <p className="text-xs text-gray-500">{getTrendLabel(percentChange)}</p>
          </div>

          {/* This week */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">이번주</p>
            <p className="text-2xl font-bold text-gray-900">{thisWeekMinutes}</p>
            <p className="text-xs text-gray-500">분</p>
            <p className="text-xs text-gray-400 mt-1">{thisWeekDays}일 학습</p>
          </div>
        </div>

        {/* Summary message */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {percentChange > 20 && '학습량이 크게 증가했어요! 이 추세를 유지해보세요.'}
            {percentChange > 5 && percentChange <= 20 && '학습량이 조금씩 늘고 있어요. 좋은 방향입니다!'}
            {percentChange >= -5 && percentChange <= 5 && '꾸준한 학습 패턴을 유지하고 있어요.'}
            {percentChange < -5 && percentChange >= -20 && '학습량이 조금 줄었어요. 시간을 내어 학습해보세요.'}
            {percentChange < -20 && '학습량이 많이 줄었어요. 다시 학습 습관을 잡아볼까요?'}
          </p>
        </div>
      </div>
    </div>
  );
}
