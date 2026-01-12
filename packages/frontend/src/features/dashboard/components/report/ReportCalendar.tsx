/**
 * ReportCalendar - PDF report calendar (GitHub grass style)
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { REPORT_COLORS } from './colors';

interface CalendarDay {
  date: string;
  count: number;
  month: number;
}

interface ReportCalendarProps {
  data: CalendarDay[];
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function getGrassColor(count: number): string {
  if (count < 0) return 'transparent';
  if (count === 0) return REPORT_COLORS.grass.empty;
  if (count === 1) return REPORT_COLORS.grass.level1;
  if (count <= 3) return REPORT_COLORS.grass.level2;
  return REPORT_COLORS.grass.level3;
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

  const cardStyle = {
    backgroundColor: REPORT_COLORS.bg.light,
    borderRadius: '0.5rem',
    padding: '1rem',
    border: `1px solid ${REPORT_COLORS.border.light}`,
  };

  const cellStyle = {
    width: '0.75rem',
    height: '0.75rem',
    borderRadius: '2px',
  };

  return (
    <div className="keep-together" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: REPORT_COLORS.text.secondary, marginBottom: '1rem' }}>
        학습 기록 (최근 1년)
      </h2>

      <div style={cardStyle}>
        {/* Stats summary */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.875rem', color: REPORT_COLORS.text.muted }}>
          <div>
            <span style={{ fontWeight: 500, color: REPORT_COLORS.text.secondary }}>{activeDays}</span>일 학습
          </div>
          <div>
            총 <span style={{ fontWeight: 500, color: REPORT_COLORS.text.secondary }}>{totalMinutes}</span>분
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'inline-block' }}>
          {/* Month labels row */}
          <div style={{ display: 'flex', fontSize: '0.625rem', marginBottom: '0.25rem', position: 'relative', marginLeft: 20 }}>
            {monthLabels.map(({ month, weekIndex }) => (
              <span
                key={`${month}-${weekIndex}`}
                style={{ position: 'absolute', left: weekIndex * 12, color: REPORT_COLORS.text.muted }}
              >
                {MONTHS[month]}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '2px', marginTop: '1rem' }}>
            {/* Weekday labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
              {['', '월', '', '수', '', '금', ''].map((day, i) => (
                <div
                  key={i}
                  style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: REPORT_COLORS.text.light,
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    style={{ ...cellStyle, backgroundColor: getGrassColor(day.count) }}
                    title={day.date ? `${day.date}: ${day.count}분` : ''}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.75rem', fontSize: '0.625rem', color: REPORT_COLORS.text.muted }}>
            <span>적음</span>
            <div style={{ ...cellStyle, backgroundColor: REPORT_COLORS.grass.empty }} />
            <div style={{ ...cellStyle, backgroundColor: REPORT_COLORS.grass.level1 }} />
            <div style={{ ...cellStyle, backgroundColor: REPORT_COLORS.grass.level2 }} />
            <div style={{ ...cellStyle, backgroundColor: REPORT_COLORS.grass.level3 }} />
            <span>많음</span>
          </div>
        </div>
      </div>
    </div>
  );
}
