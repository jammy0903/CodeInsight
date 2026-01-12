/**
 * ReportSummaryCards - PDF report summary statistics
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { Clock, Target, Brain, Calendar } from 'lucide-react';
import type { AnalyticsSummary } from '@/services/analytics';
import { REPORT_COLORS } from './colors';

interface ReportSummaryCardsProps {
  data: AnalyticsSummary | null;
}

export function ReportSummaryCards({ data }: ReportSummaryCardsProps) {
  if (!data) return null;

  const studyHours = Math.floor(data.totalStudyTime / 3600);
  const studyMinutes = Math.floor((data.totalStudyTime % 3600) / 60);

  const cards = [
    {
      icon: Clock,
      label: '총 학습 시간',
      value: `${studyHours}시간 ${studyMinutes}분`,
      color: REPORT_COLORS.accent.purple,
    },
    {
      icon: Target,
      label: '퀴즈 정답률',
      value: `${data.quizStats.accuracy}%`,
      subtext: `${data.quizStats.correct}/${data.quizStats.total}`,
      color: REPORT_COLORS.accent.green,
    },
    {
      icon: Brain,
      label: 'AI 질문',
      value: `${data.aiQuestions}회`,
      color: REPORT_COLORS.accent.amber,
    },
    {
      icon: Calendar,
      label: '학습 세션',
      value: `${data.totalSessions}회`,
      color: '#3b82f6', // blue-500
    },
  ];

  const cardStyle = {
    backgroundColor: REPORT_COLORS.bg.light,
    borderRadius: '0.5rem',
    padding: '1rem',
    border: `1px solid ${REPORT_COLORS.border.light}`,
  };

  return (
    <div className="keep-together" style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: REPORT_COLORS.text.secondary, marginBottom: '1rem' }}>
        학습 현황 요약
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {cards.map((card) => (
          <div key={card.label} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <card.icon style={{ width: '1.25rem', height: '1.25rem', color: card.color }} />
              <span style={{ fontSize: '0.875rem', color: REPORT_COLORS.text.muted }}>{card.label}</span>
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: REPORT_COLORS.text.primary }}>{card.value}</p>
            {card.subtext && (
              <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted, marginTop: '0.25rem' }}>{card.subtext}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
