/**
 * DayCard - 개별 Day 카드
 */

import type { Day } from '@/data/courses';
import { cn } from '@/lib/utils';
import { Check, Lock, Play } from 'lucide-react';

export type DayStatus = 'completed' | 'current' | 'next' | 'locked';

interface DayCardProps {
  day: Day;
  status: DayStatus;
  onClick: () => void;
}

export function getDayStatus(
  dayNumber: number,
  completedDays: number[]
): DayStatus {
  const maxCompleted = Math.max(0, ...completedDays);

  if (completedDays.includes(dayNumber)) return 'completed';
  if (dayNumber === maxCompleted + 1) return 'current';
  if (dayNumber === maxCompleted + 2) return 'next';
  return 'locked';
}

export function DayCard({ day, status, onClick }: DayCardProps) {
  const isClickable = status !== 'locked';

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'p-4 rounded-lg border text-left transition-all',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50',
        {
          // 완료
          'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800':
            status === 'completed',
          // 현재 진행중
          'border-primary ring-2 ring-primary/20 bg-primary/5':
            status === 'current',
          // 다음 (클릭 가능)
          'hover:border-primary/50': status === 'next',
          // 잠김
          'opacity-50 cursor-not-allowed bg-muted/30': status === 'locked',
        }
      )}
    >
      {/* 상단: Day 번호 + 상태 아이콘 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Day {day.day}
        </span>
        <StatusIcon status={status} />
      </div>

      {/* 제목 */}
      <h3 className="font-medium truncate">{day.title}</h3>

      {/* 핵심 개념 */}
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {day.concept}
      </p>
    </button>
  );
}

function StatusIcon({ status }: { status: DayStatus }) {
  switch (status) {
    case 'completed':
      return <Check className="w-4 h-4 text-green-600" />;
    case 'current':
      return <Play className="w-4 h-4 text-primary fill-primary" />;
    case 'next':
      return null;
    case 'locked':
      return <Lock className="w-4 h-4 text-muted-foreground" />;
  }
}
