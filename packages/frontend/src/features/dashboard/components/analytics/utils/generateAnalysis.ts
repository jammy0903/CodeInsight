/**
 * AI 분석 텍스트 생성 로직
 */

import type { AnalyticsSummary } from '@/services/analytics';
import type { UserProgress } from '@/types';

interface ChartDataItem {
  day?: string;
  slot?: string;
  count: number;
  unit?: string;
}

export function generateAnalysis(
  analyticsData: AnalyticsSummary | null,
  progress: UserProgress[],
  weeklyData: ChartDataItem[],
  timeSlotData: ChartDataItem[],
): string {
  const mostActiveDay = weeklyData.reduce((max, curr) =>
    curr.count > max.count ? curr : max,
  );
  const mostActiveSlot = timeSlotData.reduce((max, curr) =>
    curr.count > max.count ? curr : max,
  );
  const unit = weeklyData[0]?.unit || '분';
  const dayLabel = mostActiveDay.day || '-';
  const slotLabel = mostActiveSlot.slot || '-';

  if (analyticsData) {
    const { totalStudyTime, totalSessions, quizStats, aiQuestions, weakConcepts } = analyticsData;
    const studyHours = Math.floor(totalStudyTime / 3600);
    const studyMinutes = Math.floor((totalStudyTime % 3600) / 60);

    const weakConceptsList = Object.entries(weakConcepts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concept, count]) => `  - ${concept}: ${count}회 오답`)
      .join('\n');

    return `📊 학습 패턴 분석 결과 (실제 데이터 기반)

📈 전체 현황
• 총 학습 시간: ${studyHours}시간 ${studyMinutes}분
• 학습 세션: ${totalSessions}회
• AI 질문 횟수: ${aiQuestions}회

📝 퀴즈 성과
• 총 ${quizStats.total}문제 풀이
• 정답률: ${quizStats.accuracy}% (${quizStats.correct}개 정답 / ${quizStats.wrong}개 오답)
${quizStats.accuracy >= 80
  ? '• 🎉 훌륭한 정답률이에요! 개념을 잘 이해하고 계십니다.'
  : quizStats.accuracy >= 60
  ? '• 💪 좋은 진행이에요! 틀린 문제를 복습하면 더 좋아질 거예요.'
  : '• 📚 복습이 필요해요. 틀린 개념을 다시 확인해보세요.'}

📅 학습 패턴
• 가장 활발한 요일: ${dayLabel}요일 (${mostActiveDay.count}${unit})
• 선호하는 시간대: ${slotLabel} (${mostActiveSlot.count}${unit})

${weakConceptsList ? `🎯 취약 개념 (오답 기준)\n${weakConceptsList}\n` : ''}
💡 맞춤 추천
${slotLabel.includes('저녁')
  ? '• 저녁 시간에 집중력이 높으신 것 같아요. 이 시간을 활용해 어려운 개념을 학습해보세요.'
  : slotLabel.includes('오전')
  ? '• 오전에 학습하시는 습관이 좋습니다! 두뇌가 가장 활발한 시간이에요.'
  : slotLabel.includes('오후')
  ? '• 오후 시간대에 학습하시네요. 점심 후 졸릴 수 있으니 가벼운 복습부터 시작해보세요.'
  : '• 새벽 학습자시군요! 집중이 잘 되지만, 충분한 수면도 중요해요.'}

🚀 다음 단계 제안
${quizStats.wrong > 0
  ? '• 최근 틀린 퀴즈 다시 풀어보기'
  : '• 새로운 챕터 시작하기'}
• ${dayLabel}요일에 집중 학습 시간 확보하기`;
  }

  // Fallback: progress 기반 분석
  const totalLessons = progress.length;
  const completedLessons = progress.filter((p) => p.status === 'completed').length;

  return `📊 학습 패턴 분석 결과

📈 전체 현황
• 총 ${totalLessons}개 레슨 시작
• ${completedLessons}개 완료 (완료율: ${totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0}%)

📅 학습 패턴
• 가장 활발한 요일: ${dayLabel}요일 (${mostActiveDay.count}${unit})
• 선호하는 시간대: ${slotLabel} (${mostActiveSlot.count}${unit})

💡 맞춤 추천
${slotLabel.includes('저녁')
  ? '• 저녁 시간에 집중력이 높으신 것 같아요. 이 시간을 활용해 어려운 개념을 학습해보세요.'
  : slotLabel.includes('오전')
  ? '• 오전에 학습하시는 습관이 좋습니다! 두뇌가 가장 활발한 시간이에요.'
  : slotLabel.includes('오후')
  ? '• 오후 시간대에 학습하시네요. 점심 후 졸릴 수 있으니 가벼운 복습부터 시작해보세요.'
  : '• 새벽 학습자시군요! 집중이 잘 되지만, 충분한 수면도 중요해요.'}

${completedLessons < totalLessons
  ? `• 아직 완료하지 않은 ${totalLessons - completedLessons}개의 레슨이 있어요. 꾸준히 진행해보세요!`
  : '• 모든 레슨을 완료하셨네요! 다음 챕터로 넘어가보세요.'}

💡 더 자세한 분석을 원하시면 로그인해주세요!`;
}
