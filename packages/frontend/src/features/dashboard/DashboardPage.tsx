/**
 * DashboardPage - 나의 학습 현황 페이지
 *
 * WHY: 사용자의 학습 진행 상황 시각화
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, BookOpen, CheckCircle, PlayCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/stores/store';
import { getUserProgress } from '@/services/courses';
import { AnalyticsSection } from './components/AnalyticsSection';
import { StreakCard, useStreak } from '@/features/gamification';
import type { UserProgress } from '@/types';

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { appUser } = useStore();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { streak, loading: streakLoading } = useStreak();

  useEffect(() => {
    async function fetchProgress() {
      if (!appUser) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserProgress();
        setProgress(data);
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [appUser]);

  // 통계 계산 (useMemo로 불필요한 재계산 방지)
  const { completedLessons, inProgressLessons, totalQuizScore, totalQuizTotal } = useMemo(() => ({
    completedLessons: progress.filter(p => p.status === 'completed').length,
    inProgressLessons: progress.filter(p => p.status === 'in_progress').length,
    totalQuizScore: progress.reduce((sum, p) => sum + (p.quizScore ?? 0), 0),
    totalQuizTotal: progress.reduce((sum, p) => sum + (p.quizTotal ?? 0), 0),
  }), [progress]);

  // 최근 활동 (최신순 정렬, useMemo로 최적화)
  const recentActivity = useMemo(() => {
    // 미리 timestamp 변환하여 정렬 시 Date 객체 생성 최소화
    return progress
      .filter(p => p.updatedAt)
      .map(p => ({ ...p, _ts: new Date(p.updatedAt!).getTime() }))
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 5);
  }, [progress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--theme-dashboard-page-bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--theme-dashboard-accent)] animate-spin" />
      </div>
    );
  }

  if (!appUser) {
    return (
      <div className="min-h-screen bg-[var(--theme-dashboard-page-bg)] p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <BarChart3 className="w-16 h-16 text-[var(--theme-dashboard-accent)] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">{t('errors.auth_required')}</h1>
          <p className="text-[var(--theme-dashboard-text-muted)]">{t('dashboard.login_required_desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--theme-dashboard-page-bg)] p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 - 반응형 */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--theme-dashboard-accent)]" />
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--theme-dashboard-title)]">{t('dashboard.my_status')}</h1>
        </div>

        {/* 스트릭 카드 */}
        <div className="mb-4 sm:mb-6">
          <StreakCard streak={streak} variant="full" loading={streakLoading} />
        </div>

        {/* 요약 카드 - 반응형 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-lg sm:rounded-xl border border-[var(--theme-dashboard-card-border)] p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-[10px] sm:text-sm text-[var(--theme-dashboard-text-muted)]">{t('dashboard.completed_lessons')}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--theme-dashboard-title)]">{completedLessons}</p>
          </div>

          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-lg sm:rounded-xl border border-[var(--theme-dashboard-card-border)] p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
              <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-[10px] sm:text-sm text-[var(--theme-dashboard-text-muted)]">{t('dashboard.in_progress')}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--theme-dashboard-title)]">{inProgressLessons}</p>
          </div>

          <div className="bg-[var(--theme-dashboard-card-bg)] rounded-lg sm:rounded-xl border border-[var(--theme-dashboard-card-border)] p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--theme-dashboard-accent)]" />
              <span className="text-[10px] sm:text-sm text-[var(--theme-dashboard-text-muted)]">{t('quiz.title')}</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--theme-dashboard-title)]">
              {totalQuizTotal > 0 ? `${totalQuizScore}/${totalQuizTotal}` : '-'}
            </p>
          </div>
        </div>

        {/* 최근 활동 - 반응형 */}
        <div className="bg-[var(--theme-dashboard-card-bg)] rounded-lg sm:rounded-xl border border-[var(--theme-dashboard-card-border)] p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-[var(--theme-dashboard-title)] mb-3 sm:mb-4">
            {t('dashboard.recent_activity')}
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-[var(--theme-dashboard-text-muted)]">
              <p className="text-sm sm:text-base">{t('dashboard.no_activity')}</p>
              <p className="text-xs sm:text-sm mt-2">{t('dashboard.start_course')}</p>
              <button
                onClick={() => navigate('/courses')}
                className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 text-sm bg-[var(--theme-dashboard-accent)] text-white rounded-lg hover:bg-[var(--theme-dashboard-accent-hover)] transition-colors"
              >
                {t('home.browse_courses')}
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-[var(--theme-dashboard-section-header-bg)] rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                    ) : (
                      <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[var(--theme-dashboard-title)] truncate">
                        {item.lessonId}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[var(--theme-dashboard-text-muted)]">
                        {item.status === 'completed' ? t('courses.completed') : t('dashboard.in_progress')}
                        {item.quizScore !== null && item.quizTotal !== null && (
                          <span className="ml-1 sm:ml-2">
                            {t('quiz.title')}: {item.quizScore}/{item.quizTotal}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-[var(--theme-dashboard-text-muted)] shrink-0 ml-2">
                    {item.updatedAt && new Date(item.updatedAt).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI 분석 리포트 섹션 */}
        <div className="mt-4 sm:mt-8">
          <AnalyticsSection progress={progress} />
        </div>
      </div>
    </div>
  );
}
