/**
 * LessonPage - 레슨 학습 페이지 (API 기반)
 *
 * DayPage의 API 버전. 기존 컴포넌트 99% 재사용.
 * Route: /courses/:lang/:chapterId/:lessonId
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, MessageSquare, Cpu, Bot, Code2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Sparkles, Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getLessonFull, getChapterWithLessons, updateProgress } from '@/services/courses';
import { simulatorService, isLanguageSupported } from '@/services/simulator';
import { useStore } from '@/stores/store';
import { useEnterKey } from '@/hooks/useEnterKey';
import type { LessonFull, LessonStep, Quiz, SupportedLanguage } from '@/types';

// 기존 컴포넌트 재사용
import { LessonCodeEditor } from './components/day/LessonCodeEditor';
import { StepExplanation } from './components/day/StepExplanation';
import { SelectedCodeBadge } from './components/day/SelectedCodeBadge';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { StepNavigationArrows } from './components/StepNavigationArrows';
import { ReturnOverlay } from '@/features/visualizers/shared';
import { ChatQA } from '@/features/chat';

// 새 hooks
import { useLessonNavigation } from './hooks/useLessonNavigation';
import { useLessonVisualization } from './hooks/useLessonVisualization';
import { useCodeSelection } from './hooks/useCodeSelection';
import { useLessonAnalytics } from './hooks/useLessonAnalytics';
import { useStepGestures } from './hooks/useStepGestures';
import { useFocusCycle } from '@/hooks/useFocusCycle';
import { useIsMobile } from '@/hooks';
import { useExplanationStore } from '@/features/playground/stores/explanationStore';

// 언어별 시각화
import { JSVisualizerView } from '@/features/visualizers/js';
import { LessonFlowVisualizer } from '@/features/visualizers/flow';
import { PyVisualizerView } from '@/features/visualizers/python';
import { JavaReferenceView } from '@/features/visualizers/java';

import type { PyName, PyObject } from '@/types/py-simulator';


// 모바일 컴포넌트
import { MobileAIChatFAB, MobileAIChatModal, MobileLessonView } from './components/mobile';

// Helper functions
function transformPyNames(names: any[] | undefined): PyName[] {
  if (!names) return [];
  return names.map((n) => ({
    name: n.name,
    scope: 'local' as const,
    pointsTo: n.pointsTo,
  }));
}

function transformPyObjects(objects: any[] | undefined): PyObject[] {
  if (!objects) return [];
  return objects.map((obj) => ({
    id: obj.id,
    type: obj.type as PyObject['type'],
    value: parseObjectValue(obj.type, obj.value),
    mutable: ['list', 'dict', 'set'].includes(obj.type),
    refCount: undefined,
  }));
}

function parseObjectValue(type: string, value: string | number): PyObject['value'] {
  if (typeof value === 'number') return value;
  switch (type) {
    case 'int': return parseInt(value, 10);
    case 'float': return parseFloat(value);
    case 'bool': return value === 'True' || value === 'true';
    case 'NoneType': return null;
    default: return value;
  }
}

// Top-level Component Definitions

function LoadingView() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  useFocusCycle({
    containerRef,
    enabled: true,
    keyBindings: { next: ['ArrowRight'], prev: ['ArrowLeft'] },
  });

  useEnterKey({
    onEnter: () => {
      const focusedElement = document.activeElement as HTMLElement;
      if (focusedElement && focusedElement.matches('button')) {
        focusedElement.click();
      }
    },
    enabled: true,
    targetRef: containerRef,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      containerRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="max-w-md mx-auto mt-12 rounded-2xl p-8 text-center outline-none"
      ref={containerRef}
      tabIndex={-1}
      style={{
        background: 'var(--theme-lesson-memory-bg)',
        border: '1px solid var(--theme-lesson-panel-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
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
      <h2 className="text-2xl font-bold mb-2 text-[var(--theme-dashboard-title)]">
        레슨 {lessonOrder} 완료!
      </h2>
      <p className="mb-6 text-[var(--theme-dashboard-text)]">
        {hasNext ? '다음 레슨으로 계속 학습하세요.' : '이 챕터의 모든 레슨을 완료했습니다!'}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate(chapterPath)}
          className="px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all bg-[var(--theme-lesson-button-secondary-bg)] border border-[var(--theme-lesson-button-secondary-border)] text-[var(--theme-lesson-button-secondary-text)]"
        >
          <ArrowLeft className="w-4 h-4" />
          레슨 목록
        </button>
        {hasNext && (
          <button
            onClick={() => navigate(nextLessonPath!)}
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

function QuizCardAdapter({
  quiz,
  onComplete,
}: {
  quiz: Quiz;
  onComplete: (isCorrect: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const quizContainerRef = useRef<HTMLDivElement>(null);

  const options = quiz.options || [];
  const correctIndex = parseInt(quiz.answer, 10);
  const isCorrect = selected === correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const handleContinue = () => {
    onComplete(isCorrect);
  };

  useEnterKey({
    onEnter: () => {
      if (!submitted && selected !== null) handleSubmit();
      else if (submitted) handleContinue();
    },
    enabled: (selected !== null && !submitted) || submitted,
    targetRef: quizContainerRef,
  });

  useFocusCycle({
    containerRef: quizContainerRef,
    enabled: !submitted,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      quizContainerRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4 outline-none" ref={quizContainerRef} tabIndex={-1}>
      <pre className="text-lg font-medium whitespace-pre-wrap font-sans">
        {quiz.question}
      </pre>
      <div className="space-y-2">
        {options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => !submitted && setSelected(idx)}
            disabled={submitted}
            className={`w-full p-3 text-left rounded-lg border-2 transition-colors whitespace-pre-wrap ${submitted
              ? idx === correctIndex
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : idx === selected
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-[var(--theme-dashboard-card-border)]'
              : selected === idx
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-[var(--theme-dashboard-card-border)] hover:border-[var(--theme-dashboard-progress-bg)]'
              }`}
          >
            {option}
          </button>
        ))}
      </div>
      {submitted && quiz.explanation && (
        <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-yellow-50'}`}>
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
    chapterId: string;
    lessonId: string;
  }>();

  const { setPageTitle } = useStore();
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [liveSteps, setLiveSteps] = useState<LessonStep[] | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'flow' | 'memory' | 'chat'>(
    (lang === 'python' || lang === 'py' || lang === 'javascript' || lang === 'js') ? 'memory' : 'flow'
  );
  const isMobile = useIsMobile();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [flashFlow, setFlashFlow] = useState(false);
  const [flashMemory, setFlashMemory] = useState(false);
  const prevStepIndexRef = useRef(0);
  const [isExplanationCollapsed, setIsExplanationCollapsed] = useState(false);
  const { startPrefetch, stopPrefetch } = useExplanationStore();

  useEffect(() => {
    if (!lessonId) return;
    let cancelled = false;
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const lessonData = await getLessonFull(lessonId);
        if (cancelled) return;
        setLesson(lessonData);
        const chapterData = await getChapterWithLessons(lessonData.chapterId);
        if (cancelled) return;
        const currentIdx = chapterData.lessons.findIndex((l) => l.id === lessonId);
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
  }, [lessonId, lang]);

  useEffect(() => {
    if (lesson) {
      setPageTitle(lesson.title, lesson.description, lang as SupportedLanguage);
    }
    return () => {
      setPageTitle('', '');
    };
  }, [lesson, setPageTitle, lang]);

  // Live simulation for all supported languages
  useEffect(() => {
    if (lesson && lang && isLanguageSupported(lang) && lesson.content?.code) {
      const runSimulation = async () => {
        setSimulating(true);
        try {
          const result = await simulatorService.simulate(lang, { code: lesson.content.code });
          if (result.success) {
            setLiveSteps(result.steps);
            // AI 설명 생성 시작 (Playground와 동일한 로직)
            startPrefetch(result.steps, lesson.content.code);
          } else {
            console.error("Simulation failed:", result.error);
            setError(result.error || 'Failed to simulate code.');
          }
        } catch (e) {
          console.error("Simulation exception:", e);
          setError(e instanceof Error ? e.message : 'An unknown error occurred during simulation.');
        } finally {
          setSimulating(false);
        }
      };
      runSimulation();
    } else if (lesson) {
      // Fallback for non-supported languages or lessons without code
      setLiveSteps(lesson.content?.steps || []);
    }

    // Cleanup
    return () => {
      stopPrefetch();
    };
  }, [lesson, lang, startPrefetch, stopPrefetch]);

  const steps: LessonStep[] = useMemo(() => {
    return liveSteps || [];
  }, [liveSteps]);

  const code = lesson?.content?.code || '';
  const quiz = lesson?.quizzes?.[0];
  const analyticsRef = useRef<{ finishTracking: () => void }>({ finishTracking: () => { } });

  const navigation = useLessonNavigation({
    totalSteps: steps.length,
    lessonId: lessonId,
    onComplete: async () => {
      if (!lessonId) return;
      try {
        await updateProgress({ lessonId, status: 'completed' });
      } catch (err) {
        console.error('[Progress] Failed to save:', err);
      }
      analyticsRef.current.finishTracking();
    },
  });

  const analytics = useLessonAnalytics({
    lessonId,
    totalSteps: steps.length,
    currentStepIndex: navigation.currentStepIndex,
  });

  useEffect(() => {
    analyticsRef.current = { finishTracking: analytics.finishTracking };
  }, [analytics.finishTracking]);

  const { memoryState, changedBlocks, visualizationType, visualizationState } = useLessonVisualization(
    steps,
    navigation.currentStepIndex
  );
  const { selection, setSelection, clearSelection } = useCodeSelection();

  useStepGestures({
    onPrev: navigation.goToPrevStep,
    onNext: navigation.isLastStep ? navigation.goToQuiz : navigation.goToNextStep,
    enabled: navigation.phase === 'learning' && !isMobile,
    isModalOpen: navigation.phase === 'quiz',
    canGoPrev: navigation.canGoPrev,
    canGoNext: true,
  });

  const currentStep = steps[navigation.currentStepIndex];

  useEffect(() => {
    const prevIndex = prevStepIndexRef.current;
    const isForward = navigation.currentStepIndex > prevIndex;
    prevStepIndexRef.current = navigation.currentStepIndex;
    if (!isForward || navigation.currentStepIndex === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setFlashFlow(true);
    timers.push(setTimeout(() => setFlashFlow(false), 600));
    const hasMemoryChange = currentStep?.memoryChanges && (Array.isArray(currentStep.memoryChanges) ? currentStep.memoryChanges.length > 0 : true);
    if (hasMemoryChange) {
      setFlashMemory(true);
      timers.push(setTimeout(() => setFlashMemory(false), 600));
    }
    return () => timers.forEach(clearTimeout);
  }, [navigation.currentStepIndex, currentStep]);

  const languageCoursePath = `/courses/${lang}`;
  const nextLessonPath = nextLessonId && lesson ? `/courses/${lang}/${lesson.chapterId}/${nextLessonId}` : null;

  const handleQuizComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      navigation.completeLesson();
    } else {
      navigation.reset();
    }
  };

  if (loading || simulating) return <LoadingView />;
  if (error || !lesson) return <NotFoundView message={error || '레슨을 찾을 수 없습니다'} backPath={languageCoursePath} />;
  if (steps.length === 0) return <NotFoundView message="레슨 콘텐츠가 없습니다" backPath={languageCoursePath} />;

  return (
    <div className="lesson-page-container">
      {navigation.phase === 'completed' ? (
        <CompletedView
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
              showRegisters={lesson?.content?.showRegisters}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 items-start pb-16">
          {/* Left Panel */}
          <div className="w-full md:w-1/2 flex flex-col rounded-xl"
            style={{
              border: '1px solid var(--theme-lesson-panel-border)',
              minHeight: '400px',
              overflow: 'visible',
            }}
          >
            <div
              className="flex items-center px-3 py-1 text-xs font-medium shrink-0"
              style={{
                background: 'var(--theme-lesson-editor-header-bg)',
                color: 'var(--theme-lesson-editor-header-text)',
                borderBottom: '1px solid var(--theme-lesson-panel-border)',
              }}
            >
              <Code2 className="w-3 h-3 mr-1.5" />
              에디터
            </div>
            <div
              className={(code.split('\n').length > 10 && !isExplanationCollapsed) ? 'overflow-y-auto' : ''}
              style={{
                height: `${(isExplanationCollapsed ? code.split('\n').length : Math.min(code.split('\n').length, 10)) * 20}px`,
                borderBottom: '1px solid var(--theme-lesson-panel-border)',
              }}
            >
              <LessonCodeEditor
                code={code}
                highlightLine={currentStep?.line || 1}
                onSelectionChange={setSelection}
              />
            </div>
            {currentStep && (
              <div
                className={`relative ${isExplanationCollapsed ? 'shrink-0' : ''}`}
                style={{
                  background: 'var(--theme-lesson-explanation-bg)',
                  borderTop: '1px solid var(--theme-lesson-panel-border)',
                  minHeight: isExplanationCollapsed ? 'auto' : '200px',
                }}
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{
                      background: 'var(--theme-lesson-explanation-line-badge-bg)',
                      color: '#fff',
                    }}
                  >
                    L{currentStep.line}
                  </span>
                  {(code.split('\n').length > 6) && (
                    <button
                      onClick={() => setIsExplanationCollapsed(!isExplanationCollapsed)}
                      className="p-1 rounded-md bg-transparent hover:bg-amber-200/50 transition-colors"
                      title={isExplanationCollapsed ? '설명 펼치기' : '설명 접기'}
                    >
                      {isExplanationCollapsed ? (
                        <ChevronUp className="w-4 h-4 text-amber-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-amber-700" />
                      )}
                    </button>
                  )}
                </div>
                {isExplanationCollapsed ? (
                  <div className="p-2 text-xs text-amber-700 cursor-pointer" onClick={() => setIsExplanationCollapsed(false)}>
                    클릭하여 설명 보기
                  </div>
                ) : (
                  <div className="p-4 pr-20">
                    <StepExplanation
                      explanation={currentStep.explanation}
                      stepIndex={navigation.currentStepIndex}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div
            className="w-full md:w-1/2 flex flex-col rounded-xl md:sticky md:top-4 z-10"
            style={{
              border: '1px solid var(--theme-lesson-panel-border)',
            }}
          >
            <div
              className="flex shrink-0"
              style={{ borderBottom: '1px solid var(--theme-lesson-panel-border)', height: '40px' }}
            >
              {(lang !== 'python' && lang !== 'py' && lang !== 'javascript' && lang !== 'js') && (
                <button
                  onClick={() => setActiveTab('flow')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold"
                  style={{
                    background: activeTab === 'flow' ? 'var(--theme-lesson-tab-active-bg)' : 'var(--theme-lesson-tab-inactive-bg)',
                    color: activeTab === 'flow' ? 'var(--theme-lesson-tab-active-text)' : 'var(--theme-lesson-tab-inactive-text)',
                    borderRight: '1px solid var(--theme-lesson-panel-border)',
                  }}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Flow</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('memory')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold"
                style={{
                  background: activeTab === 'memory' ? 'var(--theme-lesson-tab-active-bg)' : 'var(--theme-lesson-tab-inactive-bg)',
                  color: activeTab === 'memory' ? 'var(--theme-lesson-tab-active-text)' : 'var(--theme-lesson-tab-inactive-text)',
                  borderRight: '1px solid var(--theme-lesson-panel-border)',
                }}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>
                  {(lang === 'javascript' || lang === 'js' || lang === 'python' || lang === 'py') ? '시각화' : '메모리'}
                </span>
              </button>
              {!isMobile && (
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: activeTab === 'chat' ? 'var(--theme-lesson-tab-active-bg)' : 'var(--theme-lesson-tab-inactive-bg)',
                    color: activeTab === 'chat' ? 'var(--theme-lesson-tab-active-text)' : 'var(--theme-lesson-tab-inactive-text)',
                  }}
                >
                  <Bot className="w-3.5 h-3.5" />
                  AI 튜터
                </button>
              )}
            </div>
            <div
              className="flex-1 overflow-y-auto"
              style={{
                background: 'var(--theme-lesson-memory-bg)',
                minHeight: '400px',
              }}
            >
              {activeTab === 'flow' && (
                <div className="p-4">
                  {lang === 'java' ? (
                    <JavaReferenceView
                      stack={visualizationState?.stack}
                      heap={visualizationState?.heap}
                    />
                  ) : currentStep ? (
                    <LessonFlowVisualizer
                      step={currentStep}
                      prevStep={navigation.currentStepIndex > 0 ? steps[navigation.currentStepIndex - 1] : null}
                      language={lang || 'c'}
                      fullCode={code}
                      memoryState={memoryState ? {
                        stack: memoryState.stack.map(s => ({ ...s, name: s.name || '?' })),
                        heap: memoryState.heap.map(h => ({ ...h, name: h.name || '?' }))
                      } : undefined}
                      stdout={currentStep.stdout}
                    />
                  ) : null}
                </div>
              )}
              {activeTab === 'memory' && (
                <div className="p-4">
                  {(lang === 'python' || lang === 'py') && visualizationType === 'python' ? (
                    <PyVisualizerView
                      names={transformPyNames((visualizationState as any)?.names)}
                      objects={transformPyObjects((visualizationState as any)?.objects)}
                      animate={true}
                      compact={false}
                    />
                  ) : (lang === 'javascript' || lang === 'js') && visualizationType === 'javascript' ? (
                    <JSVisualizerView
                      type={visualizationType as any}
                      state={visualizationState}
                    />
                  ) : (
                    memoryState ? (
                      <MemoryPanel
                        stack={memoryState.stack}
                        heap={memoryState.heap}
                        changedBlocks={changedBlocks}
                        showRegisters={lesson?.content?.showRegisters}
                        frames={memoryState.frames}
                      />
                    ) : null
                  )}
                </div>
              )}
              {activeTab === 'chat' && !isMobile && (
                <div className="h-full">
                  <ChatQA
                    lessonId={lessonId}
                    context={{
                      courseDay: lesson.order,
                      topic: lesson.title,
                      code: code,
                      currentLine: currentStep?.line || 1
                    }}
                    contextType="lesson"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar (데스크톱 전용) */}
      {navigation.phase !== 'completed' && !isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center py-4"
          style={{
            background: 'var(--theme-lesson-memory-bg)',
            borderTop: '1px solid var(--theme-lesson-panel-border)',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* 진행률 표시 */}
            <div className="text-sm font-medium text-[var(--theme-dashboard-text)]">
              <span className="text-[var(--theme-dashboard-title)]">{navigation.currentStepIndex + 1}</span>
              {' / '}
              {steps.length}
            </div>

            {/* 화살표 버튼 */}
            <StepNavigationArrows
              onPrev={navigation.goToPrevStep}
              onNext={navigation.isLastStep ? navigation.goToQuiz : navigation.goToNextStep}
              canGoPrev={navigation.canGoPrev}
              canGoNext={true}
              nextLabel={navigation.isLastStep ? '퀴즈' : '다음'}
              size="md"
              variant="inline"
            />
          </div>
        </div>
      )}

      {/* Bottom Nav Bar (모바일 전용) */}
      {navigation.phase !== 'completed' && isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[var(--theme-lesson-memory-bg)] border-t border-[var(--theme-lesson-panel-border)] shadow-lg">
          <StepNavigationArrows
            onPrev={navigation.goToPrevStep}
            onNext={navigation.isLastStep ? navigation.goToQuiz : navigation.goToNextStep}
            canGoPrev={navigation.canGoPrev}
            canGoNext={true}
            nextLabel={navigation.isLastStep ? '퀴즈' : '다음'}
            variant="mobile"
          />
        </div>
      )}

      {quiz && (
        <Dialog
          open={navigation.phase === 'quiz'}
          onOpenChange={(open) => !open && navigation.reset()}
        >
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">🧠 퀴즈</DialogTitle>
              <DialogDescription className="sr-only">
                레슨 내용을 확인하는 퀴즈 세션입니다.
              </DialogDescription>
            </DialogHeader>
            <QuizCardAdapter quiz={quiz} onComplete={handleQuizComplete} />
          </DialogContent>
        </Dialog>
      )}

      {isMobile && navigation.phase !== 'completed' && (
        <>
          <MobileAIChatFAB isOpen={isAIChatOpen} onClick={() => setIsAIChatOpen(!isAIChatOpen)} />
          <MobileAIChatModal
            isOpen={isAIChatOpen}
            onClose={() => setIsAIChatOpen(false)}
            context={{
              courseDay: lesson?.order,
              topic: lesson?.title,
              code: code,
              currentLine: currentStep?.line,
            }}
            lessonId={lessonId}
          />
        </>
      )}
    </div>
  );
}