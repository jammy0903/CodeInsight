/**
 * DayGrid - Day 카드 그리드
 */

import type { Day } from '@/data/courses';
import { DayCard, getDayStatus } from './DayCard';

interface DayGridProps {
  days: Day[];
  completedDays: number[];
  onDayClick: (day: number) => void;
}

export function DayGrid({ days, completedDays, onDayClick }: DayGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {days.map((day) => (
        <DayCard
          key={day.day}
          day={day}
          status={getDayStatus(day.day, completedDays)}
          onClick={() => onDayClick(day.day)}
        />
      ))}
    </div>
  );
}
