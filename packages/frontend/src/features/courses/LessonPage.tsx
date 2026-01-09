/**
 * LessonPage - 레슨 학습 페이지 (API 기반)
 *
 * DayPage의 API 버전. 기존 컴포넌트 99% 재사용.
 * Route: /courses/:lang/:chapterId/:lessonId
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, MessageSquare, Cpu, Bot, Code2 } from 'lucide-react';
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
import { useLessonVisualization } from './hooks/useLessonVisualization';
import { useCodeSelection } from './hooks/useCodeSelection';

// 언어별 시각화
import { JSVisualizerView } from '@/features/visualizers/js';

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
      <button onClick={() => navigate(backPath)} className="btn-secondary px-4 py-2 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" />
        뒤로 가기
      </button>
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
    <div
      className="max-w-md mx-auto mt-12 rounded-2xl p-8 text-center"
      style={{
        background: 'linear-gradient(135deg, #F0FAF0 0%, #E8F5E8 100%)',
        border: '1px solid #B8D4B8',
        boxShadow: '0 8px 32px rgba(122, 154, 122, 0.15)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #7a9a7a 0%, #6a8a6a 100%)',
          boxShadow: '0 4px 16px rgba(122, 154, 122, 0.3)',
        }}
      >
        <CheckCircle2 className="w-10 h-10 text-white" />
      </div>
      <h2
        className="text-2xl font-bold mb-2"
        style={{ color: '#4a6a4a' }}
      >
        레슨 {lessonOrder} 완료!
      </h2>
      <p
        className="mb-6"
        style={{ color: '#6a8a6a' }}
      >
        {hasNext
          ? '다음 레슨으로 계속 학습하세요.'
          : '이 챕터의 모든 레슨을 완료했습니다!'}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate(chapterPath)}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #B8D4B8',
            color: '#5a7a5a',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          레슨 목록
        </button>
        {hasNext && (
          <button
            onClick={() => navigate(nextLessonPath)}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #7a9a7a 0%, #6a8a6a 100%)',
              border: 'none',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(122, 154, 122, 0.3)',
            }}
          >
            다음 레슨
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
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
  // quiz.answer는 정답 인덱스를 나타내는 문자열 (예: "2")
  const correctIndex = parseInt(quiz.answer, 10);
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
          <button
            onClick={handleSubmit}
            disabled={selected === null}
            className={`btn-primary px-4 py-2 ${selected === null ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            제출
          </button>
        ) : (
          <button onClick={handleContinue} className="btn-success px-4 py-2">
            {isCorrect ? '완료' : '다시 학습하기'}
          </button>
        )}
      </div>
    </div>
  );
}

export function LessonPage() {
  const { lang, lessonId } = useParams<{
    lang: string;
    chapterId: string; // URL 구조에는 필요하지만 로직에서는 미사용
    lessonId: string;
  }>();

  // 상태
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'memory' | 'chat'>('memory');

  // 데이터 로드
  useEffect(() => {
    if (!lessonId) return;

    const currentLessonId = lessonId; // TypeScript narrowing을 위한 캡처
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 레슨 상세 먼저 가져오기
        const lessonData = await getLessonFull(currentLessonId);

        if (cancelled) return;
        setLesson(lessonData);

        // 챕터 정보 가져오기 (다음 레슨 찾기용)
        const chapterData = await getChapterWithLessons(lessonData.chapterId);

        if (cancelled) return;

        // 다음 레슨 찾기
        const currentIdx = chapterData.lessons.findIndex((l) => l.id === currentLessonId);
        if (currentIdx < chapterData.lessons.length - 1) {
          setNextLessonId(chapterData.lessons[currentIdx + 1].id);
        } else {
          setNextLessonId(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // Steps 추출
  const steps: LessonStep[] = lesson?.content?.steps || [];
  const code = lesson?.content?.code || '';
  const quiz = lesson?.quizzes?.[0];

  // Hooks
  const navigation = useLessonNavigation({
    totalSteps: steps.length,
    lessonId: lessonId, // 레슨 변경 시 상태 초기화
    onComplete: () => {
      // TODO: API로 진행 상태 저장
    },
  });

  const {
    memoryState,
    changedBlocks,
    visualizationType,
    visualizationState,
  } = useLessonVisualization(steps, navigation.currentStepIndex);
  const { selection, setSelection, clearSelection } = useCodeSelection();

  // 현재 스텝
  const currentStep = steps[navigation.currentStepIndex];

  // 경로
  const languageCoursePath = `/courses/${lang}`;
  const nextLessonPath = nextLessonId && lesson ? `/courses/${lang}/${lesson.chapterId}/${nextLessonId}` : null;

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
    return <NotFoundView message={error || '레슨을 찾을 수 없습니다'} backPath={languageCoursePath} />;
  }

  // 콘텐츠 없음
  if (steps.length === 0) {
    return <NotFoundView message="레슨 콘텐츠가 없습니다" backPath={languageCoursePath} />;
  }

  return (
    <div className="py-4 px-4 lesson-page-container">
      {/* 헤더 - 일반 스크롤 */}
      <div className="flex items-center gap-4 mb-4">
        <Link to={languageCoursePath} className="cyber-back-btn">
          <span className="cyber-back-arrow">‹</span>
          <span>EXIT</span>
        </Link>
        <div className="cyber-divider" />
        <div>
          <h1 className="text-lg font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-xs text-gray-500">{lesson.description}</p>
          )}
        </div>
      </div>

      {/* Completed Phase */}
      {navigation.phase === 'completed' ? (
        <CompletedView
          lessonOrder={lesson.order}
          nextLessonPath={nextLessonPath}
          chapterPath={languageCoursePath}
        />
      ) : (
        <div className="flex gap-4 items-start">
          {/* 왼쪽: 코드 + 컨트롤 (55%) */}
          <div className="w-[55%] flex flex-col gap-4">
            {/* 코드 뷰어 카드 */}
            <div>
              {/* 코드 헤더 */}
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-t-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                  border: '1px solid #E5D5C7',
                  borderBottom: 'none',
                  color: '#e5e5e5',
                }}
              >
                <Code2 className="w-4 h-4 text-yellow-400" />
                코드
              </div>
              {/* 코드 뷰어 */}
              <div
                className="rounded-b-xl overflow-hidden"
                style={{
                  border: '1px solid #E5D5C7',
                  borderTop: 'none',
                }}
              >
                <CodeViewer
                  code={code}
                  highlightLine={currentStep?.line || 1}
                  onSelectionChange={setSelection}
                />
              </div>
            </div>

            {/* 스텝 컨트롤 */}
            <div>
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

          {/* 오른쪽: 탭 구조 (메모리+설명 | AI Chat) */}
          <div className="w-[45%]">
            {/* 탭 헤더 */}
            <div
              className="flex rounded-t-xl overflow-hidden"
              style={{ border: '1px solid #E5D5C7', borderBottom: 'none' }}
            >
              <button
                onClick={() => setActiveTab('memory')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all"
                style={{
                  background: activeTab === 'memory'
                    ? 'linear-gradient(135deg, #F0FAF0 0%, #E8F5E8 100%)'
                    : '#f8f4ef',
                  color: activeTab === 'memory' ? '#4a6a4a' : '#937b5d',
                  borderRight: '1px solid #E5D5C7',
                }}
              >
                <Cpu className="w-4 h-4" />
                {lang === 'javascript' ? '시각화 + 설명' : '메모리 + 설명'}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-all"
                style={{
                  background: activeTab === 'chat'
                    ? 'linear-gradient(135deg, #FFFBF5 0%, #FFF9F2 100%)'
                    : '#f8f4ef',
                  color: activeTab === 'chat' ? '#7c5e3c' : '#937b5d',
                }}
              >
                <Bot className="w-4 h-4" />
                AI 튜터
              </button>
            </div>

            {/* 탭 콘텐츠 - 자연스럽게 늘어남 */}
            <div
              className="rounded-b-xl"
              style={{
                border: '1px solid #E5D5C7',
                borderTop: 'none',
              }}
            >
              {/* 메모리/시각화 + 설명 탭 */}
              {activeTab === 'memory' && (
                <div>
                  {/* 언어별 시각화 */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #F0FAF0 0%, #E8F5E8 100%)',
                    }}
                  >
                    {/* C 언어: 메모리 시각화 */}
                    {(lang === 'c' || visualizationType === 'memory' || !visualizationType) && (
                      <CourseMemoryView
                        stack={memoryState.stack}
                        heap={memoryState.heap}
                        changedBlocks={changedBlocks}
                      />
                    )}

                    {/* JavaScript: 전용 시각화 (eventLoop, closure 등) */}
                    {lang === 'javascript' && visualizationType && visualizationType !== 'memory' && visualizationState && (
                      <JSVisualizerView
                        type={visualizationType}
                        state={visualizationState}
                      />
                    )}
                  </div>

                  {/* 현재 스텝 설명 */}
                  <div
                    className="p-4"
                    style={{
                      background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF5E8 100%)',
                      borderTop: '2px solid #E8D4C4',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #E8A87C 0%, #D4896A 100%)',
                          boxShadow: '0 2px 8px rgba(232, 168, 124, 0.3)',
                        }}
                      >
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xs font-bold mb-2 tracking-wide"
                          style={{ color: '#7c5e3c' }}
                        >
                          STEP {navigation.currentStepIndex + 1} 설명
                        </h3>
                        <div style={{ color: '#5a4a3a' }}>
                          <StepExplanation
                            explanation={currentStep?.explanation || ''}
                            stepIndex={navigation.currentStepIndex}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Chat 탭 - 최소 높이 설정 */}
              {activeTab === 'chat' && (
                <div
                  className="relative min-h-[500px]"
                  style={{
                    background: 'linear-gradient(135deg, #FFFBF5 0%, #FFF9F2 100%)',
                  }}
                >
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
              )}
            </div>
          </div>
        </div>
      )}

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
  );
}
