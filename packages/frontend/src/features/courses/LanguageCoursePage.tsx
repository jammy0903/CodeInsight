import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '@/types/simulator';
import type { ChapterWithLessons } from '@/types';
import { CourseGrid } from './components/CourseGrid';
import { ChapterCard } from './components/ChapterCard';
import { useStore } from '@/stores/store';
import { ChevronLeft } from 'lucide-react';
import { useIsMobile, useLanguageCourse } from '@/hooks';
import { CBrandIcon } from '@/components/ui/CBrandIcon';

interface ChapterProgressSnapshot {
  total: number;
  completed: number;
  percentage: number;
}

type ChapterWithProgress = ChapterWithLessons & {
  progress?: {
    total?: number;
    completed?: number;
    percentage?: number;
  };
};

function getChapterProgress(chapter: ChapterWithLessons): ChapterProgressSnapshot {
  const chapterWithProgress = chapter as ChapterWithProgress;
  const total = chapterWithProgress.progress?.total ?? chapter.lessons?.length ?? 0;
  const completed = chapterWithProgress.progress?.completed ?? 0;
  const percentage = chapterWithProgress.progress?.percentage ?? 0;
  return { total, completed, percentage };
}

interface LanguageCoursePageProps {
  langOverride?: string;
}

export function LanguageCoursePage({ langOverride }: LanguageCoursePageProps = {}) {
  const { t } = useTranslation();
  const { lang: routeLang } = useParams<{ lang: string }>();
  const lang = langOverride ?? routeLang;
  const navigate = useNavigate();
  const setPageTitle = useStore((s) => s.setPageTitle);
  const authLoading = useStore((s) => s.authLoading);

  // TanStack Query: loading, error, data 자동 관리
  const { data, isLoading, isError, error } = useLanguageCourse(lang);

  // 언어 이름 & 아이콘 & 설명
  const getLanguageInfo = () => {
    switch (lang) {
      case 'c':
        return {
          name: t('languages.c'),
          icon: 'C',
          color: '#3B82F6',
          description: t('language_desc.c')
        };
      case 'cpp':
        return {
          name: t('languages.cpp'),
          icon: 'C++',
          color: '#2563EB',
          description: t('language_desc.cpp')
        };
      case 'python':
        return {
          name: 'Python',
          icon: '🐍',
          color: '#FFD54F',
          description: t('language_desc.python')
        };
      case 'java':
        return {
          name: 'Java',
          icon: '☕',
          color: '#EC4899',
          description: t('language_desc.java')
        };
      case 'javascript':
        return {
          name: 'JavaScript',
          icon: '⚡',
          color: '#81C784',
          description: t('language_desc.javascript')
        };
      case 'python-practical':
        return {
          name: t('languages.python_practical'),
          icon: '🤖',
          color: '#9E9E9E',
          description: t('language_desc.python_practical')
        };
      default:
        return {
          name: lang?.toUpperCase() || '',
          icon: '📚',
          color: '#FFD700',
          description: t('language_desc.default')
        };
    }
  };

  const langInfo = getLanguageInfo();
  const isMobile = useIsMobile();

  // 데이터에서 language와 chapters 추출
  const chapters = data?.chapters || [];
  const pageLoading = authLoading || isLoading;

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle(t('courses.course_title', { name: langInfo.name }), langInfo.description, lang as SupportedLanguage);
  }, [setPageTitle, langInfo.name, langInfo.description, lang, t]);

  // 에러 상태만 early return
  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">{t('courses.load_error')}</h2>
          <p className="text-[var(--theme-dashboard-text-muted)] mb-6">
            {error instanceof Error ? error.message : t('errors.unknown')}
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary"
          >
            {t('courses.back_to_list')}
          </button>
        </div>
      </div>
    );
  }

  // 전체 레슨 수 계산 (로딩 중에는 0으로 표시)
  const totalLessons = chapters.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0);

  return (
    <div className="min-h-screen py-4 px-3 md:px-12 lg:px-16">
      {/* 게임 스타일 헤더 */}
      <div className="mb-10">
        <button
          onClick={() => navigate('/courses')}
          className="group flex items-center gap-2 text-[var(--theme-dashboard-text-muted)] hover:text-[#FFD700] transition-colors mb-6"
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
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white"
                style={{
                  background: langInfo.color,
                  border: `2px solid ${langInfo.color}`,
                }}
              >
                {lang === 'c' && <CBrandIcon language="c" size={63} />}
                {lang === 'cpp' && <CBrandIcon language="cpp" size={63} />}
                {lang !== 'c' && lang !== 'cpp' && langInfo.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--theme-dashboard-title)]">
                  {langInfo.name}
                </h1>
                <p className="text-[var(--theme-dashboard-text-muted)] text-sm">
                  {pageLoading ? t('common.loading') : `${chapters.length} ${t('courses.chapters')} · ${totalLessons} ${t('courses.lessons')}`}
                </p>
                <p className="text-[var(--theme-dashboard-text-muted)] text-xs mt-1">
                  {langInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 챕터 리스트 */}
      <div style={{ marginTop: '80px' }}>
        {pageLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-dashboard-accent)] mx-auto mb-4"></div>
              <p className="text-[var(--theme-dashboard-text-muted)]">{t('courses.loading_chapters')}</p>
            </div>
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">
                {t('courses.preparing', { name: langInfo.name })}
              </h2>
              <p className="text-[var(--theme-dashboard-text-muted)] mb-6">
                {t('courses.no_content_yet')}
              </p>
              <button
                onClick={() => navigate('/courses')}
                className="btn-primary"
              >
                {t('courses.back_to_list')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {isMobile ? (
              // 모바일: 리스트 형식
              <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] overflow-hidden">
                {chapters.map((chapter, index) => {
                  // 백엔드에서 계산된 진행률 사용 (DRY 원칙)
                  const { total, completed, percentage: progress } = getChapterProgress(chapter);

                  return (
                    <div key={chapter.id}>
                      <button
                        onClick={() => navigate(`/courses/${lang}/${chapter.id}`)}
                        className="w-full p-4 text-left transition-colors hover:bg-[var(--theme-layout-top-bar-button-hover)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-[#333] flex items-center gap-2 flex-shrink-0">
                            {chapter.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* 레슨 개수만큼 동그라미 */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: total }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-2 h-2 rounded-full transition-colors"
                                  style={{
                                    backgroundColor: i < completed ? '#a08060' : '#e5d5c7',
                                  }}
                                />
                              ))}
                            </div>
                            {/* 퍼센트 */}
                            <span className="text-sm font-mono text-[var(--theme-dashboard-text-muted)] min-w-[3rem] text-right">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </button>
                      {index < chapters.length - 1 && (
                        <div className="border-b border-[var(--theme-dashboard-card-border)]" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // 데스크톱: 그리드 형식
              <CourseGrid>
                {chapters.map((chapter, index) => {
                  // 백엔드에서 계산된 진행률 사용 (DRY 원칙)
                  const { total, completed } = getChapterProgress(chapter);
                  const isComplete = total > 0 && completed === total;
                  const isActive = !isComplete && index === 0;

                  return (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      languageId={lang}
                      lessonCount={total}
                      completedCount={completed}
                      isActive={isActive}
                    />
                  );
                })}
              </CourseGrid>
            )}
          </div>
        )}
      </div>

      {/* 하단 여백 */}
      <div className="h-16" />
    </div>
  );
}
