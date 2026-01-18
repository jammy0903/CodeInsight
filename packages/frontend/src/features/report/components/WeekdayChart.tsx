/**
 * WeekdayChart - 요일별 학습 패턴
 */

import { motion } from 'framer-motion';

interface WeekdayChartProps {
  weekdayActivity: number[]; // [0-6] 일~토
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function WeekdayChart({ weekdayActivity }: WeekdayChartProps) {
  const maxValue = Math.max(...weekdayActivity, 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">요일별 학습 패턴</h3>

      <div className="flex items-end justify-between gap-2 h-24">
        {weekdayActivity.map((value, index) => {
          const heightPercent = (value / maxValue) * 100;
          const isWeekend = index === 0 || index === 6;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPercent, 4)}%` }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={`w-full max-w-10 rounded-t-md ${
                  isWeekend
                    ? 'bg-gradient-to-t from-rose-300 to-rose-400'
                    : 'bg-gradient-to-t from-blue-300 to-blue-400'
                }`}
                style={{ minHeight: value > 0 ? '8px' : '4px' }}
              />
              <span
                className={`text-xs font-medium ${
                  isWeekend ? 'text-rose-600' : 'text-gray-600'
                }`}
              >
                {WEEKDAYS[index]}
              </span>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-400" />
          평일
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-rose-400" />
          주말
        </span>
      </div>
    </div>
  );
}
