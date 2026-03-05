/**
 * ChapterLessonsPage - 특정 챕터의 레슨 목록 Grid 페이지
 *
 * URL: /courses/:lang/:chapterId
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import i18n from 'i18next';
import type { SupportedLanguage } from '@/types/simulator';
import { CourseGrid } from './components/CourseGrid';
import { LessonCard } from './components/LessonCard';
import { useStore } from '@/stores/store';
import { ChevronLeft, BookOpen, Target, CheckCircle2, Circle, Lock } from 'lucide-react';
import { useIsMobile, useChapter, useChapterProgress } from '@/hooks';
import { getLessonFull } from '@/services/courses';

type LessonProgressSnapshot = {
  status?: 'not_started' | 'in_progress' | 'completed';
};

type LessonWithProgress = {
  id: string;
  order: number;
  progress?: LessonProgressSnapshot | null;
};

// 언어별 색상 (챕터 페이지용)
const getLanguageColor = (lang: string | undefined) => {
  switch (lang) {
    case 'c': return '#87CEEB';
    case 'cpp': return '#818CF8';
    case 'python': return '#FFD54F';
    case 'python-practical': return '#9E9E9E';
    case 'java': return '#EC4899';
    case 'javascript': return '#81C784';
    default: return '#87CEEB';
  }
};

export function ChapterLessonsPage() {
  const { t } = useTranslation();
  const { lang, chapterId } = useParams<{ lang: string; chapterId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setPageTitle = useStore((s) => s.setPageTitle);
  const appUser = useStore((s) => s.appUser);
  const langColor = getLanguageColor(lang);
  const isMobile = useIsMobile();
  const locale = i18n.resolvedLanguage || i18n.language;

  // TanStack Query: 챕터 단건 + 진행 상태 단건(로그인 시)
  const { data: chapter, isLoading, isError, error } = useChapter(chapterId);
  const { data: chapterProgressData } = useChapterProgress(chapterId);

  // 구독 시스템 제거됨 - 챕터 2 이상은 로그인만 필요
  const accessDenied = !!chapter && !appUser && chapter.order >= 2;
  const accessReason = accessDenied ? t('chapter.login_required_for_chapter') : '';

  const progressByLessonId = useMemo(() => {
    const map = new Map<string, LessonProgressSnapshot | null>();
    for (const lesson of chapterProgressData?.lessons ?? []) {
      map.set(lesson.id, lesson.progress ?? null);
    }
    return map;
  }, [chapterProgressData]);

  const getLessonProgress = useCallback((lesson: LessonWithProgress): LessonProgressSnapshot | null => {
    return progressByLessonId.get(lesson.id) ?? null;
  }, [progressByLessonId]);

  // 챕터 레슨 프리페치 (경량)
  // - 첫 미완료 레슨 1개만 예열
  // WHY: 이전에는 레슨 전체를 순차 프리페치해서 이동 시 체감 지연을 유발함
  useEffect(() => {
    if (!chapter?.lessons || chapter.lessons.length === 0 || accessDenied) return;

    const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
    const firstIncomplete = lessons.find((l) => getLessonProgress(l as LessonWithProgress)?.status !== 'completed');
    const targetLessonId = firstIncomplete?.id ?? lessons[0]?.id;
    if (!targetLessonId) return;

    void queryClient.prefetchQuery({
      queryKey: ['lesson', targetLessonId, locale],
      queryFn: () => getLessonFull(targetLessonId),
      staleTime: 5 * 60 * 1000,
    });
  }, [chapter, queryClient, accessDenied, getLessonProgress, locale]);

  // hover 시 해당 레슨 프리페치
  const handlePrefetch = useCallback((lessonId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['lesson', lessonId, locale],
      queryFn: () => getLessonFull(lessonId),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, locale]);

  // 페이지 제목 설정
  useEffect(() => {
    if (chapter) {
      setPageTitle(chapter.title, chapter.description, lang as SupportedLanguage);
    }
  }, [chapter, setPageTitle, lang]);

  // 진행률: 로그인 사용자는 /chapters/:id/progress 값 사용, 비로그인은 0%
  const chapterProgress = useMemo(() => {
    if (!chapter) return { total: 0, completed: 0, percentage: 0 };
    const total = chapterProgressData?.totalCount ?? chapter.lessons?.length ?? 0;
    const completed = chapterProgressData?.completedCount ?? 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [chapter, chapterProgressData]);

  const totalLessons = chapterProgress.total;
  const completedLessons = chapterProgress.completed;
  const progressPercent = chapterProgress.percentage;

  // 에러 상태만 early return
  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">{t('chapter.load_error')}</h2>
          <p className="text-[var(--theme-dashboard-text-muted)] mb-6">
            {error instanceof Error ? error.message : t('errors.unknown')}
          </p>
          <button
            onClick={() => navigate(`/courses/${lang}`)}
            className="btn-primary"
          >
            {t('chapter.back_to_chapters')}
          </button>
        </div>
      </div>
    );
  }

  // 구독 필요 (접근 거부)
  if (accessDenied && chapter) {
    return (
      <div className="min-h-screen py-4 px-3 md:px-12 lg:px-16">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(`/courses/${lang}`)}
          className="group flex items-center gap-2 text-[var(--theme-dashboard-text-muted)] hover:text-[#FFD700] transition-colors mb-6"
        >
          <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          <span className="text-2xl font-semibold tracking-wider uppercase">{t('chapter.back_to_chapters')}</span>
        </button>

        {/* 잠금 안내 */}
        <div className="flex flex-col items-center justify-center py-20">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${langColor}30` }}
          >
            <Lock className="w-12 h-12" style={{ color: langColor }} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-3">
            {chapter.title}
          </h2>
          <p className="text-[var(--theme-dashboard-text-muted)] mb-6 text-center max-w-md">
            {accessReason}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              {t('auth.login')}
            </Link>
            <button
              onClick={() => navigate(`/courses/${lang}`)}
              className="px-6 py-3 border border-[var(--theme-dashboard-card-border)] rounded-xl font-semibold hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
              style={{ color: 'var(--theme-dashboard-text)' }}
            >
              {t('chapter.view_other_chapters')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-3 md:px-12 lg:px-16">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={() => navigate(`/courses/${lang}`)}
        className="group flex items-center gap-2 text-[var(--theme-dashboard-text-muted)] hover:text-[#FFD700] transition-colors mb-6"
      >
        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
        <span className="text-2xl font-semibold tracking-wider uppercase">{t('chapter.back_to_chapters')}</span>
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
                {chapter?.title || t('common.loading')}
              </h1>
              {chapter?.description && (
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
                <span className="text-xs text-emerald-600 font-mono uppercase">{t('courses.progress')}</span>
              </div>
              <span className="text-xs text-[var(--theme-dashboard-text-muted)] font-mono">
                {isLoading ? t('chapter.calculating') : t('chapter.lessons_completed', { completed: completedLessons, total: totalLessons })}
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
                {t('chapter.lessons_remaining', { count: totalLessons - completedLessons })}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-dashboard-accent)] mx-auto mb-4"></div>
            <p className="text-[var(--theme-dashboard-text-muted)]">{t('chapter.loading_lessons')}</p>
          </div>
        </div>
      ) : !chapter ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">
              {t('chapter.no_chapter_info')}
            </h2>
            <p className="text-[var(--theme-dashboard-text-muted)]">
              {t('chapter.cannot_load_chapter')}
            </p>
          </div>
        </div>
      ) : chapter.lessons.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">
              {t('chapter.lessons_preparing')}
            </h2>
            <p className="text-[var(--theme-dashboard-text-muted)]">
              {t('courses.no_content_yet')}
            </p>
          </div>
        </div>
      ) : isMobile ? (
        // 모바일: 리스트 형식
        <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] overflow-hidden">
          {chapter.lessons.map((lesson, index) => {
            const progress = getLessonProgress(lesson as LessonWithProgress);
            const isCompleted = progress?.status === 'completed';

            return (
              <div key={lesson.id}>
                <button
                  onClick={() => navigate(`/courses/${lang}/${chapterId}/${lesson.id}`)}
                  onTouchStart={() => handlePrefetch(lesson.id)}
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
              progress={getLessonProgress(lesson as LessonWithProgress)}
              languageId={lang || 'c'}
              chapterId={chapter.id}
              onPrefetch={handlePrefetch}
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
