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
} from '@/components/ui/dialog';
import { getLessonFull, getChapterWithLessons, updateProgress } from '@/services/courses';
import { useStore } from '@/stores/store';
// TODO: 다른 서버에서 파일 가져온 후 주석 해제
// import { useEnterKey } from '@/hooks';
// import { simulatorService } from '@/services/simulator';
// import { useLessonHistoryStore } from '@/stores/lessonHistoryStore';
import type { LessonFull, LessonStep, Quiz, SupportedLanguage } from '@/types';

// 기존 컴포넌트 재사용
import { LessonCodeEditor } from './components/day/LessonCodeEditor';
import { StepExplanation } from './components/day/StepExplanation';
import { SelectedCodeBadge } from './components/day/SelectedCodeBadge';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { ReturnOverlay } from '@/features/visualizers/shared';
import { ChatQA } from '@/features/chat';

// 새 hooks
import { useLessonNavigation } from './hooks/useLessonNavigation';
import { useLessonVisualization } from './hooks/useLessonVisualization';
import { useCodeSelection } from './hooks/useCodeSelection';
import { useLessonAnalytics } from './hooks/useLessonAnalytics';
import { useStepGestures } from './hooks/useStepGestures';
import { useIsMobile } from '@/hooks';

// 언어별 시각화
import { JSVisualizerView } from '@/features/visualizers/js';
import { LessonFlowVisualizer } from '@/features/visualizers/flow';
// TODO: 다른 서버에서 파일 가져온 후 주석 해제
// import { PyVisualizerView } from '@/features/visualizers/python';

import type { PyName, PyObject } from '@/types/py-simulator';

// 모바일 컴포넌트
import { MobileAIChatFAB, MobileAIChatModal, MobileLessonView } from './components/mobile';

// Python 레슨 데이터 → PyVisualizerView 변환
interface LessonPyName {
  name: string;
  pointsTo: string;
}

interface LessonPyObject {
  id: string;
  type: string;
  value: string;
  pyId?: string;
  highlight?: boolean;
}

function transformPyNames(names: LessonPyName[] | undefined): PyName[] {
  if (!names) return [];
  return names.map((n) => ({
    name: n.name,
    scope: 'local' as const,
    pointsTo: n.pointsTo,
  }));
}

function transformPyObjects(objects: LessonPyObject[] | undefined): PyObject[] {
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
  // 이미 숫자인 경우 그대로 반환
  if (typeof value === 'number') return value;

  switch (type) {
    case 'int':
      return parseInt(value, 10);
    case 'float':
      return parseFloat(value);
    case 'bool':
      return value === 'True' || value === 'true';
    case 'NoneType':
      return null;
    case 'str':
      return value;
    case 'list':
    case 'tuple':
      // "[1, 2, 3]" 형태 → 요소 ID 배열로 변환 (간단한 파싱)
      return [];
    default:
      return value;
  }
}

/**
 * memoryChanges (stack/heap) → pythonMemoryState (names/objects) 변환
 * seed 데이터가 C 스타일 형식을 사용하므로 Python 시각화를 위해 변환 필요
 */
interface StackFrame {
  name: string;
  variables: Array<{
    name: string;
    type: string;
    value: string | number;
    ref?: string;
    highlight?: boolean;
  }>;
}

interface HeapObject {
  id: string;
  type: string;
  value?: string | number;
  fields?: Record<string, unknown>;
  highlight?: boolean;
}

interface MemoryChanges {
  stack?: StackFrame[];
  heap?: HeapObject[];
}

function convertMemoryChangesToPyState(
  memoryChanges: MemoryChanges | undefined
): { names: LessonPyName[]; objects: LessonPyObject[] } | null {
  if (!memoryChanges) return null;

  const names: LessonPyName[] = [];
  const objects: LessonPyObject[] = [];

  // stack frames에서 names 추출
  if (memoryChanges.stack) {
    for (const frame of memoryChanges.stack) {
      for (const variable of frame.variables) {
        if (variable.ref) {
          names.push({
            name: variable.name,
            pointsTo: variable.ref,
          });
        }
      }
    }
  }

  // heap에서 objects 추출
  if (memoryChanges.heap) {
    for (const heapObj of memoryChanges.heap) {
      let valueStr = '';
      if (heapObj.value !== undefined) {
        valueStr = String(heapObj.value);
      } else if (heapObj.fields) {
        // list/dict의 경우 fields를 문자열로 변환
        const vals = Object.values(heapObj.fields);
        valueStr = `[${vals.join(', ')}]`;
      }

      objects.push({
        id: heapObj.id,
        type: heapObj.type,
        value: valueStr,
        highlight: heapObj.highlight,
      });
    }
  }

  return names.length > 0 || objects.length > 0 ? { names, objects } : null;
}

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

  // TODO: Enter 키로 제출/계속하기 (다른 서버에서 파일 가져온 후 주석 해제)
  // useEnterKey({
  //   onEnter: () => {
  //     if (!submitted && selected !== null) {
  //       handleSubmit();
  //     } else if (submitted) {
  //       handleContinue();
  //     }
  //   },
  //   enabled: (selected !== null && !submitted) || submitted,
  // });

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

  // Store
  const { setPageTitle } = useStore();

  // 상태
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'flow' | 'memory' | 'chat'>('flow');
  const isMobile = useIsMobile();
  // 모바일 AI Chat 상태
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  // 탭 반짝임 효과
  const [flashFlow, setFlashFlow] = useState(false);
  const [flashMemory, setFlashMemory] = useState(false);
  const prevStepIndexRef = useRef(0);
  // 설명 패널 접기 상태
  const [isExplanationCollapsed, setIsExplanationCollapsed] = useState(false);

  // TODO: 다른 서버에서 파일 가져온 후 주석 해제
  // Lesson 히스토리 저장 (최근 학습 기능용)
  // const addLessonHistory = useLessonHistoryStore((s) => s.addEntry);

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
  }, [lessonId, lang]);

  // 페이지 제목 설정
  useEffect(() => {
    if (lesson) {
      setPageTitle(lesson.title, lesson.description);
    }
  }, [lesson, setPageTitle]);

  // TODO: 다른 서버에서 파일 가져온 후 주석 해제
  // Lesson 히스토리에 저장 (최근 학습, 이어서 학습 기능용)
  // useEffect(() => {
  //   if (!lesson || !lesson.content?.code || !lang) return;

  //   // 지원 언어만 저장
  //   const supportedLangs = ['c', 'python', 'java'];
  //   if (!supportedLangs.includes(lang)) return;

  //   addLessonHistory({
  //     lessonId: lesson.id,
  //     chapterId: lesson.chapterId,
  //     title: lesson.title,
  //     code: lesson.content.code,
  //     language: lang as SupportedLanguage,
  //   });

  //   if (import.meta.env.DEV) {
  //     console.log('[LessonPage] Saved to history:', lesson.title);
  //   }
  // }, [lesson, lang, addLessonHistory]);

  // Steps 추출
  const steps: LessonStep[] = lesson?.content?.steps || [];
  const code = lesson?.content?.code || '';
  const quiz = lesson?.quizzes?.[0];

  // Analytics ref (순환 의존성 해결: navigation.onComplete → analytics.finishTracking)
  const analyticsRef = useRef<{ finishTracking: () => void }>({ finishTracking: () => {} });

  // Navigation Hook (먼저 호출해야 currentStepIndex를 analytics에 전달 가능)
  const navigation = useLessonNavigation({
    totalSteps: steps.length,
    lessonId: lessonId, // 레슨 변경 시 상태 초기화
    onComplete: async () => {
      // 1. 레슨 완료 시 Progress 저장
      console.log('[Progress] onComplete called, lessonId:', lessonId);
      if (!lessonId) return;
      try {
        console.log('[Progress] Calling updateProgress...');
        const result = await updateProgress({
          lessonId,
          status: 'completed',
        });
        console.log('[Progress] Saved successfully:', result);
      } catch (err) {
        // 저장 실패해도 UX는 계속 진행 (로그만 남김)
        console.error('[Progress] Failed to save:', err);
      }

      // 2. Analytics 데이터 저장 (ref를 통해 호출)
      analyticsRef.current.finishTracking();
    },
  });

  // Analytics Hook (학습 분석 데이터 수집) - navigation.currentStepIndex 사용
  const analytics = useLessonAnalytics({
    lessonId,
    totalSteps: steps.length,
    currentStepIndex: navigation.currentStepIndex,
  });

  // analyticsRef 업데이트 (onComplete에서 사용)
  useEffect(() => {
    analyticsRef.current = { finishTracking: analytics.finishTracking };
  }, [analytics.finishTracking]);

  const {
    memoryState,
    changedBlocks,
    visualizationType,
    visualizationState,
  } = useLessonVisualization(steps, navigation.currentStepIndex);
  const { selection, setSelection, clearSelection } = useCodeSelection();

  // 스텝 제스처 (키보드 ← →, 탭/클릭)
  const { handleTapArea } = useStepGestures({
    onPrev: navigation.goToPrevStep,
    onNext: navigation.isLastStep ? navigation.goToQuiz : navigation.goToNextStep,
    enabled: navigation.phase === 'learning' && !isMobile,
    isModalOpen: navigation.phase === 'quiz',
    canGoPrev: navigation.canGoPrev,
    canGoNext: true, // 마지막 스텝에서도 퀴즈로 이동 가능
  });

  // 현재 스텝
  const currentStep = steps[navigation.currentStepIndex];

  // 스텝 변경 시 탭 반짝임 효과 (앞으로 갈 때만)
  useEffect(() => {
    const prevIndex = prevStepIndexRef.current;
    const isForward = navigation.currentStepIndex > prevIndex;
    prevStepIndexRef.current = navigation.currentStepIndex;

    // 뒤로 가거나 첫 스텝이면 무시
    if (!isForward || navigation.currentStepIndex === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Flow 탭 반짝임 (항상)
    setFlashFlow(true);
    timers.push(setTimeout(() => setFlashFlow(false), 600));

    // 메모리 변경이 있으면 메모리 탭도 반짝임
    const hasMemoryChange = currentStep?.memoryChanges &&
      (Array.isArray(currentStep.memoryChanges) ? currentStep.memoryChanges.length > 0 : true);
    if (hasMemoryChange) {
      setFlashMemory(true);
      timers.push(setTimeout(() => setFlashMemory(false), 600));
    }

    return () => timers.forEach(clearTimeout);
  }, [navigation.currentStepIndex, currentStep]);

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
    <div className="lesson-page-container">
      {/* Completed Phase */}
      {navigation.phase === 'completed' ? (
        <>
          <CompletedView
            lessonOrder={lesson.order}
            nextLessonPath={nextLessonPath}
            chapterPath={languageCoursePath}
          />
        </>
      ) : isMobile ? (
        /* ===== 모바일 통합 레이아웃 (모든 언어 동일) ===== */
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* 모바일 레슨 뷰 (모든 언어 공통) - 스텝 컨트롤 내장 */}
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
              memoryState={memoryState}
              showRegisters={lesson?.content?.showRegisters}
            />
          </div>
        </div>
      ) : (
        /* ===== 데스크톱 레이아웃 (모든 언어 동일) ===== */
        <div className="flex flex-col md:flex-row gap-4 items-start pb-16">
          {/* 왼쪽: 코드 + 설명 (모바일: 100%, 데스크톱: 50%) */}
          {(() => {
            // 코드 줄 수 계산
            const lineCount = code.split('\n').length;
            const LINE_HEIGHT = 20; // Monaco Editor 기본 줄 높이
            const MAX_VISIBLE_LINES = 10;
            // 설명창 접혔을 때: 모든 줄 표시, 펼쳤을 때: 10줄 제한
            const visibleLines = isExplanationCollapsed
              ? lineCount  // 모든 줄 보여주기
              : Math.min(lineCount, MAX_VISIBLE_LINES);
            const codeEditorHeight = visibleLines * LINE_HEIGHT;
            const hasScroll = !isExplanationCollapsed && lineCount > MAX_VISIBLE_LINES;
            // 7줄 이상일 때만 접기 버튼 표시 (빈 공간 방지)
            const canCollapse = lineCount > 6;

            return (
              <div className="w-full md:w-1/2 flex flex-col rounded-xl"
                style={{
                  border: '1px solid var(--theme-lesson-panel-border)',
                  minHeight: '400px',
                  overflow: 'visible', // sticky 동작을 위해 hidden 제거
                }}
              >
                {/* 에디터 미니 헤더 */}
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

                {/* 코드 에디터 (설명창 접힘 상태에 따라 높이 조절) */}
                <div
                  className={hasScroll ? 'overflow-y-auto' : ''}
                  style={{
                    height: `${codeEditorHeight}px`,
                    borderBottom: '1px solid var(--theme-lesson-panel-border)',
                  }}
                >
                  <LessonCodeEditor
                    code={code}
                    highlightLine={currentStep?.line || 1}
                    onSelectionChange={setSelection}
                  />
                </div>

                {/* 설명 패널 (접혔을 때: 최소화, 펼쳤을 때: 내용에 따라 늘어남) */}
                {currentStep && (
                  <div
                    className={`relative ${isExplanationCollapsed ? 'shrink-0' : ''}`}
                    style={{
                      background: 'var(--theme-lesson-explanation-bg)',
                      borderTop: '1px solid var(--theme-lesson-panel-border)',
                      minHeight: isExplanationCollapsed ? 'auto' : '200px',
                    }}
                  >
                    {/* Line 뱃지 + 접기 버튼 */}
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
                      {canCollapse && (
                        <button
                          onClick={() => setIsExplanationCollapsed(!isExplanationCollapsed)}
                          className="p-1 rounded-md hover:bg-amber-200/50 transition-colors"
                          style={{ background: 'rgba(255,255,255,0.8)' }}
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
                    {/* 설명 내용 */}
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
            );
          })()}

          {/* 오른쪽: 3탭 구조 (Flow | Memory | AI Chat) - 컨텐츠에 따라 늘어남 */}
          <div
            className="w-full md:w-1/2 flex flex-col rounded-xl md:sticky md:top-4 z-10"
            style={{
              border: '1px solid var(--theme-lesson-panel-border)',
            }}
          >
            {/* 탭 헤더 - 3탭 */}
            <div
              className="flex shrink-0"
              style={{ borderBottom: '1px solid var(--theme-lesson-panel-border)', height: '40px' }}
            >
              {/* Flow 탭 (첫 번째) */}
              <button
                onClick={() => setActiveTab('flow')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold"
                style={{
                  background: activeTab === 'flow'
                    ? 'var(--theme-lesson-tab-active-bg)'
                    : flashFlow
                      ? 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)'
                      : 'var(--theme-lesson-tab-inactive-bg)',
                  color: activeTab === 'flow' ? 'var(--theme-lesson-tab-active-text)' : flashFlow ? '#2563eb' : 'var(--theme-lesson-tab-inactive-text)',
                  borderRight: '1px solid var(--theme-lesson-panel-border)',
                  animation: flashFlow ? 'tabGlow 0.6s ease-out' : 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <Play className="w-3.5 h-3.5" style={{
                  animation: flashFlow ? 'iconPop 0.4s ease-out' : 'none'
                }} />
                <span style={{
                  animation: flashFlow ? 'textPop 0.4s ease-out 0.1s both' : 'none'
                }}>
                  Flow
                </span>
              </button>

              {/* 메모리 탭 */}
              <button
                onClick={() => setActiveTab('memory')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold"
                style={{
                  background: activeTab === 'memory'
                    ? 'var(--theme-lesson-tab-active-bg)'
                    : flashMemory
                      ? 'linear-gradient(180deg, #d1fae5 0%, #ecfdf5 100%)'
                      : 'var(--theme-lesson-tab-inactive-bg)',
                  color: activeTab === 'memory' ? 'var(--theme-lesson-tab-active-text)' : flashMemory ? '#059669' : 'var(--theme-lesson-tab-inactive-text)',
                  borderRight: '1px solid var(--theme-lesson-panel-border)',
                  animation: flashMemory ? 'tabGlow 0.6s ease-out' : 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <Cpu className="w-3.5 h-3.5" style={{
                  animation: flashMemory ? 'iconPop 0.4s ease-out' : 'none'
                }} />
                <span style={{
                  animation: flashMemory ? 'textPop 0.4s ease-out 0.1s both' : 'none'
                }}>
                  {lang === 'javascript' ? '시각화' : '메모리'}
                </span>
              </button>

              {/* AI Chat 탭 (모바일에서 숨김) */}
              {!isMobile && (
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: activeTab === 'chat'
                      ? 'var(--theme-lesson-tab-active-bg)'
                      : 'var(--theme-lesson-tab-inactive-bg)',
                    color: activeTab === 'chat' ? 'var(--theme-lesson-tab-active-text)' : 'var(--theme-lesson-tab-inactive-text)',
                  }}
                >
                  <Bot className="w-3.5 h-3.5" />
                  AI 튜터
                </button>
              )}
            </div>

            {/* 탭 콘텐츠 - 컨텐츠에 따라 늘어남 */}
            <div>
              {/* Flow 탭 - 애니메이션 시각화 */}
              {activeTab === 'flow' && (
                <div
                  className="p-4 relative"
                  style={{
                    background: 'var(--theme-lesson-flow-bg)',
                  }}
                >
                  <LessonFlowVisualizer
                    step={currentStep as LessonStep}
                    prevStep={navigation.currentStepIndex > 0 ? steps[navigation.currentStepIndex - 1] as LessonStep : null}
                    language={lang as 'c' | 'python' | 'java'}
                    fullCode={code}
                    theme="light"
                    memoryState={memoryState}
                    stdout={currentStep?.stdout}
                  />
                </div>
              )}

              {/* 메모리/시각화 탭 */}
              {activeTab === 'memory' && (
                <div
                  className="p-2 relative"
                  style={{
                    background: 'var(--theme-lesson-memory-bg)',
                  }}
                >
                  {/* C 언어: 메모리 시각화 */}
                  {(lang === 'c' || visualizationType === 'memory' || !visualizationType) && (
                    <>
                      <MemoryPanel
                        stack={memoryState.stack}
                        heap={memoryState.heap}
                        changedBlocks={changedBlocks}
                        showRegisters={lesson?.content?.showRegisters}
                        frames={memoryState.frames}
                      />
                      {/* Return 오버레이 (return 문 실행 시) */}
                      {currentStep?.isReturn && (
                        <ReturnOverlay
                          isReturn={true}
                          returnInfo={currentStep.returnInfo}
                          theme="light"
                        />
                      )}
                    </>
                  )}

                  {/* JavaScript: 전용 시각화 (eventLoop, closure 등) */}
                  {lang === 'javascript' && visualizationType && visualizationType !== 'memory' && visualizationState && (
                    <JSVisualizerView
                      type={visualizationType}
                      state={visualizationState}
                    />
                  )}

                  {/* TODO: 다른 서버에서 파일 가져온 후 주석 해제 */}
                  {/* Python: 참조 모델 시각화 */}
                  {/* {lang === 'python' && (() => {
                    // pythonMemoryState가 있으면 그것을 사용
                    const pyState = currentStep?.pythonMemoryState
                      || convertMemoryChangesToPyState(currentStep?.memoryChanges as MemoryChanges);

                    if (!pyState) return null;

                    return (
                      <PyVisualizerView
                        names={transformPyNames(pyState.names)}
                        objects={transformPyObjects(pyState.objects)}
                        animate={true}
                      />
                    );
                  })()} */}
                </div>
              )}

              {/* AI Chat 탭 (모바일에서 숨김) */}
              {!isMobile && activeTab === 'chat' && (
                <div
                  className="relative"
                  style={{
                    background: 'var(--theme-lesson-chat-bg)',
                    minHeight: '400px', // AI Chat은 최소 높이 유지
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

      {/* 하단 네비게이션 바 (데스크톱 전용) */}
      {!isMobile && navigation.phase === 'learning' && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 20%, rgba(255,255,255,1) 100%)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* 이전 버튼 */}
          <button
            onClick={navigation.goToPrevStep}
            disabled={!navigation.canGoPrev}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            style={{
              background: navigation.canGoPrev
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : '#e5e7eb',
              color: navigation.canGoPrev ? '#fff' : '#9ca3af',
              border: navigation.canGoPrev ? '1px solid #374151' : '1px solid #d1d5db',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>이전</span>
            {navigation.canGoPrev && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.2)' }}>
                ←
              </span>
            )}
          </button>

          {/* 중앙 진행률 */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${((navigation.currentStepIndex + 1) / navigation.totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 tabular-nums">
              {navigation.currentStepIndex + 1} / {navigation.totalSteps}
            </span>
          </div>

          {/* 다음/퀴즈 버튼 */}
          {navigation.isLastStep ? (
            <button
              onClick={navigation.goToQuiz}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 group"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#78350f',
                border: '1px solid #d97706',
              }}
            >
              <span className="mr-1 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.15)' }}>
                →
              </span>
              <span>퀴즈</span>
              <Sparkles className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={navigation.goToNextStep}
              disabled={!navigation.canGoNext}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              style={{
                background: navigation.canGoNext
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                  : '#e5e7eb',
                color: navigation.canGoNext ? '#fff' : '#9ca3af',
                border: navigation.canGoNext ? '1px solid #1d4ed8' : '1px solid #d1d5db',
              }}
            >
              <span>다음</span>
              <ChevronRight className="w-4 h-4" />
              {navigation.canGoNext && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  →
                </span>
              )}
            </button>
          )}
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

      {/* 모바일 AI Chat (FAB + Modal) */}
      {isMobile && navigation.phase !== 'completed' && (
        <>
          <MobileAIChatFAB
            isOpen={isAIChatOpen}
            onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          />
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
