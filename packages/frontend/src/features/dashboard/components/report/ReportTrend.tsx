/**
 * ReportTrend - PDF report weekly trend comparison
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { REPORT_COLORS } from './colors';

interface ReportTrendProps {
  dailyActivity: Record<string, number>;
}

function getTrendIcon(percent: number) {
  if (percent > 5) return <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: REPORT_COLORS.accent.green }} />;
  if (percent < -5) return <TrendingDown style={{ width: '1.25rem', height: '1.25rem', color: REPORT_COLORS.accent.red }} />;
  return <Minus style={{ width: '1.25rem', height: '1.25rem', color: REPORT_COLORS.text.light }} />;
}

function getTrendColor(percent: number): string {
  if (percent > 5) return REPORT_COLORS.accent.green;
  if (percent < -5) return REPORT_COLORS.accent.red;
  return REPORT_COLORS.text.muted;
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

  const cardStyle = {
    backgroundColor: REPORT_COLORS.bg.light,
    borderRadius: '0.5rem',
    padding: '1rem',
    border: `1px solid ${REPORT_COLORS.border.light}`,
  };

  return (
    <div className="keep-together" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: REPORT_COLORS.text.secondary, marginBottom: '1rem' }}>
        주간 트렌드
      </h2>

      <div style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {/* Last week */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted, marginBottom: '0.25rem' }}>지난주</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: REPORT_COLORS.text.muted }}>{lastWeekMinutes}</p>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted }}>분</p>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.light, marginTop: '0.25rem' }}>{lastWeekDays}일 학습</p>
          </div>

          {/* Trend indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {getTrendIcon(percentChange)}
            <p style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem', color: getTrendColor(percentChange) }}>
              {percentChange > 0 ? '+' : ''}{percentChange}%
            </p>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted }}>{getTrendLabel(percentChange)}</p>
          </div>

          {/* This week */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted, marginBottom: '0.25rem' }}>이번주</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: REPORT_COLORS.text.primary }}>{thisWeekMinutes}</p>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted }}>분</p>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.light, marginTop: '0.25rem' }}>{thisWeekDays}일 학습</p>
          </div>
        </div>

        {/* Summary message */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${REPORT_COLORS.border.light}` }}>
          <p style={{ fontSize: '0.875rem', color: REPORT_COLORS.text.muted }}>
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
