/**
 * ChapterLessonsPage - 특정 챕터의 레슨 목록 Grid 페이지
 *
 * URL: /courses/:lang/:chapterId
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChapterWithLessons, UserProgress } from '@/types';
import { getChapterWithLessons, getUserProgress } from '@/services/courses';
import { CourseGrid } from './components/CourseGrid';
import { LessonCard } from './components/LessonCard';
import { useStore } from '@/stores/store';
import { logger } from '@/utils/logger';
import { ChevronLeft, BookOpen, Target, CheckCircle2, Circle } from 'lucide-react';
import { useIsMobile } from '@/hooks';

// 언어별 색상 (챕터 페이지용)
const getLanguageColor = (lang: string | undefined) => {
  switch (lang) {
    case 'c': return '#87CEEB';
    case 'python': return '#FFD54F';
    case 'python-practical': return '#9E9E9E';
    case 'java': return '#EC4899';
    case 'javascript': return '#81C784';
    default: return '#87CEEB';
  }
};

export function ChapterLessonsPage() {
  const { lang, chapterId } = useParams<{ lang: string; chapterId: string }>();
  const navigate = useNavigate();
  const { appUser, setPageTitle } = useStore();
  const langColor = getLanguageColor(lang);
  const isMobile = useIsMobile();

  const [chapter, setChapter] = useState<ChapterWithLessons | null>(null);
  const [progressMap, setProgressMap] = useState<Map<string, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지 제목 설정
  useEffect(() => {
    if (chapter) {
      setPageTitle(chapter.title, chapter.description, lang as SupportedLanguage);
    }
  }, [chapter, setPageTitle, lang]);

  useEffect(() => {
    if (!chapterId) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. 챕터 + 레슨 목록 가져오기
        const chapterData = await getChapterWithLessons(chapterId);

        if (cancelled) return;
        setChapter(chapterData);

        // 2. 진행 상태 가져오기 (로그인한 사용자만)
        if (appUser) {
          try {
            const progressList = await getUserProgress();
            if (cancelled) return;
            const map = new Map<string, UserProgress>();
            progressList.forEach((p) => map.set(p.lessonId, p));
            setProgressMap(map);
          } catch (err) {
            logger.warn('Progress fetch failed:', err);
          }
        }
      } catch (err) {
        if (cancelled) return;
        logger.error('Failed to load chapter data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chapter data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [chapterId, appUser]);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-dashboard-accent)] mx-auto mb-4"></div>
          <p className="text-[var(--theme-dashboard-text-muted)]">레슨 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !chapter) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">챕터를 불러올 수 없습니다</h2>
          <p className="text-[var(--theme-dashboard-text-muted)] mb-6">{error || 'Chapter not found'}</p>
          <button
            onClick={() => navigate(`/courses/${lang}`)}
            className="btn-primary"
          >
            챕터 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 진행률 계산
  const totalLessons = chapter.lessons.length;
  const completedLessons = chapter.lessons.filter(
    (lesson) => progressMap.get(lesson.id)?.status === 'completed'
  ).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen py-4 px-3 md:px-12 lg:px-16">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate(`/courses/${lang}`)}
        className="group flex items-center gap-2 text-[var(--theme-dashboard-text-muted)] hover:text-[#FFD700] transition-colors mb-6"
      >
        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        <span className="text-2xl font-semibold tracking-wider uppercase">Back to Chapters</span>
      </button>

      {/* 챕터 헤더 - 언어 색상 기반 */}
      <div
        className="relative overflow-hidden rounded-2xl mb-10"
        style={{
          padding: '40px',
          background: `linear-gradient(135deg, ${langColor}20 0%, ${langColor}35 100%)`,
          border: `2px solid ${langColor}`,
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
            border: `2px dashed ${langColor}50`,
          }}
        />

        <div className="relative z-10">
          {/* 챕터 제목 */}
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: langColor }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--theme-dashboard-title)] tracking-tight mb-2">
                {chapter.title}
              </h1>
              {chapter.description && (
                <p className="text-[var(--theme-dashboard-text-muted)] text-sm">
                  {chapter.description}
                </p>
              )}
            </div>
          </div>

          {/* 진행률 바 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-mono uppercase">Progress</span>
              </div>
              <span className="text-xs text-[var(--theme-dashboard-text-muted)] font-mono">
                {completedLessons} / {totalLessons} 레슨 완료
              </span>
            </div>
            <div className="h-3 bg-white rounded-full overflow-hidden border border-[var(--theme-dashboard-card-border)]">
              <div
                className="h-full rounded-full transition-all duration-500 bg-emerald-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[var(--theme-dashboard-text-muted)] font-mono">
                {totalLessons - completedLessons} 레슨 남음
              </span>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 레슨 리스트/그리드 */}
      <div style={{ marginTop: '80px' }}>
      {chapter.lessons.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">
              레슨 준비 중
            </h2>
            <p className="text-[var(--theme-dashboard-text-muted)]">
              아직 학습 콘텐츠가 준비되지 않았습니다.
            </p>
          </div>
        </div>
      ) : isMobile ? (
        // 모바일: 리스트 형식
        <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] overflow-hidden">
          {chapter.lessons.map((lesson, index) => {
            const progress = progressMap.get(lesson.id);
            const isCompleted = progress?.status === 'completed';

            return (
              <div key={lesson.id}>
                <button
                  onClick={() => navigate(`/courses/${lang}/${chapterId}/${lesson.id}`)}
                  className="w-full p-4 text-left transition-colors hover:bg-[var(--theme-layout-top-bar-button-hover)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-[#333] flex items-center gap-2 flex-1">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--theme-dashboard-text-muted)] flex-shrink-0" />
                      )}
                      <span className={isCompleted ? 'text-[var(--theme-dashboard-text-muted)] line-through' : ''}>
                        {lesson.title}
                      </span>
                    </h3>
                  </div>
                </button>
                {index < chapter.lessons.length - 1 && (
                  <div className="border-b border-[var(--theme-dashboard-card-border)]" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // 데스크톱: 그리드 형식
        <CourseGrid>
          {chapter.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={progressMap.get(lesson.id)}
              languageId={lang || 'c'}
              chapterId={chapter.id}
            />
          ))}
        </CourseGrid>
      )}
      </div>

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
