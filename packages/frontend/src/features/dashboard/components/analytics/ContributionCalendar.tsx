/**
 * ContributionCalendar - GitHub 잔디 스타일 1년 학습 달력
 */

import { useThemeStore } from '@/stores/themeStore';

export interface CalendarDay {
  date: string;
  count: number;
  month: number;
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function ContributionCalendar({ data }: { data: CalendarDay[] }) {
  const currentTheme = useThemeStore((s) => s.theme);

  const grassColors = currentTheme === 'dark'
    ? { empty: '#27272a', level1: '#155e75', level2: '#0891b2', level3: '#22d3ee' }
    : currentTheme === 'minimal'
    ? { empty: '#fef3c7', level1: '#fcd34d', level2: '#f59e0b', level3: '#b45309' }
    : { empty: '#fce7f3', level1: '#f9a8d4', level2: '#ec4899', level3: '#be185d' };

  // 주별 그룹핑
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  const firstDayOfWeek = new Date(data[0]?.date).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', count: -1, month: -1 });
  }

  data.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // 월 라벨
  const monthLabels: { month: number; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.find((d) => d.month >= 0);
    if (firstDay && firstDay.month !== lastMonth) {
      monthLabels.push({ month: firstDay.month, weekIndex });
      lastMonth = firstDay.month;
    }
  });

  const getGrassColor = (count: number): string => {
    if (count < 0) return 'transparent';
    if (count === 0) return grassColors.empty;
    if (count === 1) return grassColors.level1;
    if (count <= 3) return grassColors.level2;
    return grassColors.level3;
  };

  return (
    <div className="inline-block">
      <div className="hidden sm:flex text-xs mb-1 relative h-4" style={{ marginLeft: 20, color: 'var(--theme-dashboard-text-muted)' }}>
        {monthLabels.map(({ month, weekIndex }) => (
          <span
            key={`${month}-${weekIndex}`}
            className="absolute"
            style={{ left: weekIndex * 12 }}
          >
            {MONTHS[month]}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5 sm:mt-4">
        <div className="hidden sm:flex flex-col gap-0.5 mr-1">
          {['', '월', '', '수', '', '금', ''].map((day, i) => (
            <div key={i} className="w-3 h-3 text-[9px] flex items-center justify-center" style={{ color: 'var(--theme-dashboard-text-muted)' }}>
              {day}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm"
                style={{ backgroundColor: getGrassColor(day.count) }}
                title={day.date ? `${day.date}: ${day.count}개 학습` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-2 text-[10px] sm:text-xs" style={{ color: 'var(--theme-dashboard-text-muted)' }}>
        <span>적음</span>
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.empty }} />
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.level1 }} />
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.level2 }} />
        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-sm" style={{ backgroundColor: grassColors.level3 }} />
        <span>많음</span>
      </div>
    </div>
  );
}
