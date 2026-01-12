/**
 * DashboardPage - 나의 학습 현황 페이지
 *
 * WHY: 사용자의 학습 진행 상황 시각화
 * FEATURES:
 *   - 섹션별 통계 (레슨, 퀴즈, 언어별)
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  Trophy,
  Loader2,
  Play,
  Target,
  Percent,
  Hash,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '@/stores/store';
import { getUserProgress } from '@/services/courses';
import { logger } from '@/utils/logger';
import { AnalyticsSection } from './components/AnalyticsSection';
import type { UserProgress } from '@/types';

// 언어별 총 레슨 수 (하드코딩 - 나중에 API로 변경 가능)
const TOTAL_LESSONS = {
  c: 30,
  javascript: 10,
  python: 10,
  java: 30,
  go: 10,
  ml: 10,
};

export function DashboardPage() {
  const { appUser } = useStore();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API에서 진행 상태 가져오기
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
        logger.error('Failed to fetch progress:', err);
        setError('학습 현황을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [appUser]);

  // 통계 계산
  const stats = useMemo(() => {
    // 레슨 통계
    const inProgressLessons = progress.filter(
      (p) => p.status === 'in_progress'
    ).length;

    const completedLessons = progress.filter(
      (p) => p.status === 'completed'
    ).length;

    const totalLessons = Object.values(TOTAL_LESSONS).reduce((a, b) => a + b, 0);
    const remainingLessons = totalLessons - inProgressLessons - completedLessons;

    // 퀴즈 통계
    const completedQuizzes = progress.filter(
      (p) => p.quizScore !== null && p.quizScore !== undefined
    ).length;

    const totalQuizScore = progress.reduce((sum, p) => {
      if (p.quizScore !== null && p.quizScore !== undefined) {
        return sum + p.quizScore;
      }
      return sum;
    }, 0);

    const totalQuizTotal = progress.reduce((sum, p) => {
      if (p.quizTotal !== null && p.quizTotal !== undefined) {
        return sum + p.quizTotal;
      }
      return sum;
    }, 0);

    const quizAccuracy = totalQuizTotal > 0
      ? Math.round((totalQuizScore / totalQuizTotal) * 100)
      : 0;

    // 언어별 통계
    const byLanguage = {
      c: { completed: 0, inProgress: 0, total: TOTAL_LESSONS.c },
      javascript: { completed: 0, inProgress: 0, total: TOTAL_LESSONS.javascript },
      python: { completed: 0, inProgress: 0, total: TOTAL_LESSONS.python },
      java: { completed: 0, inProgress: 0, total: TOTAL_LESSONS.java },
      go: { completed: 0, inProgress: 0, total: TOTAL_LESSONS.go },
      ml: { completed: 0, inProgress: 0, total: TOTAL_LESSONS.ml },
    };

    progress.forEach((p) => {
      const lang = p.lessonId.split('-')[0] as keyof typeof byLanguage;
      if (byLanguage[lang]) {
        if (p.status === 'completed') {
          byLanguage[lang].completed++;
        } else if (p.status === 'in_progress') {
          byLanguage[lang].inProgress++;
        }
      }
    });

    return {
      inProgressLessons,
      completedLessons,
      remainingLessons,
      totalLessons,
      completedQuizzes,
      quizAccuracy,
      totalQuizScore,
      totalQuizTotal,
      byLanguage,
    };
  }, [progress]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#a08060] animate-spin" />
      </div>
    );
  }

  // 학습 시작 안내 (데이터 없을 때)
  const hasNoProgress = progress.length === 0;

  return (
    <div className="min-h-screen bg-[#fffbf5] p-6">
      <div className="max-w-4xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-[#a08060]" />
          <h1 className="text-2xl font-bold text-[#6b5a4a]">나의 현황</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {hasNoProgress ? (
          // 학습 시작 안내
          <div className="bg-white rounded-xl border border-[#e5d5c7] p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fff8f0] flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-[#a08060]" />
            </div>
            <h2 className="text-lg font-semibold text-[#6b5a4a] mb-2">
              아직 학습 기록이 없습니다
            </h2>
            <p className="text-sm text-[#937b5d] mb-6">
              코스를 시작하면 여기에 학습 현황이 표시됩니다.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#a08060] text-white font-medium rounded-lg hover:bg-[#8b6d4f] transition-colors"
            >
              코스 시작하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1행: 레슨 + 퀴즈 (2열) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 레슨 섹션 */}
              <Section
                title="레슨"
                icon={<BookOpen className="w-5 h-5" />}
                color="blue"
              >
                <StatCard
                  icon={<Play className="w-5 h-5 text-blue-500" />}
                  label="진행 중"
                  value={stats.inProgressLessons}
                  color="blue"
                />
                <StatCard
                  icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                  label="완료"
                  value={stats.completedLessons}
                  color="green"
                />
                <StatCard
                  icon={<Target className="w-5 h-5 text-gray-400" />}
                  label="남은 레슨"
                  value={stats.remainingLessons}
                  subtext={`전체 ${stats.totalLessons}개`}
                  color="gray"
                />
              </Section>

              {/* 퀴즈 섹션 */}
              <Section
                title="퀴즈"
                icon={<Trophy className="w-5 h-5" />}
                color="yellow"
              >
                <StatCard
                  icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                  label="완료한 퀴즈"
                  value={stats.completedQuizzes}
                  color="green"
                />
                <StatCard
                  icon={<Percent className="w-5 h-5 text-yellow-500" />}
                  label="정답률"
                  value={`${stats.quizAccuracy}%`}
                  color="yellow"
                />
                <StatCard
                  icon={<Hash className="w-5 h-5 text-purple-500" />}
                  label="맞춘 문제"
                  value={stats.totalQuizScore}
                  subtext={`${stats.totalQuizTotal}문제 중`}
                  color="purple"
                />
              </Section>
            </div>

            {/* 2행: 언어별 진행률 (전체 너비) */}
            <Section
              title="언어별 진행률"
              icon={<Code2 className="w-5 h-5" />}
              color="green"
            >
              <LanguageCard
                lang="C"
                completed={stats.byLanguage.c.completed}
                inProgress={stats.byLanguage.c.inProgress}
                total={stats.byLanguage.c.total}
                color="#3b82f6"
              />
              <LanguageCard
                lang="JavaScript"
                completed={stats.byLanguage.javascript.completed}
                inProgress={stats.byLanguage.javascript.inProgress}
                total={stats.byLanguage.javascript.total}
                color="#f59e0b"
              />
              <LanguageCard
                lang="Python"
                completed={stats.byLanguage.python.completed}
                inProgress={stats.byLanguage.python.inProgress}
                total={stats.byLanguage.python.total}
                color="#10b981"
              />
              <LanguageCard
                lang="Java"
                completed={stats.byLanguage.java.completed}
                inProgress={stats.byLanguage.java.inProgress}
                total={stats.byLanguage.java.total}
                color="#e11d48"
              />
              <LanguageCard
                lang="Go"
                completed={stats.byLanguage.go.completed}
                inProgress={stats.byLanguage.go.inProgress}
                total={stats.byLanguage.go.total}
                color="#00ADD8"
              />
              <LanguageCard
                lang="ML"
                completed={stats.byLanguage.ml.completed}
                inProgress={stats.byLanguage.ml.inProgress}
                total={stats.byLanguage.ml.total}
                color="#8b5cf6"
              />
            </Section>

            {/* 3행: 분석 리포트 (전체 너비) */}
            <AnalyticsSection progress={progress} />
          </div>
        )}
      </div>
    </div>
  );
}

// 섹션 컴포넌트
function Section({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green';
  children: React.ReactNode;
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5d5c7] overflow-hidden">
      {/* 섹션 헤더 */}
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${colorMap[color]}`}>
        {icon}
        <h2 className="font-semibold">{title}</h2>
      </div>
      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {children}
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: 'blue' | 'green' | 'yellow' | 'gray' | 'purple';
}) {
  const bgMap = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    gray: 'bg-gray-50',
    purple: 'bg-purple-50',
  };

  return (
    <div className={`${bgMap[color]} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-[#937b5d]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[#6b5a4a]">{value}</p>
      {subtext && (
        <p className="text-xs text-[#937b5d] mt-1">{subtext}</p>
      )}
    </div>
  );
}

// 언어별 진행률 카드
function LanguageCard({
  lang,
  completed,
  inProgress,
  total,
  color,
}: {
  lang: string;
  completed: number;
  inProgress: number;
  total: number;
  color: string;
}) {
  const progress = total > 0 ? Math.round(((completed + inProgress * 0.5) / total) * 100) : 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-[#6b5a4a]">{lang}</span>
        <span className="text-sm text-[#937b5d]">{progress}%</span>
      </div>
      {/* 프로그레스 바 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-[#937b5d]">
        <span>완료 {completed}</span>
        <span>진행 중 {inProgress}</span>
        <span>전체 {total}</span>
      </div>
    </div>
  );
}
