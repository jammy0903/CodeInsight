/**
 * ReportSummaryCards - PDF report summary statistics
 */

import { Clock, Target, Brain, Calendar } from 'lucide-react';
import type { AnalyticsSummary } from '@/services/analytics';

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
      color: '#8b5cf6',
    },
    {
      icon: Target,
      label: '퀴즈 정답률',
      value: `${data.quizStats.accuracy}%`,
      subtext: `${data.quizStats.correct}/${data.quizStats.total}`,
      color: '#10b981',
    },
    {
      icon: Brain,
      label: 'AI 질문',
      value: `${data.aiQuestions}회`,
      color: '#f59e0b',
    },
    {
      icon: Calendar,
      label: '학습 세션',
      value: `${data.totalSessions}회`,
      color: '#3b82f6',
    },
  ];

  return (
    <div className="keep-together mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">학습 현황 요약</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="report-card bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
              <span className="text-sm text-gray-600">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            {card.subtext && (
              <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
