/**
 * DayHeader - Day 제목 + 뒤로가기 버튼
 */

import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Day } from '@/types/course';

interface DayHeaderProps {
  day: Day;
  onBack: () => void;
}

export function DayHeader({ day, onBack }: DayHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" onClick={onBack}>
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <div>
        <h1 className="text-xl font-bold">
          Day {day.day}: {day.title}
        </h1>
        <p className="text-sm text-muted-foreground">{day.concept}</p>
      </div>
    </div>
  );
}
