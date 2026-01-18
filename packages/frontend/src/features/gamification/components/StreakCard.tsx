/**
 * StreakCard
 * 연속 학습일 스트릭 표시 카드
 *
 * variant:
 * - compact: TopBar용 (아이콘 + 숫자만)
 * - full: Dashboard용 (전체 정보 + 마일스톤)
 */

import { Flame, Trophy, AlertCircle } from 'lucide-react';
import type { StreakStatus } from '@/services/gamification';

interface StreakCardProps {
  streak: StreakStatus | null;
  variant?: 'compact' | 'full';
  loading?: boolean;
}

export function StreakCard({ streak, variant = 'full', loading = false }: StreakCardProps) {
  // 로딩 상태
  if (loading) {
    return variant === 'compact' ? (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--theme-dashboard-section-header-bg)] animate-pulse">
        <div className="w-4 h-4 bg-[var(--theme-dashboard-progress-bg)] rounded" />
        <div className="w-4 h-3 bg-[var(--theme-dashboard-progress-bg)] rounded" />
      </div>
    ) : (
      <div className="p-4 rounded-xl bg-white/80 backdrop-blur border animate-pulse">
        <div className="h-16 bg-[var(--theme-dashboard-section-header-bg)] rounded" />
      </div>
    );
  }

  // 스트릭 없음 (로그인 안 됨 또는 아직 시작 안 함)
  if (!streak) {
    return variant === 'compact' ? null : (
      <div className="p-4 rounded-xl bg-white/80 backdrop-blur border border-[var(--theme-dashboard-card-border)]">
        <div className="flex items-center gap-3 text-[var(--theme-dashboard-text-muted)]">
          <Flame className="w-6 h-6" />
          <div>
            <p className="font-medium">스트릭 시작하기</p>
            <p className="text-sm text-[var(--theme-dashboard-text-muted)]">첫 레슨을 완료하면 스트릭이 시작됩니다</p>
          </div>
        </div>
      </div>
    );
  }

  const { currentStreak, longestStreak, isActiveToday, streakAtRisk } = streak;

  // Compact variant (TopBar)
  if (variant === 'compact') {
    return (
      <div
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold
          transition-all duration-200
          ${
            streakAtRisk
              ? 'bg-amber-100 text-amber-600 animate-pulse'
              : isActiveToday
                ? 'bg-green-100 text-green-600'
                : 'bg-orange-100 text-orange-600'
          }
        `}
        title={
          streakAtRisk
            ? '오늘 학습하면 스트릭 유지!'
            : isActiveToday
              ? '오늘 학습 완료!'
              : `${currentStreak}일 연속 학습 중`
        }
      >
        <Flame
          className={`w-4 h-4 ${streakAtRisk ? 'animate-bounce' : ''}`}
          fill={currentStreak > 0 ? 'currentColor' : 'none'}
        />
        <span>{currentStreak}</span>
      </div>
    );
  }

  // Full variant (Dashboard)
  return (
    <div
      className={`
        p-4 rounded-xl backdrop-blur border transition-all duration-300
        ${
          streakAtRisk
            ? 'bg-amber-50/80 border-amber-200'
            : isActiveToday
              ? 'bg-green-50/80 border-green-200'
              : 'bg-orange-50/80 border-orange-200'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`
              p-2 rounded-lg
              ${
                streakAtRisk
                  ? 'bg-amber-100 text-amber-600'
                  : isActiveToday
                    ? 'bg-green-100 text-green-600'
                    : 'bg-orange-100 text-orange-600'
              }
            `}
          >
            <Flame
              className={`w-6 h-6 ${streakAtRisk ? 'animate-bounce' : ''}`}
              fill={currentStreak > 0 ? 'currentColor' : 'none'}
            />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--theme-dashboard-title)]">연속 학습</h3>
            <p className="text-xs text-[var(--theme-dashboard-text-muted)]">
              {isActiveToday ? '오늘도 완료!' : streakAtRisk ? '오늘 학습하면 유지!' : '계속 이어가요!'}
            </p>
          </div>
        </div>

        {/* Warning badge */}
        {streakAtRisk && (
          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
            <AlertCircle className="w-3 h-3" />
            <span>위험!</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        {/* Current Streak */}
        <div className="text-center">
          <div
            className={`
              text-3xl font-bold
              ${
                streakAtRisk
                  ? 'text-amber-600'
                  : isActiveToday
                    ? 'text-green-600'
                    : 'text-orange-600'
              }
            `}
          >
            {currentStreak}
          </div>
          <div className="text-xs text-[var(--theme-dashboard-text-muted)]">현재 스트릭</div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-[var(--theme-dashboard-progress-bg)]" />

        {/* Longest Streak */}
        <div className="text-center">
          <div className="flex items-center gap-1 text-2xl font-bold text-[var(--theme-dashboard-title)]">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {longestStreak}
          </div>
          <div className="text-xs text-[var(--theme-dashboard-text-muted)]">최장 기록</div>
        </div>
      </div>

      {/* Milestone progress (7일 마일스톤) */}
      {currentStreak > 0 && currentStreak < 7 && (
        <div className="mt-4 pt-3 border-t border-[var(--theme-dashboard-card-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--theme-dashboard-text-muted)] mb-1">
            <span>7일 마일스톤</span>
            <span>{currentStreak}/7</span>
          </div>
          <div className="h-2 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(currentStreak / 7) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 7일 달성 축하 */}
      {currentStreak >= 7 && (
        <div className="mt-4 pt-3 border-t border-[var(--theme-dashboard-card-border)]">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">7일 마일스톤 달성!</span>
          </div>
        </div>
      )}
    </div>
  );
}
