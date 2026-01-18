/**
 * HourlyChart - 시간대별 학습 패턴 (히트맵 스타일)
 */

import { motion } from 'framer-motion';

interface HourlyChartProps {
  hourlyActivity: number[]; // [0-23] 시간대별 초
}

export function HourlyChart({ hourlyActivity }: HourlyChartProps) {
  const maxValue = Math.max(...hourlyActivity, 1);

  // 시간대를 4시간 단위로 그룹화 (6개 구간)
  const groupedActivity = [];
  for (let i = 0; i < 24; i += 4) {
    const sum = hourlyActivity.slice(i, i + 4).reduce((a, b) => a + b, 0);
    groupedActivity.push({
      label: `${i.toString().padStart(2, '0')}~${(i + 4).toString().padStart(2, '0')}시`,
      value: sum,
      emoji: getTimeEmoji(i),
    });
  }

  const groupedMax = Math.max(...groupedActivity.map((g) => g.value), 1);

  return (
    <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] p-4">
      <h3 className="text-lg font-semibold text-[var(--theme-dashboard-title)] mb-3">시간대별 학습</h3>

      <div className="space-y-2">
        {groupedActivity.map((group, index) => {
          const widthPercent = (group.value / groupedMax) * 100;

          return (
            <div key={index} className="flex items-center gap-2">
              <span className="text-lg">{group.emoji}</span>
              <span className="w-20 text-xs text-[var(--theme-dashboard-text-muted)]">{group.label}</span>
              <div className="flex-1 h-6 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(widthPercent, 2)}%` }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-end pr-2"
                >
                  {widthPercent > 20 && (
                    <span className="text-xs text-white font-medium">
                      {formatDuration(group.value)}
                    </span>
                  )}
                </motion.div>
              </div>
              {widthPercent <= 20 && group.value > 0 && (
                <span className="text-xs text-[var(--theme-dashboard-text-muted)] w-12">
                  {formatDuration(group.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getTimeEmoji(hour: number): string {
  if (hour >= 0 && hour < 4) return '🌙'; // 심야
  if (hour >= 4 && hour < 8) return '🌅'; // 새벽
  if (hour >= 8 && hour < 12) return '☀️'; // 오전
  if (hour >= 12 && hour < 16) return '🌤️'; // 오후
  if (hour >= 16 && hour < 20) return '🌆'; // 저녁
  return '🌃'; // 밤
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간`;
}
