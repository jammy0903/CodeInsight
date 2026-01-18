/**
 * ReportPage - 학습 분석 리포트 페이지
 *
 * WHY: 사용자의 학습 패턴을 시각화하여 인사이트 제공
 * - 총 학습 시간, 세션 수, 퀴즈 정확도 등 통계
 * - 일별/시간대별/요일별 학습 패턴 차트
 * - AI 기반 개인화된 분석 및 추천
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/stores/store';
import {
  getAnalyticsSummary,
  getReportAnalysis,
  type AnalyticsSummary,
  type ReportAnalysisResponse,
} from '@/services/analytics';
import { AlertCircle, Calendar, TrendingUp, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

// 컴포넌트
import { StatsCards } from './components/StatsCards';
import { ActivityChart } from './components/ActivityChart';
import { WeekdayChart } from './components/WeekdayChart';
import { HourlyChart } from './components/HourlyChart';
import { AIInsights } from './components/AIInsights';
import { WeakConcepts } from './components/WeakConcepts';

type Period = '7d' | '30d' | '90d' | '1y';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '최근 7일',
  '30d': '최근 30일',
  '90d': '최근 90일',
  '1y': '최근 1년',
};

export function ReportPage() {
  const { appUser, setPageTitle } = useStore();

  const [period, setPeriod] = useState<Period>('30d');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<ReportAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle('학습 리포트', '나의 학습 패턴을 분석합니다');
  }, [setPageTitle]);

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
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period, appUser]);

  // AI 분석 요청
  const handleRequestAIAnalysis = async () => {
    if (!summary) return;

    setAiLoading(true);
    try {
      // 연속 학습일 계산
      const streakDays = calculateStreakDays(summary.dailyActivity);

      const analysis = await getReportAnalysis({
        totalStudyTime: summary.totalStudyTime,
        totalSessions: summary.totalSessions,
        quizStats: {
          total: summary.quizStats.total,
          correct: summary.quizStats.correct,
          accuracy: summary.quizStats.accuracy,
        },
        aiQuestions: summary.aiQuestions,
        weakConcepts: summary.weakConcepts,
        weekdayActivity: summary.weekdayActivity,
        hourlyActivity: summary.hourlyActivity,
        recentWrongCount: summary.recentWrongAnswers.length,
        streakDays,
      });
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('AI analysis failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // 로그인 안 된 경우
  if (!appUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <LogIn className="w-10 h-10 text-amber-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--theme-dashboard-title)] mb-2">로그인이 필요합니다</h2>
          <p className="text-[var(--theme-dashboard-text-muted)]">학습 리포트를 보려면 먼저 로그인해주세요.</p>
        </div>
        <Link
          to="/"
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          홈으로 이동
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
          <p className="text-[var(--theme-dashboard-text-muted)]">데이터를 불러오는 중...</p>
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
          다시 시도
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
          <h2 className="text-xl font-bold text-[var(--theme-dashboard-title)] mb-2">아직 학습 데이터가 없어요</h2>
          <p className="text-[var(--theme-dashboard-text-muted)]">레슨을 학습하면 여기에 분석 결과가 표시됩니다.</p>
        </div>
        <Link
          to="/courses"
          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow"
        >
          학습 시작하기
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
            {appUser.nickname}님의 학습 리포트
          </h1>
          <p className="text-[var(--theme-dashboard-text-muted)] mt-1">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            {PERIOD_LABELS[period]} 기준
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md'
                  : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-dashboard-text-muted)] hover:bg-[var(--theme-dashboard-progress-bg)]'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards summary={summary} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <ActivityChart dailyActivity={summary.dailyActivity} period={period} />

        {/* Weekday & Hourly Charts */}
        <div className="space-y-6">
          <WeekdayChart weekdayActivity={summary.weekdayActivity} />
          <HourlyChart hourlyActivity={summary.hourlyActivity} />
        </div>
      </div>

      {/* AI Insights */}
      <AIInsights
        analysis={aiAnalysis}
        loading={aiLoading}
        onRequestAnalysis={handleRequestAIAnalysis}
      />

      {/* Weak Concepts */}
      {Object.keys(summary.weakConcepts).length > 0 && (
        <WeakConcepts weakConcepts={summary.weakConcepts} />
      )}
    </div>
  );
}

/**
 * 연속 학습일 계산
 */
function calculateStreakDays(dailyActivity: Record<string, number>): number {
  const dates = Object.keys(dailyActivity).sort().reverse();
  if (dates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i]);
    date.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (date.getTime() === expectedDate.getTime() && dailyActivity[dates[i]] > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
