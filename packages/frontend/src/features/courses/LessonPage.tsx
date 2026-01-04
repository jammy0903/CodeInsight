/**
 * LessonPage - 레슨 학습 페이지 (API 기반)
 *
 * DayPage의 API 버전. 기존 컴포넌트 99% 재사용.
 * Route: /courses/:lang/:chapterId/:lessonId
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getLessonFull, getChapterWithLessons } from '@/services/courses';
import type { LessonFull, LessonStep, Quiz } from '@/types';

// 기존 컴포넌트 100% 재사용
import { CodeViewer } from './components/day/CodeViewer';
import { StepExplanation } from './components/day/StepExplanation';
import { StepControls } from './components/day/StepControls';
import { SelectedCodeBadge } from './components/day/SelectedCodeBadge';
import { CourseMemoryView } from './components/memory/CourseMemoryView';
import { ChatQA } from '@/features/chat';

// 새 hooks
import { useLessonNavigation } from './hooks/useLessonNavigation';
import { useLessonMemory } from './hooks/useLessonMemory';
import { useCodeSelection } from './hooks/useCodeSelection';

/**
 * 로딩 뷰
 */
function LoadingView() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

/**
 * 에러/Not Found 뷰 (재사용 가능)
 */
function NotFoundView({ message, backPath }: { message: string; backPath: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <AlertCircle className="w-16 h-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold">{message}</h2>
      <Button onClick={() => navigate(backPath)}>뒤로 가기</Button>
    </div>
  );
}

/**
 * 레슨 완료 뷰
 */
function CompletedView({
  lessonOrder,
  nextLessonPath,
  chapterPath,
}: {
  lessonOrder: number;
  nextLessonPath: string | null;
  chapterPath: string;
}) {
  const navigate = useNavigate();
  const hasNext = nextLessonPath !== null;

  return (
    <Card className="max-w-md mx-auto mt-12">
      <CardContent className="pt-6 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold">레슨 {lessonOrder} 완료!</h2>
        <p className="text-muted-foreground">
          {hasNext
            ? '다음 레슨으로 계속 학습하세요.'
            : '이 챕터의 모든 레슨을 완료했습니다!'}
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => navigate(chapterPath)}>
            레슨 목록
          </Button>
          {hasNext && (
            <Button onClick={() => navigate(nextLessonPath)} className="gap-1">
              다음 레슨
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 퀴즈 어댑터 - Quiz를 인라인으로 렌더링
 */
function QuizCardAdapter({
  quiz,
  onComplete,
}: {
  quiz: Quiz;
  onComplete: (isCorrect: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const options = quiz.options || [];
  const correctIndex = options.findIndex((opt) => opt === quiz.answer);
  const isCorrect = selected === correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect);
  };

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium">{quiz.question}</p>

      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => !submitted && setSelected(idx)}
            disabled={submitted}
            className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
              submitted
                ? idx === correctIndex
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : idx === selected
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                : selected === idx
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {submitted && quiz.explanation && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
          <p className="text-sm">{quiz.explanation}</p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={selected === null}>
            제출
          </Button>
        ) : (
          <Button onClick={handleContinue}>
            {isCorrect ? '완료' : '다시 학습하기'}
          </Button>
        )}
      </div>
    </div>
  );
}

export function LessonPage() {
  const { lang, chapterId, lessonId } = useParams<{
    lang: string;
    chapterId: string;
    lessonId: string;
  }>();

  // 상태
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로드
  useEffect(() => {
    if (!lessonId || !chapterId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 레슨 상세 + 챕터 정보 (다음 레슨 찾기용)
        const [lessonData, chapterData] = await Promise.all([
          getLessonFull(lessonId!),
          getChapterWithLessons(chapterId!),
        ]);

        setLesson(lessonData);

        // 다음 레슨 찾기
        const currentIdx = chapterData.lessons.findIndex((l) => l.id === lessonId);
        if (currentIdx < chapterData.lessons.length - 1) {
          setNextLessonId(chapterData.lessons[currentIdx + 1].id);
        } else {
          setNextLessonId(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lessonId, chapterId]);

  // Steps 추출
  const steps: LessonStep[] = lesson?.content?.steps || [];
  const code = lesson?.content?.code || '';
  const quiz = lesson?.quizzes?.[0];

  // Hooks
  const navigation = useLessonNavigation({
    totalSteps: steps.length,
    onComplete: () => {
      // TODO: API로 진행 상태 저장
      console.log('Lesson completed:', lessonId);
    },
  });

  const { memoryState, changedBlocks } = useLessonMemory(steps, navigation.currentStepIndex);
  const { selection, setSelection, clearSelection } = useCodeSelection();

  // 현재 스텝
  const currentStep = steps[navigation.currentStepIndex];

  // 경로
  const chapterPath = `/courses/${lang}/${chapterId}`;
  const nextLessonPath = nextLessonId ? `/courses/${lang}/${chapterId}/${nextLessonId}` : null;

  // 퀴즈 핸들러
  const handleQuizComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      navigation.completeLesson();
    } else {
      navigation.reset();
    }
  };

  // 로딩
  if (loading) return <LoadingView />;

  // 에러
  if (error || !lesson) {
    return <NotFoundView message={error || '레슨을 찾을 수 없습니다'} backPath={chapterPath} />;
  }

  // 콘텐츠 없음
  if (steps.length === 0) {
    return <NotFoundView message="레슨 콘텐츠가 없습니다" backPath={chapterPath} />;
  }

  return (
    <div className="container mx-auto min-h-screen flex flex-col px-4 sm:px-6 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          to={chapterPath}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← 레슨 목록
        </Link>
        <div>
          <h1 className="text-xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{lesson.description}</p>
          )}
        </div>
      </div>

      {/* Completed Phase */}
      {navigation.phase === 'completed' ? (
        <CompletedView
          lessonOrder={lesson.order}
          nextLessonPath={nextLessonPath}
          chapterPath={chapterPath}
        />
      ) : (
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* 상단: 코드 + 메모리 (60%) */}
          <div className="h-[60%] grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            <CodeViewer
              code={code}
              highlightLine={currentStep?.line || 1}
              onSelectionChange={setSelection}
            />
            <CourseMemoryView
              stack={memoryState.stack}
              heap={memoryState.heap}
              changedBlocks={changedBlocks}
            />
          </div>

          {/* 하단: 설명 + 채팅 (40%) */}
          <div className="h-[40%] flex flex-col gap-3 overflow-hidden">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
              {/* 자동 설명 영역 */}
              <div className="rounded-xl border-2 border-neon-cyan bg-stack-bg p-4 overflow-y-auto">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-stack-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-stack-text mb-2">
                      Step {navigation.currentStepIndex + 1} 설명
                    </h3>
                    <StepExplanation
                      explanation={currentStep?.explanation || ''}
                      stepIndex={navigation.currentStepIndex}
                    />
                  </div>
                </div>
              </div>

              {/* AI 채팅 영역 */}
              <div className="rounded-xl border-2 border-border bg-warm-white overflow-hidden relative">
                {selection && (
                  <SelectedCodeBadge selection={selection} onClear={clearSelection} />
                )}
                <ChatQA
                  context={{
                    courseDay: lesson.order,
                    topic: lesson.title,
                    code: code,
                    currentLine: currentStep?.line,
                  }}
                  selectedText={selection?.text}
                />
              </div>
            </div>

            {/* 스텝 컨트롤 */}
            <div className="shrink-0">
              <StepControls
                currentStep={navigation.currentStepIndex + 1}
                totalSteps={navigation.totalSteps}
                canGoPrev={navigation.canGoPrev}
                canGoNext={navigation.canGoNext}
                isLastStep={navigation.isLastStep}
                onPrev={navigation.goToPrevStep}
                onNext={navigation.goToNextStep}
                onGoToQuiz={navigation.goToQuiz}
              />
            </div>
          </div>

          {/* Quiz Modal */}
          {quiz && (
            <Dialog
              open={navigation.phase === 'quiz'}
              onOpenChange={(open) => !open && navigation.reset()}
            >
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    🧠 퀴즈
                  </DialogTitle>
                </DialogHeader>
                <QuizCardAdapter quiz={quiz} onComplete={handleQuizComplete} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}
