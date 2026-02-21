/**
 * LessonPage - 레슨 학습 페이지 (오케스트레이터)
 *
 * 역할: 데이터 패칭 + 시뮬레이션 + 위상 관리 (학습/퀴즈/완료)
 * 레이아웃은 LessonUnifiedView에 위임 (데스크톱/모바일 자동 전환)
 *
 * Route: /courses/:lang/:chapterId/:lessonId
 */

import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { updateProgress } from '@/services/courses';
import { useStore } from '@/stores/store';

// Hooks
import { useLessonData } from './hooks/useLessonData';
import { useLessonNavigation } from './hooks/useLessonNavigation';
import { useLessonAnalytics } from './hooks/useLessonAnalytics';
import { useLessonSimulation } from './hooks/useLessonSimulation';
import { useCodeSelection } from './hooks/useCodeSelection';

// Layout Components
import { LessonUnifiedView } from './components/LessonUnifiedView';
import { LessonCompletedView } from './components/LessonCompletedView';
import { LessonQuizModal } from './components/LessonQuizModal';

// --- 간단한 상태 뷰 ---

function LoadingView() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

function NotFoundView({ message, backPath }: { message: string; backPath: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle className="w-16 h-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{message}</h2>
      <button onClick={() => navigate(backPath)} className="btn-secondary px-4 py-2 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>
    </div>
  );
}

// --- 메인 컴포넌트 ---

export function LessonPage() {
  const { t } = useTranslation();
  const { lang, chapterId, lessonId } = useParams<{
    lang: string;
    chapterId: string;
    lessonId: string;
  }>();

  const queryClient = useQueryClient();
  const appUser = useStore((s) => s.appUser);
  const refreshStreak = useStore((s) => s.refreshStreak);
  const [resetCount, setResetCount] = React.useState(0);

  // 1. 데이터 패칭
  const { lesson, isLoading, isError, error, nextLessonId, quiz } = useLessonData({
    lessonId,
    chapterId,
    lang,
  });

  // 2. 시뮬레이션
  const { steps, code, simulating } = useLessonSimulation({ lesson, lang, lessonId });

  // 3. 위상 관리 (학습/퀴즈/완료)
  const analyticsRef = useRef<{ finishTracking: () => void }>({ finishTracking: () => {} });

  const navigation = useLessonNavigation({
    totalSteps: steps.length,
    lessonId,
    code,
    steps,
    onComplete: async () => {
      if (!lessonId) return;
      try {
        await updateProgress({ lessonId, status: 'completed' });
        queryClient.invalidateQueries({ queryKey: ['progress', appUser?.id] });
        queryClient.invalidateQueries({ queryKey: ['language'] });
        await refreshStreak();
      } catch (err) {
        console.error('[Progress] Failed to save:', err);
      }
      analyticsRef.current.finishTracking();
    },
  });

  // 4. 분석
  const analytics = useLessonAnalytics({
    lessonId,
    totalSteps: steps.length,
    currentStepIndex: navigation.currentStepIndex,
  });

  useEffect(() => {
    analyticsRef.current = { finishTracking: analytics.finishTracking };
  }, [analytics.finishTracking]);

  // 5. 코드 선택
  const { setSelection } = useCodeSelection();

  // --- 파생 데이터 ---
  const languageCoursePath = `/courses/${lang}`;
  const nextLessonPath =
    nextLessonId && lesson ? `/courses/${lang}/${lesson.chapterId}/${nextLessonId}` : null;

  const handleQuizComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      navigation.completeLesson();
    } else {
      navigation.reset();
      setResetCount((c) => c + 1);
    }
  };

  // --- Early Returns ---
  if (isLoading) return <LoadingView />;
  if (isError || !lesson)
    return (
      <NotFoundView
        message={error instanceof Error ? error.message : t('lesson.not_found')}
        backPath={languageCoursePath}
      />
    );
  if (steps.length === 0 && !simulating)
    return <NotFoundView message={t('lesson.no_content')} backPath={languageCoursePath} />;
  if (steps.length === 0 && simulating) return <LoadingView />;

  // --- 렌더 ---
  return (
    <div className="lesson-page-container">
      {/* 신고 UI는 의도적으로 LessonPage에 두지 않는다.
          플로팅 버튼은 하단 내비(Prev/Next)와 충돌 가능성이 있어 제거했고,
          신고 진입은 Sidebar에서만 제공한다. */}
      {navigation.phase === 'completed' ? (
        <LessonCompletedView
          lessonOrder={lesson.order}
          nextLessonPath={nextLessonPath}
          chapterPath={languageCoursePath}
        />
      ) : (
        <LessonUnifiedView
          key={`${lessonId}-${resetCount}`}
          code={code}
          steps={steps}
          languageId={lang || 'c'}
          lessonId={lessonId || ''}
          onQuiz={navigation.goToQuiz}
          onSelectionChange={setSelection}
        />
      )}

      {/* 퀴즈 모달 */}
      {quiz && (
        <LessonQuizModal
          quiz={quiz}
          open={navigation.phase === 'quiz'}
          onOpenChange={(open) => !open && navigation.reset()}
          onComplete={handleQuizComplete}
          onPrevStep={navigation.goToPrevStep}
          canGoPrev={navigation.canGoPrev}
        />
      )}

    </div>
  );
}
