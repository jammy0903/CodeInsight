import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChapterWithLessons } from '@/types';
import { CourseGrid } from './components/CourseGrid';
import { ChapterCard } from './components/ChapterCard';
import { useStore } from '@/stores/store';
import { ChevronLeft, Lock } from 'lucide-react';
import { useIsMobile, useLanguageCourse } from '@/hooks';

export function LanguageCoursePage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { setPageTitle } = useStore();

  // TanStack Query: loading, error, data 자동 관리
  const { data, isLoading, isError, error } = useLanguageCourse(lang);

  // 언어 이름 & 아이콘 & 설명
  const getLanguageInfo = () => {
    switch (lang) {
      case 'c':
        return {
          name: 'C언어',
          icon: 'C',
          color: '#87CEEB',
          description: '메모리와 포인터의 원리를 이해하는 시스템 프로그래밍'
        };
      case 'python':
        return {
          name: 'Python',
          icon: '🐍',
          color: '#FFD54F',
          description: '파이썬으로 배우는 프로그래밍 기초와 데이터 처리'
        };
      case 'java':
        return {
          name: 'Java',
          icon: '☕',
          color: '#EC4899',
          description: '객체지향 프로그래밍과 JVM의 동작 원리'
        };
      case 'javascript':
        return {
          name: 'JavaScript',
          icon: '⚡',
          color: '#81C784',
          description: '웹 개발을 위한 자바스크립트 핵심 개념'
        };
      case 'python-practical':
        return {
          name: 'Python실용',
          icon: '🤖',
          color: '#9E9E9E',
          description: '실무에서 바로 쓰는 파이썬 자동화 스크립트'
        };
      default:
        return {
          name: lang?.toUpperCase() || '',
          icon: '📚',
          color: '#FFD700',
          description: '프로그래밍의 기초부터 심화까지'
        };
    }
  };

  const langInfo = getLanguageInfo();
  const isMobile = useIsMobile();

  // 데이터에서 language와 chapters 추출
  const language = data;
  const chapters = data?.chapters || [];

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle(`${langInfo.name} 코스`, langInfo.description, lang as SupportedLanguage);
  }, [setPageTitle, langInfo.name, langInfo.description, lang]);

  // 에러 상태만 early return
  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">코스를 불러올 수 없습니다</h2>
          <p className="text-[var(--theme-dashboard-text-muted)] mb-6">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
          </p>
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
                {langInfo.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--theme-dashboard-title)]">
                  {langInfo.name}
                </h1>
                <p className="text-[var(--theme-dashboard-text-muted)] text-sm">
                  {isLoading ? '로딩 중...' : `${chapters.length} 챕터 · ${totalLessons} 레슨`}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-dashboard-accent)] mx-auto mb-4"></div>
              <p className="text-[var(--theme-dashboard-text-muted)]">챕터 로딩 중...</p>
            </div>
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-2">
                {langInfo.name} 코스 준비 중
              </h2>
              <p className="text-[var(--theme-dashboard-text-muted)] mb-6">
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
        ) : (
          <div>
            {isMobile ? (
              // 모바일: 리스트 형식
              <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] overflow-hidden">
                {chapters.map((chapter, index) => {
                  const chapterLessons = chapter.lessons || [];

                  // 백엔드에서 계산된 진행률 사용 (DRY 원칙)
                  const total = (chapter as any).progress?.total || chapterLessons.length;
                  const completed = (chapter as any).progress?.completed || 0;
                  const progress = (chapter as any).progress?.percentage || 0;

                  // 이전 챕터들이 모두 완료되었는지 확인
                  const previousChaptersComplete = chapters.slice(0, index).every(ch => {
                    const prevTotal = (ch as any).progress?.total || ch.lessons?.length || 0;
                    const prevCompleted = (ch as any).progress?.completed || 0;
                    return prevTotal > 0 && prevCompleted === prevTotal;
                  });

                  const isLocked = language?.isSequential
                    ? index > 0 && !previousChaptersComplete && completed === 0
                    : false;

                  return (
                    <div key={chapter.id}>
                      <button
                        onClick={() => !isLocked && navigate(`/courses/${lang}/${chapter.id}`)}
                        disabled={isLocked}
                        className="w-full p-4 text-left transition-colors hover:bg-[var(--theme-layout-top-bar-button-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-[#333] flex items-center gap-2 flex-shrink-0">
                            {isLocked && <Lock className="w-4 h-4 text-[var(--theme-dashboard-text-muted)]" />}
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
                  const chapterLessons = chapter.lessons || [];

                  // 백엔드에서 계산된 진행률 사용 (DRY 원칙)
                  const total = (chapter as any).progress?.total || chapterLessons.length;
                  const completed = (chapter as any).progress?.completed || 0;

                  // 이전 챕터들이 모두 완료되었는지 확인
                  const previousChaptersComplete = chapters.slice(0, index).every(ch => {
                    const prevTotal = (ch as any).progress?.total || ch.lessons?.length || 0;
                    const prevCompleted = (ch as any).progress?.completed || 0;
                    return prevTotal > 0 && prevCompleted === prevTotal;
                  });

                  const isComplete = total > 0 && completed === total;
                  // isSequential이 false면 모든 챕터 즉시 열림
                  const isLocked = language?.isSequential
                    ? index > 0 && !previousChaptersComplete && completed === 0
                    : false;
                  const isActive = !isComplete && !isLocked && (index === 0 || previousChaptersComplete);

                  return (
                    <ChapterCard
                      key={chapter.id}
                      chapter={chapter}
                      languageId={lang}
                      lessonCount={total}
                      completedCount={completed}
                      isLocked={isLocked}
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
