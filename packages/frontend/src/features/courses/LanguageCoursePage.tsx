import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChapterWithLessons, UserProgress } from '@/types';
import { getChapters, getChapterWithLessons, getUserProgress } from '@/services/courses';
import { ChapterAccordion } from './components/ChapterAccordion';
import { useStore } from '@/stores/store';
import { logger } from '@/utils/logger';
import { Zap, Trophy, Lock, ChevronLeft } from 'lucide-react';

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
        return { name: 'C언어', icon: 'C', color: '#00599C' };
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
    <div className="min-h-screen py-8">
      {/* 게임 스타일 헤더 */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/courses')}
          className="group flex items-center gap-2 text-[#937b5d] hover:text-[#FFD700] transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold tracking-wider uppercase">Select Course</span>
        </button>

        {/* 메인 헤더 카드 - 네온 글로우 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 border border-[#FFD700]/20">
          {/* 배경 그리드 패턴 */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#FFD700 1px, transparent 1px), linear-gradient(90deg, #FFD700 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />

          {/* 글로우 효과 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00D9FF]/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* 상단: 언어 아이콘 + 이름 */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${langInfo.color}40, ${langInfo.color}20)`,
                  border: `2px solid ${langInfo.color}`,
                  boxShadow: `0 0 20px ${langInfo.color}40`
                }}
              >
                {langInfo.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  {langInfo.name}
                </h1>
                <p className="text-[#00D9FF] text-sm font-mono">
                  {chapters.length} STAGES · {totalLessons} MISSIONS
                </p>
              </div>
            </div>

            {/* 레벨 & XP 바 */}
            <div className="flex items-center gap-6">
              {/* 레벨 뱃지 */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30">
                <Trophy className="w-5 h-5 text-[#FFD700]" />
                <span className="text-[#FFD700] font-bold font-mono">LV.{currentLevel}</span>
              </div>

              {/* XP 바 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00D9FF]" />
                    <span className="text-xs text-[#00D9FF] font-mono uppercase">Experience</span>
                  </div>
                  <span className="text-xs text-white/60 font-mono">
                    {completedLessons} / {totalLessons} Completed
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${overallProgress}%`,
                      background: 'linear-gradient(90deg, #00D9FF, #A855F7, #FF6B9D)',
                      boxShadow: '0 0 10px #00D9FF80'
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-white/40 font-mono">
                    {xpInLevel}/{xpToNextLevel} XP to next level
                  </span>
                  <span className="text-[10px] text-[#FFD700] font-mono font-bold">
                    {overallProgress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 스테이지 목록 */}
      {lang && (
        <div className="space-y-4 pl-16">
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
              <div
                key={chapter.id}
                className="relative"
              >
                {/* 스테이지 번호 뱃지 */}
                <div className="absolute -left-16 top-4 z-10">
                  <div className={`
                    w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all duration-300
                    ${isComplete
                      ? 'bg-gradient-to-br from-[#FFD700] to-[#F97316] text-[#1a1a2e] shadow-[0_0_20px_#FFD70060]'
                      : isActive
                        ? 'bg-gradient-to-br from-[#00D9FF] to-[#3B82F6] text-white shadow-[0_0_20px_#00D9FF60]'
                        : 'bg-[#2a2a3e] text-white/50 border border-white/20'
                    }
                  `}>
                    {isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <>
                        <span className="text-[8px] uppercase tracking-wider opacity-80">Stage</span>
                        <span className="text-base font-bold">{index + 1}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 연결선 */}
                {index < chapters.length - 1 && (
                  <div
                    className={`absolute -left-10 top-16 w-0.5 h-8 ${
                      isComplete ? 'bg-[#FFD700]/50' : 'bg-white/10'
                    }`}
                  />
                )}

                {/* 챕터 아코디언 */}
                <ChapterAccordion
                  chapter={chapter}
                  lessons={chapter.lessons}
                  progressMap={progressMap}
                  languageId={lang}
                  defaultOpen={isActive}
                  isLocked={isLocked}
                  isActive={isActive}
                  stageNum={index + 1}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
