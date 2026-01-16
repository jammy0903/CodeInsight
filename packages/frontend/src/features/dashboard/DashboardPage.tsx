/**
 * DashboardPage - 나의 학습 현황 페이지
 *
 * WHY: 사용자의 학습 진행 상황 시각화
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, CheckCircle, PlayCircle, Loader2 } from 'lucide-react';
import { useStore } from '@/stores/store';
import { getUserProgress } from '@/services/courses';
import { AnalyticsSection } from './components/AnalyticsSection';
import type { UserProgress } from '@/types';

export function DashboardPage() {
  const { appUser } = useStore();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

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

  // 통계 계산
  const completedLessons = progress.filter(p => p.status === 'completed').length;
  const inProgressLessons = progress.filter(p => p.status === 'in_progress').length;
  const completedQuizzes = progress.filter(p => p.quizScore !== null && p.quizScore !== undefined).length;
  const totalQuizScore = progress.reduce((sum, p) => sum + (p.quizScore || 0), 0);
  const totalQuizTotal = progress.reduce((sum, p) => sum + (p.quizTotal || 0), 0);

  // 최근 활동 (최신순 정렬)
  const recentActivity = [...progress]
    .filter(p => p.updatedAt)
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#a08060] animate-spin" />
      </div>
    );
  }

  if (!appUser) {
    return (
      <div className="min-h-screen bg-[#fffbf5] p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <BarChart3 className="w-16 h-16 text-[#a08060] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#6b5a4a] mb-2">로그인이 필요합니다</h1>
          <p className="text-[#937b5d]">학습 현황을 보려면 먼저 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 - 반응형 */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#a08060]" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#6b5a4a]">나의 현황</h1>
        </div>

        {/* 요약 카드 - 반응형 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl border border-[#e5d5c7] p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <span className="text-[10px] sm:text-sm text-[#937b5d]">완료 레슨</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[#6b5a4a]">{completedLessons}</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl border border-[#e5d5c7] p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
              <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-[10px] sm:text-sm text-[#937b5d]">진행 중</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[#6b5a4a]">{inProgressLessons}</p>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl border border-[#e5d5c7] p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#a08060]" />
              <span className="text-[10px] sm:text-sm text-[#937b5d]">퀴즈</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[#6b5a4a]">
              {totalQuizTotal > 0 ? `${totalQuizScore}/${totalQuizTotal}` : '-'}
            </p>
          </div>
        </div>

        {/* 최근 활동 - 반응형 */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-[#e5d5c7] p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-[#6b5a4a] mb-3 sm:mb-4">
            최근 활동
          </h2>
          {recentActivity.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-[#937b5d]">
              <p className="text-sm sm:text-base">아직 학습 기록이 없습니다.</p>
              <p className="text-xs sm:text-sm mt-2">코스를 시작해보세요!</p>
              <button
                onClick={() => navigate('/courses')}
                className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 text-sm bg-[#a08060] text-white rounded-lg hover:bg-[#8a6d50] transition-colors"
              >
                코스 둘러보기
              </button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-[#fffbf5] rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {item.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                    ) : (
                      <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#6b5a4a] truncate">
                        {item.lessonId}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[#937b5d]">
                        {item.status === 'completed' ? '완료' : '진행 중'}
                        {item.quizScore !== null && item.quizTotal !== null && (
                          <span className="ml-1 sm:ml-2">
                            퀴즈: {item.quizScore}/{item.quizTotal}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs text-[#937b5d] shrink-0 ml-2">
                    {item.updatedAt && new Date(item.updatedAt).toLocaleDateString('ko-KR')}
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
