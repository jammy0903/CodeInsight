/**
 * ReportPage - 학습 분석 리포트 페이지
 *
 * WHY: 사용자의 학습 패턴을 시각화하여 인사이트 제공
 * - 총 학습 시간, 세션 수, 퀴즈 정확도 등 통계
 * - 일별/시간대별/요일별 학습 패턴 차트
 * - AI 기반 개인화된 분석 및 추천
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useStore } from '@/stores/store';
import {
  getAnalyticsSummary,
  type AnalyticsSummary,
} from '@/services/analytics';
import { AlertCircle, Calendar, TrendingUp, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StreakCard, useStreak } from '@/features/gamification';

// 컴포넌트
import { StatsCards } from './components/StatsCards';
import { ActivityChart } from './components/ActivityChart';
import { HourlyChart } from './components/HourlyChart';
import { WeakConcepts } from './components/WeakConcepts';
import { StandaloneQuizSection } from './components/StandaloneQuizSection';

type Period = '7d' | '30d' | '90d' | '1y';

const PERIOD_KEYS: Record<Period, string> = {
  '7d': 'report.period_7d',
  '30d': 'report.period_30d',
  '90d': 'report.period_90d',
  '1y': 'report.period_1y',
};

export function ReportPage() {
  const { t } = useTranslation();
  const appUser = useStore((s) => s.appUser);
  const setPageTitle = useStore((s) => s.setPageTitle);
  const { streak, loading: streakLoading } = useStreak();

  const [period, setPeriod] = useState<Period>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle(t('report.title'), t('report.subtitle'));
  }, [setPageTitle, t]);

  // 데이터 로드
  useEffect(() => {
    if (!appUser) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const data = await getAnalyticsSummary(period);
        setSummary(data);
      } catch (_err) {
        setError(t('report.data_load_error'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period, appUser, t]);

  // 로그인 안 된 경우
  if (!appUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <LogIn className="w-10 h-10 text-amber-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--theme-dashboard-title)] mb-2">{t('errors.auth_required')}</h2>
          <p className="text-[var(--theme-dashboard-text-muted)]">{t('report.login_required_desc')}</p>
        </div>
        <Link
          to="/"
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          {t('report.go_home')}
        </Link>
      </div>
    );
  }

  // 로딩
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-3 border-amber-200 border-t-amber-500 rounded-full"
          />
          <p className="text-[var(--theme-dashboard-text-muted)]">{t('report.loading_data')}</p>
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-red-400" />
        <p className="text-[var(--theme-dashboard-text-muted)]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[var(--theme-dashboard-section-header-bg)] hover:bg-[var(--theme-dashboard-progress-bg)] rounded-lg transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  // 데이터 없음
  if (!summary || summary.totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-full bg-[var(--theme-dashboard-section-header-bg)] flex items-center justify-center">
          <TrendingUp className="w-10 h-10 text-[var(--theme-dashboard-text-muted)]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--theme-dashboard-title)] mb-2">{t('report.no_data')}</h2>
          <p className="text-[var(--theme-dashboard-text-muted)]">{t('report.no_data_desc')}</p>
        </div>
        <Link
          to="/courses"
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          {t('report.start_learning')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-dashboard-title)]">
            {t('report.user_status', { name: appUser.nickname })}
          </h1>
          <p className="text-[var(--theme-dashboard-text-muted)] mt-1">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            {t('report.period_based', { period: t(PERIOD_KEYS[period]) })}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(Object.keys(PERIOD_KEYS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                  : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-dashboard-text-muted)] hover:bg-[var(--theme-dashboard-progress-bg)]'
              }`}
            >
              {t(PERIOD_KEYS[p])}
            </button>
          ))}
        </div>
      </div>

      {/* Streak Card */}
      <StreakCard streak={streak} variant="full" loading={streakLoading} />

      {/* Stats Cards */}
      <StatsCards summary={summary} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <ActivityChart dailyActivity={summary.dailyActivity} period={period} />

        {/* Hourly Chart */}
        <HourlyChart hourlyActivity={summary.hourlyActivity} />
      </div>

      {/* Weak Concepts (Lesson-based) */}
      {Object.keys(summary.weakConcepts).length > 0 && (
        <WeakConcepts weakConcepts={summary.weakConcepts} />
      )}

      {/* Standalone Quiz Weak Concepts */}
      <StandaloneQuizSection />
    </div>
  );
}
