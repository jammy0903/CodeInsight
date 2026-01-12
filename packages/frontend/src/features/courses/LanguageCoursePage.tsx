import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChapterWithLessons, UserProgress } from '@/types';
import { getChapters, getChapterWithLessons, getUserProgress } from '@/services/courses';
import { CourseGrid } from './components/CourseGrid';
import { ChapterCard } from './components/ChapterCard';
import { useStore } from '@/stores/store';
import { logger } from '@/utils/logger';
import { Zap, Trophy, ChevronLeft } from 'lucide-react';

export function LanguageCoursePage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const appUser = useStore((state) => state.appUser);

  const [chapters, setChapters] = useState<ChapterWithLessons[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 언어 이름 & 아이콘
  const getLanguageInfo = () => {
    switch (lang) {
      case 'c':
        return { name: 'C언어', icon: 'C', color: '#87CEEB' };
      case 'python':
        return { name: 'Python', icon: '🐍', color: '#3776AB' };
      case 'java':
        return { name: 'Java', icon: '☕', color: '#007396' };
      case 'javascript':
        return { name: 'JavaScript', icon: '⚡', color: '#F7DF1E' };
      default:
        return { name: lang?.toUpperCase() || '', icon: '📚', color: '#FFD700' };
    }
  };

  const langInfo = getLanguageInfo();

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
            logger.warn('Progress fetch failed:', err);
          }
        }
        // 비로그인 사용자는 진행 상태 없이 코스만 표시
      } catch (err) {
        if (cancelled) return;
        logger.error('Failed to load course data:', err);
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a08060] mx-auto mb-4"></div>
          <p className="text-[#937b5d]">코스 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-[#6b5a4a] mb-2">코스를 불러올 수 없습니다</h2>
          <p className="text-[#937b5d] mb-6">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary"
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-[#6b5a4a] mb-2">
            {langInfo.name} 코스 준비 중
          </h2>
          <p className="text-[#937b5d] mb-6">
            아직 학습 콘텐츠가 준비되지 않았습니다.
            <br />
            곧 추가될 예정입니다!
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary"
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

  // 레벨 계산 (10레슨 = 1레벨)
  const currentLevel = Math.floor(completedLessons / 10) + 1;
  const xpInLevel = completedLessons % 10;
  const xpToNextLevel = 10;

  return (
    <div className="min-h-screen py-8 px-6 md:px-12 lg:px-16">
      {/* 게임 스타일 헤더 */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/courses')}
          className="group flex items-center gap-2 text-[#937b5d] hover:text-[#FFD700] transition-colors mb-6"
        >
          <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          <span className="text-2xl font-semibold tracking-wider uppercase">Select Course</span>
        </button>

        {/* 메인 헤더 카드 - 언어 색상 기반 */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 md:p-6 lg:p-10"
          style={{
            background: `linear-gradient(135deg, ${langInfo.color}20 0%, ${langInfo.color}35 100%)`,
            border: `2px solid ${langInfo.color}`,
          }}
        >
          {/* 바느질 스티치 */}
          <div
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: '12px',
              left: '12px',
              right: '12px',
              bottom: '12px',
              border: `2px dashed ${langInfo.color}50`,
            }}
          />

          <div className="relative z-10">
            {/* 상단: 언어 아이콘 + 이름 */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white"
                style={{
                  background: langInfo.color,
                  border: `2px solid ${langInfo.color}`,
                }}
              >
                {langInfo.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-800">
                  {langInfo.name}
                </h1>
                <p className="text-gray-500 text-sm">
                  {chapters.length} 챕터 · {totalLessons} 레슨
                </p>
              </div>
            </div>

            {/* 레벨 & XP 바 */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
              {/* 레벨 뱃지 */}
              <div
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-amber-100 border border-amber-300"
              >
                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                <span className="font-bold font-mono text-sm md:text-base text-amber-600">LV.{currentLevel}</span>
              </div>

              {/* XP 바 */}
              <div className="flex-1 w-full md:w-auto">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-mono uppercase text-emerald-600">Progress</span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {completedLessons} / {totalLessons} 완료
                  </span>
                </div>
                <div className="h-3 bg-white rounded-full overflow-hidden border border-gray-200">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-emerald-400"
                    style={{
                      width: `${overallProgress}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400 font-mono">
                    {xpInLevel}/{xpToNextLevel} XP
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">
                    {overallProgress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 챕터 Grid */}
      {lang && (
        <div style={{ marginTop: '80px' }}>
        <CourseGrid>
          {chapters.map((chapter, index) => {
            // 이전 챕터들이 모두 완료되었는지 확인
            const previousChaptersComplete = chapters.slice(0, index).every(ch => {
              const completedInChapter = ch.lessons.filter(
                l => progressMap.get(l.id)?.status === 'completed'
              ).length;
              return completedInChapter === ch.lessons.length;
            });

            // 현재 챕터 진행률
            const completedInChapter = chapter.lessons.filter(
              l => progressMap.get(l.id)?.status === 'completed'
            ).length;
            const isComplete = completedInChapter === chapter.lessons.length && chapter.lessons.length > 0;
            const isLocked = index > 0 && !previousChaptersComplete && completedInChapter === 0;
            const isActive = !isComplete && !isLocked && (index === 0 || previousChaptersComplete);

            return (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                languageId={lang}
                lessonCount={chapter.lessons.length}
                completedCount={completedInChapter}
                isLocked={isLocked}
                isActive={isActive}
              />
            );
          })}
        </CourseGrid>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
