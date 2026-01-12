/**
 * LessonPage - 레슨 학습 페이지 (API 기반)
 *
 * DayPage의 API 버전. 기존 컴포넌트 99% 재사용.
 * Route: /courses/:lang/:chapterId/:lessonId
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Cpu, Bot, Code2, ChevronLeft, ChevronRight, Sparkles, GripHorizontal, GripVertical } from 'lucide-react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getLessonFull, getChapterWithLessons, updateProgress } from '@/services/courses';
import { useEnterKey } from '@/hooks';
import { simulatorService } from '@/services/simulator';
import { useLessonHistoryStore } from '@/stores/lessonHistoryStore';
import { useThemeStore } from '@/stores/themeStore';
import { themes } from '@/config/themes';
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

// 언어별 시각화
import { JSVisualizerView } from '@/features/visualizers/js';
import { PyVisualizerView } from '@/features/visualizers/python';
import type { PyName, PyObject } from '@/types/py-simulator';

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

  // Enter 키로 제출/계속하기
  useEnterKey({
    onEnter: () => {
      if (!submitted && selected !== null) {
        handleSubmit();
      } else if (submitted) {
        handleContinue();
      }
    },
    enabled: (selected !== null && !submitted) || submitted,
  });

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
  // 시뮬레이터 결과 (stdout용)
  const [simulatorSteps, setSimulatorSteps] = useState<LessonStep[]>([]);
  // 메모리 탭 반짝임 효과
  const [flashMemory, setFlashMemory] = useState(false);
  const prevStepIndexRef = useRef(0);

  // Lesson 히스토리 저장 (최근 학습 기능용)
  const addLessonHistory = useLessonHistoryStore((s) => s.addEntry);

  // 테마
  const currentTheme = useThemeStore((s) => s.theme);
  const themeColors = themes[currentTheme];

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

        // C 언어인 경우 시뮬레이터 API 호출 (stdout 가져오기)
        if (lang === 'c' && lessonData.content?.code) {
          const simResult = await simulatorService.simulate('c', {
            code: lessonData.content.code,
          });
          if (!cancelled && simResult.success) {
            setSimulatorSteps(simResult.steps);
          }
        }

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

  // Lesson 히스토리에 저장 (최근 학습, 이어서 학습 기능용)
  useEffect(() => {
    if (!lesson || !lesson.content?.code || !lang) return;

    // 지원 언어만 저장
    const supportedLangs = ['c', 'python', 'java'];
    if (!supportedLangs.includes(lang)) return;

    addLessonHistory({
      lessonId: lesson.id,
      chapterId: lesson.chapterId,
      title: lesson.title,
      code: lesson.content.code,
      language: lang as SupportedLanguage,
    });

    if (import.meta.env.DEV) {
      console.log('[LessonPage] Saved to history:', lesson.title);
    }
  }, [lesson, lang, addLessonHistory]);

  // Steps 추출
  const steps: LessonStep[] = lesson?.content?.steps || [];
  const code = lesson?.content?.code || '';
  const quiz = lesson?.quizzes?.[0];

  // 스텝 저장 디바운스용 타이머
  const stepSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hooks
  const navigation = useLessonNavigation({
    totalSteps: steps.length,
    lessonId: lessonId, // 레슨 변경 시 상태 초기화
    onStart: async () => {
      // 레슨 시작 시 in_progress 저장
      console.log('[Progress] onStart called, lessonId:', lessonId);
      if (!lessonId) return;
      try {
        await updateProgress({
          lessonId,
          status: 'in_progress',
          currentStep: 0,
        });
        console.log('[Progress] Started lesson:', lessonId);
      } catch (err) {
        console.error('[Progress] Failed to save start:', err);
      }
    },
    onStepChange: (stepIndex: number) => {
      // 스텝 변경 시 현재 위치 저장 (디바운스 2초)
      if (!lessonId) return;

      // 이전 타이머 취소
      if (stepSaveTimerRef.current) {
        clearTimeout(stepSaveTimerRef.current);
      }

      // 2초 후 저장 (빠르게 넘기면 마지막 위치만 저장)
      stepSaveTimerRef.current = setTimeout(async () => {
        try {
          await updateProgress({
            lessonId,
            currentStep: stepIndex,
          });
          console.log('[Progress] Step saved:', stepIndex);
        } catch (err) {
          console.error('[Progress] Failed to save step:', err);
        }
      }, 2000);
    },
    onComplete: async () => {
      // 레슨 완료 시 completed 저장
      console.log('[Progress] onComplete called, lessonId:', lessonId);
      if (!lessonId) return;

      // 디바운스 타이머 취소 (완료 상태가 우선)
      if (stepSaveTimerRef.current) {
        clearTimeout(stepSaveTimerRef.current);
      }

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

  // 타이머 클린업 (레슨 변경/언마운트 시)
  useEffect(() => {
    return () => {
      if (stepSaveTimerRef.current) {
        clearTimeout(stepSaveTimerRef.current);
      }
    };
  }, [lessonId]);

  const {
    memoryState,
    changedBlocks,
    visualizationType,
    visualizationState,
  } = useLessonVisualization(steps, navigation.currentStepIndex);
  const { selection, setSelection, clearSelection } = useCodeSelection();

  // 현재 스텝
  const currentStep = steps[navigation.currentStepIndex];

  // Data/Text 섹션 자동 추출 (코드에서 문자열 리터럴, 함수 정의 추출)
  const { dataSection, textSection } = useMemo(() => {
    if (!code) return { dataSection: [], textSection: [] };

    // Data 섹션: 문자열 리터럴 추출 (printf 등에서 사용)
    const stringLiterals: Array<{ name: string; value: string; address: string }> = [];
    const stringRegex = /"([^"\\]*(\\.[^"\\]*)*)"/g;
    let match;
    let addrOffset = 0;
    while ((match = stringRegex.exec(code)) !== null) {
      const value = match[1]; // 따옴표 안의 내용
      // 짧은 형식 지정자는 건너뛰기 (예: "%d", "%s")
      if (value.length <= 3 && value.startsWith('%')) continue;
      stringLiterals.push({
        name: `str_${addrOffset}`,
        value: value.slice(0, 20) + (value.length > 20 ? '...' : ''), // 20자 제한
        address: `0x${(0x4000 + addrOffset * 0x10).toString(16)}`,
      });
      addrOffset++;
    }

    // Text 섹션: 함수 정의 추출 (int main, void foo 등)
    const functions: Array<{ name: string; address: string }> = [];
    // C 함수 정의 패턴: 반환타입 함수명(
    const funcRegex = /\b(int|void|char|float|double|long)\s+(\w+)\s*\(/g;
    let funcMatch;
    let funcOffset = 0;
    while ((funcMatch = funcRegex.exec(code)) !== null) {
      const funcName = funcMatch[2];
      functions.push({
        name: funcName,
        address: `0x${(0x1000 + funcOffset * 0x100).toString(16)}`,
      });
      funcOffset++;
    }

    // printf, scanf 등 라이브러리 함수는 Text 섹션에 심볼로 존재
    if (code.includes('printf')) {
      functions.push({ name: 'printf', address: '0x0400' });
    }
    if (code.includes('scanf')) {
      functions.push({ name: 'scanf', address: '0x0410' });
    }

    return { dataSection: stringLiterals, textSection: functions };
  }, [code]);

  // 터미널 출력 라인 (레슨 JSON 기준)
  // WHY: 시뮬레이터 fallback은 버그 유발 (printf의 *p가 값으로 치환 안 됨)
  // 레슨 JSON의 stdout이 신뢰할 수 있는 소스
  const terminalLines = useMemo((): TerminalLine[] => {
    if (!currentStep) return [];

    const lines: TerminalLine[] = [];
    const currentStepIdx = navigation.currentStepIndex;

    // 현재 스텝까지의 stdout만 수집 (레슨 JSON 기준)
    for (let i = 0; i <= currentStepIdx; i++) {
      const step = steps[i];
      if (step?.stdout) {
        lines.push({ content: step.stdout, type: 'output' });
      }
    }

    return lines;
  }, [steps, currentStep, navigation.currentStepIndex]);

  // 스텝 변경 시 메모리 탭 반짝임 효과 (앞으로 갈 때만)
  useEffect(() => {
    const prevIndex = prevStepIndexRef.current;
    const isForward = navigation.currentStepIndex > prevIndex;
    prevStepIndexRef.current = navigation.currentStepIndex;

    // 뒤로 가거나 첫 스텝이면 무시
    if (!isForward || navigation.currentStepIndex === 0) return;

    // 메모리 변경이 있으면 메모리 탭 반짝임
    const hasMemoryChange = currentStep?.memoryChanges &&
      (Array.isArray(currentStep.memoryChanges) ? currentStep.memoryChanges.length > 0 : true);
    if (hasMemoryChange) {
      setFlashMemory(true);
      const memoryTimer = setTimeout(() => setFlashMemory(false), 600);
      return () => clearTimeout(memoryTimer);
    }
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
              <h1 className="flex items-center gap-3">
                <span className="text-gray-400 text-sm font-medium">
                  {lessonId.split('-').slice(1).join('.')}
                </span>
                <span className="text-lg font-bold">{lesson.title}</span>
              </h1>
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
      ) : (
        <>
          {/* 공통 헤더 - 패널 밖에 배치 */}
          <div className="flex items-center gap-4 mb-4">
            <Link to={languageCoursePath} className="cyber-back-btn">
              <span className="cyber-back-arrow">‹</span>
              <span>EXIT</span>
            </Link>
            <div className="cyber-divider" />
            <div>
              <h1 className="flex items-center gap-3">
                <span className="text-gray-400 text-sm font-medium">
                  {lessonId.split('-').slice(1).join('.')}
                </span>
                <span className="text-lg font-bold">{lesson.title}</span>
              </h1>
              {lesson.description && (
                <p className="text-xs text-gray-500">{lesson.description}</p>
              )}
            </div>
          </div>

          {/* 양쪽 패널 - 리사이즈 가능 */}
          <PanelGroup orientation="horizontal" className="min-h-[600px]">
            {/* 왼쪽: 코드 + 설명 (50%) */}
            <Panel defaultSize={50} minSize={30} maxSize={70}>
              <div
                className="h-full rounded-xl overflow-hidden flex flex-col"
                style={{ border: '1px solid #E5D5C7' }}
              >
                <PanelGroup orientation="vertical">
                  {/* 상단: 코드 + 터미널 */}
                  <Panel defaultSize={40} minSize={20}>
                    <div className="h-full flex flex-col">
                      {/* 코드 헤더 */}
                      <div
                        className="flex items-center px-4 py-2 text-sm font-semibold flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
                          color: '#e5e5e5',
                        }}
                      >
                        <Code2 className="w-4 h-4 text-yellow-400 mr-2" />
                        코드
                      </div>
                      {/* 코드 뷰어 - 남은 공간 채우기 */}
                      <div className="flex-1 overflow-y-auto bg-white">
                        <CodeViewer
                          code={code}
                          highlightLine={currentStep?.line || 1}
                          onSelectionChange={setSelection}
                        />
                      </div>
                      {/* 터미널 출력 */}
                      {terminalLines.length > 0 && (
                        <div className="flex-shrink-0 border-t border-gray-200">
                          <TerminalOutput
                            lines={terminalLines}
                            title="출력"
                            maxHeight="80px"
                            emptyMessage=""
                            compact
                          />
                        </div>
                      )}
                    </div>
                  </Panel>

                  {/* 리사이즈 핸들 (수평선) */}
                  <PanelResizeHandle className="h-2 bg-gray-100 hover:bg-green-200 active:bg-green-300 transition-colors flex items-center justify-center cursor-row-resize">
                    <GripHorizontal size={14} className="text-gray-400" />
                  </PanelResizeHandle>

                  {/* 하단: 설명 패널 (테마 적용) */}
                  <Panel defaultSize={60} minSize={30}>
                    {currentStep && (
                      <div
                        className="h-full flex flex-col overflow-hidden"
                        style={{
                          background: themeColors.explanation.bgGradient,
                        }}
                      >
                        {/* 설명 헤더 + 스텝 컨트롤 */}
                        <div
                          className="flex-shrink-0"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 14px',
                            background: themeColors.explanation.headerGradient,
                            borderBottom: `1px solid ${themeColors.explanation.headerBorder}`,
                          }}
                        >
                          {/* 왼쪽: 💡 설명 */}
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: '14px' }}>💡</span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: themeColors.explanation.text,
                                fontWeight: 600,
                                fontFamily: 'system-ui, sans-serif',
                              }}
                            >
                              설명
                            </span>
                          </div>

                          {/* 중앙: 스텝 컨트롤 */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={navigation.goToPrevStep}
                              disabled={!navigation.canGoPrev}
                              className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                              style={{
                                backgroundColor: themeColors.explanation.buttonBg,
                                border: `1px solid ${themeColors.explanation.buttonBorder}`,
                              }}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" style={{ color: themeColors.explanation.buttonText }} />
                            </button>

                            <span
                              style={{
                                fontSize: '11px',
                                color: themeColors.explanation.text,
                                fontWeight: 600,
                                fontFamily: 'monospace',
                                padding: '2px 10px',
                                backgroundColor: themeColors.explanation.counterBg,
                                borderRadius: '12px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              }}
                            >
                              {navigation.currentStepIndex + 1}/{navigation.totalSteps}
                            </span>

                            {navigation.isLastStep ? (
                              <button
                                onClick={navigation.goToQuiz}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] transition-all shadow-sm"
                                style={{
                                  background: themeColors.explanation.quizGradient,
                                  color: themeColors.explanation.quizText,
                                }}
                              >
                                <Sparkles className="w-3 h-3" />
                                퀴즈
                              </button>
                            ) : (
                              <button
                                onClick={navigation.goToNextStep}
                                disabled={!navigation.canGoNext}
                                className="w-6 h-6 flex items-center justify-center rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                style={{
                                  backgroundColor: themeColors.explanation.buttonBg,
                                  border: `1px solid ${themeColors.explanation.buttonBorder}`,
                                }}
                              >
                                <ChevronRight className="w-3.5 h-3.5" style={{ color: themeColors.explanation.buttonText }} />
                              </button>
                            )}
                          </div>

                          {/* 오른쪽: Line 번호 */}
                          <span
                            style={{
                              fontSize: '10px',
                              color: themeColors.explanation.textMuted,
                              fontFamily: 'monospace',
                            }}
                          >
                            Line {currentStep.line}
                          </span>
                        </div>
                        {/* 설명 내용 - 스크롤 가능 */}
                        <div className="flex-1 overflow-y-auto" style={{ padding: '12px 16px' }}>
                          <StepExplanation
                            explanation={currentStep.explanation}
                            stepIndex={navigation.currentStepIndex}
                          />
                        </div>
                      </div>
                    )}
                  </Panel>
                </PanelGroup>
              </div>
            </Panel>

            {/* 좌우 리사이즈 핸들 - 완전 투명 */}
            <PanelResizeHandle
              style={{
                width: '24px',
                background: 'none',
                border: 'none',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'col-resize',
              }}
            >
              <GripVertical size={14} className="text-gray-300" />
            </PanelResizeHandle>

            {/* 오른쪽: 메모리 | AI Chat */}
            <Panel defaultSize={50} minSize={30} maxSize={70}>
              <div
                className="h-full rounded-xl overflow-hidden flex flex-col"
                style={{ border: '1px solid #E5D5C7' }}
              >
                {/* 탭 헤더 - 2탭 */}
                <div className="flex flex-shrink-0">
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

              {/* AI Chat 탭 */}
              <button
                onClick={() => setActiveTab('chat')}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-tr-[11px] transition-all"
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
                </div>

                {/* 탭 콘텐츠 - 남은 공간 채우기 */}
                <div className="flex-1 overflow-y-auto">
                  {/* 메모리/시각화 탭 */}
                  {activeTab === 'memory' && (
                    <div
                      className="p-2 h-full relative"
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
                            dataSection={dataSection}
                            textSection={textSection}
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

                      {/* Python: 참조 모델 시각화 */}
                      {lang === 'python' && (() => {
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
                      })()}
                    </div>
                  )}

                  {/* AI Chat 탭 - 남은 공간 채우기 */}
                  {activeTab === 'chat' && (
                    <div
                      className="relative h-full"
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
            </Panel>
          </PanelGroup>
        </>
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
