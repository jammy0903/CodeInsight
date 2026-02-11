/**
 * LessonPage - 레슨 학습 페이지 (오케스트레이터)
 *
 * 역할: 훅 조합 + 레이아웃 선택 (데스크톱/모바일/완료/퀴즈)
 * Route: /courses/:lang/:chapterId/:lessonId
 */

import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Flag } from 'lucide-react';
import { updateProgress } from '@/services/courses';
import { useStore } from '@/stores/store';

// Hooks
import { useLessonData } from './hooks/useLessonData';
import { useLessonNavigation } from './hooks/useLessonNavigation';
import { useLessonVisualization } from './hooks/useLessonVisualization';
import { useCodeSelection } from './hooks/useCodeSelection';
import { useLessonAnalytics } from './hooks/useLessonAnalytics';
import { useLessonSimulation } from './hooks/useLessonSimulation';
import { useLessonTerminal } from './hooks/useLessonTerminal';
import { useStepGestures } from './hooks/useStepGestures';
import { useIsMobile } from '@/hooks';

// Layout Components
import { LessonDesktopLayout } from './components/LessonDesktopLayout';
import { LessonCompletedView } from './components/LessonCompletedView';
import { LessonQuizModal } from './components/LessonQuizModal';
import { LessonBottomNav } from './components/LessonBottomNav';
import { MobileAIChatFAB, MobileAIChatModal, MobileLessonView } from './components/mobile';
import { ReportModal } from '@/components/ReportModal';

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
  const isMobile = useIsMobile();
  const [reportOpen, setReportOpen] = React.useState(false);

  // 1. 데이터 패칭
  const { lesson, isLoading, isError, error, nextLessonId, quiz } = useLessonData({
    lessonId,
    chapterId,
    lang,
  });

  // 2. 시뮬레이션
  const { steps, code, simulating } = useLessonSimulation({ lesson, lang, lessonId });

  // 3. 네비게이션
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

  // 5. 시각화
  const { memoryState, changedBlocks } = useLessonVisualization(steps, navigation.currentStepIndex);
  const { setSelection } = useCodeSelection();

  // 6. 키보드 제스처 (데스크톱)
  useStepGestures({
    onPrev: navigation.goToPrevStep,
    onNext: navigation.isLastStep ? navigation.goToQuiz : navigation.goToNextStep,
    enabled: navigation.phase === 'learning' && !isMobile,
    isModalOpen: navigation.phase === 'quiz',
    canGoPrev: navigation.canGoPrev,
    canGoNext: true,
  });

  // 7. 터미널 출력
  const currentStep = steps[navigation.currentStepIndex];
  const displayLine = currentStep?.line || 1;

  const terminalLines = useLessonTerminal({
    steps,
    currentStepIndex: navigation.currentStepIndex,
    languageId: lang || 'c',
    diffMode: true,
  });

  // --- 파생 데이터 ---
  const languageCoursePath = `/courses/${lang}`;
  const nextLessonPath =
    nextLessonId && lesson ? `/courses/${lang}/${lesson.chapterId}/${nextLessonId}` : null;

  const handleQuizComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      navigation.completeLesson();
    } else {
      navigation.reset();
    }
  };

  // --- Early Returns ---
  // API 로딩만 블로킹 — 시뮬레이션 중에는 코드+설명을 먼저 표시
  if (isLoading) return <LoadingView />;
  if (isError || !lesson)
    return (
      <NotFoundView
        message={error instanceof Error ? error.message : t('lesson.not_found')}
        backPath={languageCoursePath}
      />
    );
  // 시뮬레이션 진행 중이면 NotFound 대신 로딩 표시
  if (steps.length === 0 && !simulating)
    return <NotFoundView message={t('lesson.no_content')} backPath={languageCoursePath} />;
  if (steps.length === 0 && simulating) return <LoadingView />;

  // --- 렌더 ---
  return (
    <div className="lesson-page-container">
      {/* 메인 콘텐츠 */}
      {navigation.phase === 'completed' ? (
        <LessonCompletedView
          lessonOrder={lesson.order}
          nextLessonPath={nextLessonPath}
          chapterPath={languageCoursePath}
        />
      ) : isMobile ? (
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <div className="flex-1 min-h-0">
            <MobileLessonView
              code={code}
              steps={steps}
              currentStepIndex={navigation.currentStepIndex}
              languageId={lang || 'c'}
              lessonId={lessonId || ''}
              lessonTitle={lesson.title}
              lessonOrder={lesson.order}
              onPrevStep={navigation.goToPrevStep}
              onNextStep={navigation.goToNextStep}
              onQuiz={navigation.goToQuiz}
            />
          </div>
        </div>
      ) : (
        <LessonDesktopLayout
          code={code}
          steps={steps}
          currentStepIndex={navigation.currentStepIndex}
          displayLine={displayLine}
          lang={lang || 'c'}
          lessonId={lessonId}
          lessonOrder={lesson.order}
          lessonTitle={lesson.title}
          terminalLines={terminalLines}
          memoryState={memoryState}
          changedBlocks={changedBlocks}
          onSelectionChange={setSelection}
        />
      )}

      {/* 하단 네비게이션 */}
      {navigation.phase !== 'completed' && (
        <>
          <LessonBottomNav
            onPrev={navigation.goToPrevStep}
            onNext={navigation.isLastStep ? navigation.goToQuiz : navigation.goToNextStep}
            canGoPrev={navigation.canGoPrev}
            nextLabel={navigation.isLastStep ? t('lesson.quiz') : t('common.next')}
          />
          {/* 레슨 신고 버튼 */}
          <button
            onClick={() => setReportOpen(true)}
            className="fixed bottom-[76px] right-4 z-40 p-2 rounded-full opacity-40 hover:opacity-100 transition-opacity"
            style={{
              backgroundColor: 'var(--theme-layout-footer-social-bg)',
              color: 'var(--theme-layout-footer-text-muted)',
            }}
            title={t('report.lesson_title')}
          >
            <Flag className="w-4 h-4" />
          </button>
        </>
      )}

      {/* 레슨 신고 모달 */}
      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        type="lesson"
        lessonId={lessonId}
      />

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

      {/* 모바일 AI 채팅 */}
      {isMobile && navigation.phase !== 'completed' && (
        <MobileAIChatOverlay
          lessonId={lessonId}
          lessonOrder={lesson.order}
          lessonTitle={lesson.title}
          code={code}
          currentLine={currentStep?.line}
        />
      )}
    </div>
  );
}

// --- 모바일 AI 채팅 오버레이 (FAB + Modal) ---

function MobileAIChatOverlay({
  lessonId,
  lessonOrder,
  lessonTitle,
  code,
  currentLine,
}: {
  lessonId: string | undefined;
  lessonOrder: number;
  lessonTitle: string;
  code: string;
  currentLine: number | undefined;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <MobileAIChatFAB isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      <MobileAIChatModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={{
          courseDay: lessonOrder,
          topic: lessonTitle,
          code,
          currentLine,
        }}
        lessonId={lessonId}
      />
    </>
  );
}
