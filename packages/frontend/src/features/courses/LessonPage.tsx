/**
 * LessonPage - 레슨 학습 페이지 (API 기반)
 *
 * DayPage의 API 버전. 기존 컴포넌트 99% 재사용.
 * Route: /courses/:lang/:chapterId/:lessonId
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, MessageSquare, Cpu, Bot, Code2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getLessonFull, getChapterWithLessons, updateProgress } from '@/services/courses';
// TODO: 다른 서버에서 파일 가져온 후 주석 해제
// import { useEnterKey } from '@/hooks';
// import { simulatorService } from '@/services/simulator';
// import { useLessonHistoryStore } from '@/stores/lessonHistoryStore';
import type { LessonFull, LessonStep, Quiz, SupportedLanguage } from '@/types';

// 기존 컴포넌트 재사용
import { CodeViewer } from './components/day/CodeViewer';
import { StepExplanation } from './components/day/StepExplanation';
import { SelectedCodeBadge } from './components/day/SelectedCodeBadge';
import { MemoryPanel } from './components/memory/MemoryPanel';
import { ReturnOverlay } from '@/features/visualizers/shared';
import { ChatQA } from '@/features/chat';
import { TerminalOutput, type TerminalLine } from '@/features/visualizers/shared';

// 새 hooks
import { useLessonNavigation } from './hooks/useLessonNavigation';
import { useLessonVisualization } from './hooks/useLessonVisualization';
import { useCodeSelection } from './hooks/useCodeSelection';
import { useIsMobile } from '@/hooks';

// 언어별 시각화
import { JSVisualizerView } from '@/features/visualizers/js';
// TODO: 다른 서버에서 파일 가져온 후 주석 해제
// import { PyVisualizerView } from '@/features/visualizers/python';

// Python 코스 전용 컴포넌트
import { PythonLessonView } from './components/python';
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

  // 상태
  const [lesson, setLesson] = useState<LessonFull | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'memory' | 'explanation' | 'chat'>('memory');
  const isMobile = useIsMobile();
  // 모바일 AI Chat 상태
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  // 시뮬레이터 결과 (stdout용)
  const [simulatorSteps, setSimulatorSteps] = useState<LessonStep[]>([]);
  // 탭 반짝임 효과
  const [flashExplanation, setFlashExplanation] = useState(false);
  const [flashMemory, setFlashMemory] = useState(false);
  const prevStepIndexRef = useRef(0);

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
        setSimulatorSteps([]); // 초기화

        // 레슨 상세 먼저 가져오기
        const lessonData = await getLessonFull(currentLessonId);

        if (cancelled) return;
        setLesson(lessonData);

        // TODO: 다른 서버에서 파일 가져온 후 주석 해제
        // C 언어인 경우 시뮬레이터 API 호출 (stdout 가져오기)
        // if (lang === 'c' && lessonData.content?.code) {
        //   const simResult = await simulatorService.simulate('c', {
        //     code: lessonData.content.code,
        //   });
        //   if (!cancelled && simResult.success) {
        //     setSimulatorSteps(simResult.steps);
        //   }
        // }

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

  // Hooks
  const navigation = useLessonNavigation({
    totalSteps: steps.length,
    lessonId: lessonId, // 레슨 변경 시 상태 초기화
    onComplete: async () => {
      // 레슨 완료 시 Progress 저장
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

  // 터미널 출력 라인
  // 1순위: 레슨 JSON의 stdout (정적, 신뢰할 수 있음)
  // 2순위: 시뮬레이터 API 결과 (동적, fallback)
  const terminalLines = useMemo((): TerminalLine[] => {
    if (!currentStep) return [];

    const lines: TerminalLine[] = [];
    const currentStepIdx = navigation.currentStepIndex;

    // 현재 스텝까지의 모든 stdout 수집
    for (let i = 0; i <= currentStepIdx; i++) {
      const step = steps[i];
      if (!step) continue;

      // 1순위: 레슨 JSON에 stdout이 있으면 사용
      if (step.stdout) {
        lines.push({ content: step.stdout, type: 'output' });
        continue;
      }

      // 2순위: 시뮬레이터 결과에서 같은 라인의 stdout 찾기
      const simStep = simulatorSteps.find(s => s.line === step.line);
      if (simStep?.stdout) {
        lines.push({ content: simStep.stdout, type: 'output' });
      }
    }

    return lines;
  }, [steps, simulatorSteps, currentStep, navigation.currentStepIndex]);

  // 스텝 변경 시 탭 반짝임 효과 (앞으로 갈 때만)
  useEffect(() => {
    const prevIndex = prevStepIndexRef.current;
    const isForward = navigation.currentStepIndex > prevIndex;
    prevStepIndexRef.current = navigation.currentStepIndex;

    // 뒤로 가거나 첫 스텝이면 무시
    if (!isForward || navigation.currentStepIndex === 0) return;

    // 설명 탭 반짝임
    setFlashExplanation(true);
    const explanationTimer = setTimeout(() => setFlashExplanation(false), 600);

    // 메모리 변경이 있으면 메모리 탭도 반짝임
    const hasMemoryChange = currentStep?.memoryChanges &&
      (Array.isArray(currentStep.memoryChanges) ? currentStep.memoryChanges.length > 0 : true);
    if (hasMemoryChange) {
      setFlashMemory(true);
      const memoryTimer = setTimeout(() => setFlashMemory(false), 600);
      return () => {
        clearTimeout(explanationTimer);
        clearTimeout(memoryTimer);
      };
    }

    return () => clearTimeout(explanationTimer);
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
          {/* 헤더 - Completed에서도 표시 */}
          <div className="flex items-center gap-4 mb-2">
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
          <CompletedView
            lessonOrder={lesson.order}
            nextLessonPath={nextLessonPath}
            chapterPath={languageCoursePath}
          />
        </>
      ) : isMobile ? (
        /* ===== 모바일 통합 레이아웃 (모든 언어 동일) ===== */
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-3 px-2">
            <Link to={languageCoursePath} className="cyber-back-btn">
              <span className="cyber-back-arrow">‹</span>
              <span>EXIT</span>
            </Link>
            <div className="cyber-divider" />
            <div className="flex-1">
              <h1 className="text-lg font-bold">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-xs text-gray-500">{lesson.description}</p>
              )}
            </div>
          </div>

          {/* 모바일 레슨 뷰 (모든 언어 공통) */}
          <div className="flex-1 min-h-0">
            <MobileLessonView
              code={code}
              steps={steps}
              currentStepIndex={navigation.currentStepIndex}
              languageId={lang || 'c'}
              lessonId={lessonId || ''}
              lessonTitle={lesson.title}
              lessonOrder={lesson.order}
              memoryState={memoryState}
              showRegisters={lesson?.content?.showRegisters}
            />
          </div>

          {/* 스텝 컨트롤 */}
          <div className="flex items-center justify-center gap-3 py-3 px-2 border-t border-[#e5d5c7] bg-white">
            <button
              onClick={navigation.goToPrevStep}
              disabled={!navigation.canGoPrev}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>
            <span className="text-xs text-gray-500">
              {navigation.currentStepIndex + 1} / {navigation.totalSteps}
            </span>
            {!navigation.isLastStep ? (
              <button
                onClick={navigation.goToNextStep}
                className="px-3 py-1.5 rounded-lg bg-[#6b5a4a] text-white hover:bg-[#5a4a3a] transition-colors flex items-center gap-1 text-sm"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={navigation.goToQuiz}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1 text-sm"
              >
                퀴즈 풀기
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : lang?.includes('python') ? (
        /* ===== 데스크톱: Python 코스 전용 레이아웃 (슬라이딩 2페이지) ===== */
        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-4 px-4">
            <Link to={languageCoursePath} className="cyber-back-btn">
              <span className="cyber-back-arrow">‹</span>
              <span>EXIT</span>
            </Link>
            <div className="cyber-divider" />
            <div className="flex-1">
              <h1 className="text-lg font-bold">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-xs text-gray-500">{lesson.description}</p>
              )}
            </div>
          </div>

          {/* Python 레슨 뷰 */}
          <div className="flex-1 min-h-0">
            <PythonLessonView
              code={code}
              steps={steps}
              currentStepIndex={navigation.currentStepIndex}
              languageId={lang}
              lessonId={lessonId || ''}
            />
          </div>

          {/* 스텝 컨트롤 */}
          <div className="flex items-center justify-center gap-4 py-4 border-t border-[#e5d5c7] bg-white">
            <button
              onClick={navigation.goToPrevStep}
              disabled={!navigation.canGoPrev}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>
            <span className="text-sm text-gray-500">
              {navigation.currentStepIndex + 1} / {navigation.totalSteps}
            </span>
            {!navigation.isLastStep ? (
              <button
                onClick={navigation.goToNextStep}
                className="px-4 py-2 rounded-lg bg-[#6b5a4a] text-white hover:bg-[#5a4a3a] transition-colors flex items-center gap-2"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={navigation.goToQuiz}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                퀴즈 풀기
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          {/* 왼쪽: 코드 + 컨트롤 (모바일: 100%, 데스크톱: 50%) */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            {/* 헤더 - 왼쪽 컬럼 안에 배치 (오른쪽 탭 컨테이너가 위로 올라갈 수 있도록) */}
            <div className="flex items-center gap-4">
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
            {/* 코드 뷰어 카드 (뚜껑 스타일) */}
            <div>
              {/* 코드 헤더 - 뚜껑 + 스텝 컨트롤 (다크 테마) */}
              <div
                className="flex items-center justify-between px-4 py-2 rounded-t-xl text-sm font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                  border: '1px solid #E5D5C7',
                  borderBottom: 'none',
                  color: '#e5e5e5',
                }}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-yellow-400" />
                  코드
                </div>
                {/* 스텝 컨트롤 (키보드 키 스타일) */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={navigation.goToPrevStep}
                    disabled={!navigation.canGoPrev}
                    className="w-7 h-7 flex items-center justify-center rounded-md bg-gradient-to-b from-zinc-600 to-zinc-700 border border-zinc-500 border-b-zinc-800 shadow-[0_2px_0_0_#27272a] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#27272a] active:translate-y-[2px] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-zinc-200" />
                  </button>

                  {/* 진행률 바 + 스텝 (키보드 스페이스바 스타일) */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-md border border-zinc-500 border-b-zinc-800 shadow-[0_2px_0_0_#27272a]">
                    <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                        style={{ width: `${((navigation.currentStepIndex + 1) / navigation.totalSteps) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-300 tabular-nums font-medium">
                      {navigation.currentStepIndex + 1}/{navigation.totalSteps}
                    </span>
                  </div>

                  {navigation.isLastStep ? (
                    <button
                      onClick={navigation.goToQuiz}
                      className="flex items-center gap-1 px-3 py-1 rounded-md bg-gradient-to-b from-yellow-400 to-yellow-500 border border-yellow-300 border-b-yellow-700 shadow-[0_2px_0_0_#a16207] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#a16207] active:translate-y-[2px] active:shadow-none text-yellow-900 font-bold text-[11px] transition-all"
                    >
                      <Sparkles className="w-3 h-3" />
                      퀴즈
                    </button>
                  ) : (
                    <button
                      onClick={navigation.goToNextStep}
                      disabled={!navigation.canGoNext}
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-gradient-to-b from-zinc-600 to-zinc-700 border border-zinc-500 border-b-zinc-800 shadow-[0_2px_0_0_#27272a] hover:translate-y-[1px] hover:shadow-[0_1px_0_0_#27272a] active:translate-y-[2px] active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
                    >
                      <ChevronRight className="w-4 h-4 text-zinc-200" />
                    </button>
                  )}
                </div>
              </div>
              {/* 코드 뷰어 */}
              <div
                className="overflow-hidden rounded-b-xl"
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

              {/* 터미널 출력 (VSCode 스타일) */}
              <div
                className="rounded-b-xl overflow-hidden"
                style={{
                  border: '1px solid #E5D5C7',
                  borderTop: 'none',
                }}
              >
                <TerminalOutput
                  lines={terminalLines}
                  title="출력"
                  maxHeight="80px"
                  emptyMessage="실행 결과가 여기에 표시됩니다"
                  compact
                />
              </div>
            </div>
          </div>

          {/* 오른쪽: 3탭 구조 (모바일: 100%, 데스크톱: 50%) */}
          <div className="w-full md:w-1/2 flex flex-col md:mt-[37px]">
            {/* 탭 헤더 - 3탭 */}
            <div
              className="flex rounded-t-xl"
              style={{ border: '1px solid #E5D5C7', borderBottom: 'none', overflow: 'visible' }}
            >
              {/* 메모리 탭 */}
              <button
                onClick={() => setActiveTab('memory')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-tl-[11px]"
                style={{
                  background: activeTab === 'memory'
                    ? 'linear-gradient(135deg, #F0FAF0 0%, #E8F5E8 100%)'
                    : flashMemory
                      ? 'linear-gradient(180deg, #d1fae5 0%, #ecfdf5 100%)'
                      : '#f8f4ef',
                  color: activeTab === 'memory' ? '#4a6a4a' : flashMemory ? '#059669' : '#937b5d',
                  borderRight: '1px solid #E5D5C7',
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

              {/* 설명 탭 */}
              <button
                onClick={() => setActiveTab('explanation')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold"
                style={{
                  background: activeTab === 'explanation'
                    ? 'linear-gradient(135deg, #FFF8F0 0%, #FFF5EB 100%)'
                    : flashExplanation
                      ? 'linear-gradient(180deg, #fef3c7 0%, #fffbeb 100%)'
                      : '#f8f4ef',
                  color: activeTab === 'explanation' ? '#b86e3c' : flashExplanation ? '#d97706' : '#937b5d',
                  borderRight: '1px solid #E5D5C7',
                  animation: flashExplanation ? 'tabGlow 0.6s ease-out' : 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <MessageSquare className="w-3.5 h-3.5" style={{
                  animation: flashExplanation ? 'iconPop 0.4s ease-out' : 'none'
                }} />
                <span style={{
                  animation: flashExplanation ? 'textPop 0.4s ease-out 0.1s both' : 'none'
                }}>
                  설명
                </span>
              </button>

              {/* AI Chat 탭 (모바일에서 숨김) */}
              {!isMobile && (
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all"
                  style={{
                    background: activeTab === 'chat'
                      ? 'linear-gradient(135deg, #FFFBF5 0%, #FFF9F2 100%)'
                      : '#f8f4ef',
                    color: activeTab === 'chat' ? '#7c5e3c' : '#937b5d',
                  }}
                >
                  <Bot className="w-3.5 h-3.5" />
                  AI 튜터
                </button>
              )}
            </div>

            {/* 탭 콘텐츠 - 콘텐츠에 따라 높이 자연 확장 (스크롤 없음) */}
            <div
              className="rounded-b-xl"
              style={{
                border: '1px solid #E5D5C7',
                borderTop: 'none',
              }}
            >
              {/* 메모리/시각화 탭 - 컨테이너 꽉 채우기 */}
              {activeTab === 'memory' && (
                <div
                  className="p-2 min-h-[500px] relative"
                  style={{
                    background: 'linear-gradient(135deg, #F0FAF0 0%, #E8F5E8 100%)',
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

              {/* 설명 탭 - 현재 스텝 설명 */}
              {activeTab === 'explanation' && currentStep && (
                <div
                  className="p-4 min-h-[500px]"
                  style={{
                    background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF5EB 100%)',
                  }}
                >
                  {/* 라인 번호 배지 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="px-2.5 py-1 rounded-md text-xs font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        color: '#fff',
                      }}
                    >
                      📍 Line {currentStep.line}
                    </span>
                    <span className="text-xs text-amber-700 opacity-70">
                      {navigation.currentStepIndex + 1}/{navigation.totalSteps} 단계
                    </span>
                  </div>

                  {/* 설명 내용 */}
                  <StepExplanation
                    explanation={currentStep.explanation}
                    stepIndex={navigation.currentStepIndex}
                  />
                </div>
              )}

              {/* AI Chat 탭 - 고정 높이 + 스크롤 (모바일에서 숨김) */}
              {!isMobile && activeTab === 'chat' && (
                <div
                  className="relative h-[500px] overflow-y-auto"
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
