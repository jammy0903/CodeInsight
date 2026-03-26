/**
 * ReportRecommendations - PDF report AI recommendations
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { Lightbulb, Target, Clock, BookOpen } from 'lucide-react';
import type { AnalyticsSummary } from '@/services/analytics';
import { REPORT_COLORS } from './colors';
import { useTranslation } from 'react-i18next';

interface ReportRecommendationsProps {
  data: AnalyticsSummary;
  mostActiveDay: string;
  mostActiveTimeSlot: string;
}

export function ReportRecommendations({
  data,
  mostActiveDay,
  mostActiveTimeSlot,
}: ReportRecommendationsProps) {
  const { t } = useTranslation();
  const { quizStats, weakConcepts } = data;

  // Generate recommendations based on data
  const recommendations: { icon: typeof Lightbulb; title: string; description: string }[] = [];

  // Time-based recommendation
  if (mostActiveTimeSlot.includes('저녁')) {
    recommendations.push({
      icon: Clock,
      title: '저녁 시간 활용',
      description: '저녁 시간에 집중력이 높으시네요. 이 시간을 활용해 어려운 개념을 학습해보세요.',
    });
  } else if (mostActiveTimeSlot.includes('오전')) {
    recommendations.push({
      icon: Clock,
      title: '오전 학습 습관',
      description: '오전에 학습하시는 습관이 좋습니다! 두뇌가 가장 활발한 시간이에요.',
    });
  } else if (mostActiveTimeSlot.includes('새벽')) {
    recommendations.push({
      icon: Clock,
      title: '새벽 학습 주의',
      description: '새벽 학습자시군요! 집중이 잘 되지만, 충분한 수면도 중요해요.',
    });
  } else {
    recommendations.push({
      icon: Clock,
      title: '오후 학습 팁',
      description: '점심 후 졸릴 수 있으니 가벼운 복습부터 시작해보세요.',
    });
  }

  // Quiz performance recommendation
  if (quizStats.accuracy < 60) {
    recommendations.push({
      icon: Target,
      title: '기초 개념 복습 필요',
      description: `정답률이 ${quizStats.accuracy}%입니다. 틀린 문제의 개념을 다시 학습해보세요.`,
    });
  } else if (quizStats.accuracy < 80) {
    recommendations.push({
      icon: Target,
      title: '오답 패턴 분석',
      description: `정답률 ${quizStats.accuracy}%로 좋은 진행입니다! 틀린 문제 유형을 분석해보세요.`,
    });
  } else {
    recommendations.push({
      icon: Target,
      title: '고급 개념 도전',
      description: `${quizStats.accuracy}% 정답률! 훌륭해요. 다음 단계 개념에 도전해보세요.`,
    });
  }

  // Weak concept recommendation
  const weakConceptList = Object.entries(weakConcepts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (weakConceptList.length > 0) {
    const topWeak = weakConceptList[0][0];
    recommendations.push({
      icon: BookOpen,
      title: '집중 복습 대상',
      description: `"${topWeak}" 개념에서 오답이 많았어요. 해당 레슨을 다시 학습해보세요.`,
    });
  }

  // Day-based recommendation
  recommendations.push({
    icon: Lightbulb,
    title: '효과적인 학습일',
    description: `${mostActiveDay}요일에 학습 효과가 가장 좋아요. 이 날에 중요한 개념을 학습해보세요.`,
  });

  const cardStyle = {
    background: 'linear-gradient(to bottom right, #faf5ff, #eef2ff)',
    borderRadius: '0.5rem',
    padding: '1rem',
    border: `1px solid ${REPORT_COLORS.accent.purpleLight}`,
  };

  const iconBoxStyle = {
    width: '2rem',
    height: '2rem',
    backgroundColor: REPORT_COLORS.bg.white,
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  };

  return (
    <div className="keep-together" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Lightbulb style={{ width: '1.25rem', height: '1.25rem', color: REPORT_COLORS.accent.amber }} />
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: REPORT_COLORS.text.secondary }}>{t("dashboard.txt_96cf93")}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        {recommendations.map((rec, index) => (
          <div key={index} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={iconBoxStyle}>
                <rec.icon style={{ width: '1rem', height: '1rem', color: REPORT_COLORS.accent.purple }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 500, color: REPORT_COLORS.text.secondary, marginBottom: '0.25rem' }}>{rec.title}</h3>
                <p style={{ fontSize: '0.875rem', color: REPORT_COLORS.text.muted }}>{rec.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
