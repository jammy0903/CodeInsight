/**
 * ReportCalendar - PDF report calendar (GitHub grass style)
 */

interface CalendarDay {
  date: string;
  count: number;
  month: number;
}

interface ReportCalendarProps {
  data: CalendarDay[];
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// PDF-friendly colors (light theme)
const GRASS_COLORS = {
  empty: '#f3f4f6',
  level1: '#bbf7d0',
  level2: '#4ade80',
  level3: '#16a34a',
};

function getGrassColor(count: number): string {
  if (count < 0) return 'transparent';
  if (count === 0) return GRASS_COLORS.empty;
  if (count === 1) return GRASS_COLORS.level1;
  if (count <= 3) return GRASS_COLORS.level2;
  return GRASS_COLORS.level3;
}

export function ReportCalendar({ data }: ReportCalendarProps) {
  // Build weeks array
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  // Adjust start position by first day's weekday
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

  // Month labels
  const monthLabels: { month: number; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week.find((d) => d.month >= 0);
    if (firstDay && firstDay.month !== lastMonth) {
      monthLabels.push({ month: firstDay.month, weekIndex });
      lastMonth = firstDay.month;
    }
  });

  // Calculate stats
  const activeDays = data.filter((d) => d.count > 0).length;
  const totalMinutes = data.reduce((sum, d) => sum + (d.count > 0 ? d.count : 0), 0);

  return (
    <div className="keep-together mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        학습 기록 (최근 1년)
      </h2>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        {/* Stats summary */}
        <div className="flex gap-6 mb-4 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-800">{activeDays}</span>일 학습
          </div>
          <div>
            총 <span className="font-medium text-gray-800">{totalMinutes}</span>분
          </div>
        </div>

        {/* Calendar grid */}
        <div className="inline-block">
          {/* Month labels row */}
          <div className="flex text-xs mb-1 relative" style={{ marginLeft: 20 }}>
            {monthLabels.map(({ month, weekIndex }) => (
              <span
                key={`${month}-${weekIndex}`}
                className="absolute text-gray-500"
                style={{ left: weekIndex * 12 }}
              >
                {MONTHS[month]}
              </span>
            ))}
          </div>

          <div className="flex gap-0.5 mt-4">
            {/* Weekday labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {['', '월', '', '수', '', '금', ''].map((day, i) => (
                <div
                  key={i}
                  className="w-3 h-3 text-[9px] flex items-center justify-center text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: getGrassColor(day.count) }}
                    title={day.date ? `${day.date}: ${day.count}분` : ''}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
            <span>적음</span>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRASS_COLORS.empty }} />
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRASS_COLORS.level1 }} />
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRASS_COLORS.level2 }} />
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: GRASS_COLORS.level3 }} />
            <span>많음</span>
          </div>
        </div>
      </div>
    </div>
  );
}
