import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChapterWithLessons, UserProgress } from '@/types';
import { getChapters, getChapterWithLessons, getUserProgress } from '@/services/courses';
import { ChapterAccordion } from './components/ChapterAccordion';
import { useStore } from '@/stores/store';

export function LanguageCoursePage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const appUser = useStore((state) => state.appUser);

  const [chapters, setChapters] = useState<ChapterWithLessons[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 언어 이름 표시용
  const getLanguageName = () => {
    switch (lang) {
      case 'c':
        return 'C언어';
      case 'python':
        return 'Python';
      case 'java':
        return 'Java';
      case 'javascript':
        return 'JavaScript';
      default:
        return lang?.toUpperCase();
    }
  };

  useEffect(() => {
    if (!lang) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. 챕터 목록 가져오기
        const chapterList = await getChapters(lang);

        if (cancelled) return;

        // 2. 각 챕터의 레슨 목록 가져오기 (병렬 요청)
        const chaptersWithLessons = await Promise.all(
          chapterList.map((chapter) => getChapterWithLessons(chapter.id))
        );

        if (cancelled) return;
        setChapters(chaptersWithLessons);

        // 3. 진행 상태 가져오기 (로그인한 사용자만)
        if (appUser) {
          try {
            const progressList = await getUserProgress();
            if (cancelled) return;
            const map = new Map<string, UserProgress>();
            progressList.forEach((p) => map.set(p.lessonId, p));
            setProgressMap(map);
          } catch (err) {
            // 진행 상태 조회 실패해도 코스는 볼 수 있음
            console.warn('[courses] Progress fetch failed:', err);
          }
        }
        // 비로그인 사용자는 진행 상태 없이 코스만 표시
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load course data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [lang, appUser]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">코스 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">코스를 불러올 수 없습니다</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            코스 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 챕터가 없는 경우
  if (chapters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {getLanguageName()} 코스 준비 중
          </h2>
          <p className="text-gray-600 mb-6">
            아직 학습 콘텐츠가 준비되지 않았습니다.
            <br />
            곧 추가될 예정입니다!
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다른 코스 보기
          </button>
        </div>
      </div>
    );
  }

  // 전체 진행률 계산
  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const completedLessons = chapters.reduce((sum, ch) => {
    const completed = ch.lessons.filter(
      (lesson) => progressMap.get(lesson.id)?.status === 'completed'
    ).length;
    return sum + completed;
  }, 0);
  const overallProgress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <span>←</span>
            <span>코스 목록으로</span>
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">{getLanguageName()} 코스</h1>
          <p className="text-gray-600">
            총 {chapters.length}개 챕터 · {totalLessons}개 레슨
          </p>

          {/* 전체 진행률 */}
          {completedLessons > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>전체 진행률</span>
                <span className="font-semibold">
                  {completedLessons}/{totalLessons} ({overallProgress}%)
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 챕터 목록 (Accordion) */}
        {lang && (
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <ChapterAccordion
                key={chapter.id}
                chapter={chapter}
                lessons={chapter.lessons}
                progressMap={progressMap}
                languageId={lang}
                defaultOpen={index === 0} // 첫 번째 챕터만 기본으로 열기
              />
            ))}
          </div>
        )}

        {/* 하단 여백 */}
        <div className="h-16" />
      </div>
    </div>
  );
}
