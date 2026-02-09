/**
 * useLessonSimulation - 시뮬레이션 실행 + JSON/시뮬 스텝 머지 훅
 *
 * 역할:
 * 1. lesson.content.code가 있으면 시뮬레이터 API 호출
 * 2. 시뮬레이터 결과 스텝 + JSON 스텝의 explanation 머지
 * 3. Python의 경우 stack/heap → pythonMemoryState 변환
 * 4. 연속 동일 라인 필터링 (asyncio import flooding 방지)
 * 5. 캐시로 동일 코드 재요청 방지
 * 6. 실패 시 JSON 스텝으로 fallback
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { simulatorService, isLanguageSupported } from '@/services/simulator';
import type { LessonFull, LessonStep } from '@/types';

interface UseLessonSimulationOptions {
  lesson: LessonFull | undefined;
  lang: string | undefined;
  lessonId: string | undefined;
}

interface UseLessonSimulationResult {
  steps: LessonStep[];
  code: string;
  simulating: boolean;
  simulationError: string | null;
}

/**
 * Python 시뮬레이터 결과의 stack/heap을 pythonMemoryState로 변환
 */
function convertToPythonMemoryState(simStep: any) {
  if (!simStep.stack || !simStep.heap) return undefined;

  const names: any[] = [];
  const objects: any[] = [];

  // stack에서 variables 추출
  simStep.stack.forEach((frame: any) => {
    Object.entries(frame.variables || {}).forEach(([varName, varData]: [string, any]) => {
      if (typeof varData === 'object' && varData !== null && varData.id) {
        // Reference 타입 (str, list, dict 등)
        names.push({
          name: varName,
          pointsTo: varData.id.replace('0x', 'obj-'),
        });
      } else {
        // 원시값 (int, float, bool 등) - object로 변환
        const primitiveId = `primitive-${varName}-${simStep.line}`;
        names.push({ name: varName, pointsTo: primitiveId });
        objects.push({
          id: primitiveId,
          type: typeof varData,
          value: String(varData),
          pyId: primitiveId,
        });
      }
    });
  });

  // heap에서 objects 추출
  simStep.heap.forEach((heapObj: any) => {
    objects.push({
      id: heapObj.address.replace('0x', 'obj-'),
      type: heapObj.type,
      value: heapObj.content,
      pyId: heapObj.address,
    });
  });

  // stdout 추출 (누적)
  const output = simStep.stdout ? simStep.stdout.split('\n').filter(Boolean) : [];

  return { names, objects, output };
}

/**
 * 시뮬레이터 스텝과 JSON 스텝을 머지
 * - JSON explanation 우선 사용 (시뮬레이터는 메모리 상태만 생성)
 * - Python은 pythonMemoryState 변환
 */
function mergeSteps(
  simSteps: any[],
  jsonSteps: LessonStep[],
  lang: string,
): LessonStep[] {
  return simSteps.map((simStep) => {
    const jsonStep = jsonSteps.find((js) => js.line === simStep.line);

    const pythonMemoryState =
      (lang === 'python' || lang === 'python-practical')
        ? convertToPythonMemoryState(simStep)
        : undefined;

    return {
      ...simStep,
      explanation: jsonStep?.explanation || simStep.explanation,
      title: jsonStep?.title || `Line ${simStep.line}`,
      highlight: jsonStep?.highlight || [simStep.line],
      pythonMemoryState,
      // Java/JS: JSON 원본의 언어별 메모리 상태 보존 (시뮬레이터에 없으면)
      ...(!simStep.javaMemoryState && jsonStep && (jsonStep as any).javaMemoryState
        ? { javaMemoryState: (jsonStep as any).javaMemoryState }
        : {}),
      ...(!simStep.eventLoopState && jsonStep && (jsonStep as any).eventLoopState
        ? { eventLoopState: (jsonStep as any).eventLoopState }
        : {}),
    };
  });
}

/**
 * 연속 동일 라인 필터링 — 각 그룹의 마지막 스텝만 유지
 * (asyncio import 등에서 같은 라인이 수십 번 반복되는 문제 방지)
 */
function filterConsecutiveDuplicateLines(steps: LessonStep[]): LessonStep[] {
  return steps.reduce((acc: LessonStep[], step, idx) => {
    const nextStep = steps[idx + 1];
    // 다음 스텝이 없거나 다른 라인이면 현재 스텝 유지 (= 그룹의 마지막)
    if (!nextStep || nextStep.line !== step.line) {
      acc.push(step);
    }
    return acc;
  }, []);
}

/**
 * 빈 줄 스텝 필터링 — 코드에서 해당 라인이 빈 줄이면 제거
 * (시뮬레이터가 빈 줄도 스텝으로 생성하는 문제 방지)
 */
function filterEmptyLineSteps(steps: LessonStep[], code: string): LessonStep[] {
  const codeLines = code.split('\n');
  return steps.filter(step => {
    if (step.line === undefined) return true;
    const lineContent = codeLines[step.line - 1] || '';
    return lineContent.trim() !== '';
  });
}

export function useLessonSimulation({
  lesson,
  lang,
  lessonId,
}: UseLessonSimulationOptions): UseLessonSimulationResult {
  const [liveSteps, setLiveSteps] = useState<LessonStep[] | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const memoizedCode = useMemo(() => lesson?.content?.code || '', [lesson?.content?.code]);
  const simulationCache = useRef<Record<string, LessonStep[]>>({});
  const lastSimulatedCodeRef = useRef<string>('');
  const prevLessonIdRef = useRef(lessonId);

  // 레슨 변경 시 상태 리셋 — 렌더 중 동기 리셋 (useEffect 대신)
  // useEffect는 paint 후 실행되어 이전 레슨 데이터가 한 프레임 보이는 문제 방지
  if (prevLessonIdRef.current !== lessonId) {
    prevLessonIdRef.current = lessonId;
    setLiveSteps(null);
    setSimulationError(null);
  }

  // 시뮬레이션 실행
  useEffect(() => {
    if (!lesson || !lang) return;

    // 1. 코드 없이 steps만 있으면 그대로 사용 (courses.ts에서 이미 resolve됨)
    if (!lesson.content?.code && lesson.content?.steps) {
      setLiveSteps(lesson.content.steps);
      return;
    }

    // 2. JSON 스텝에 시각화 데이터가 이미 있으면 시뮬레이션 스킵
    //    (eventLoopState, scopeState 등 — 시뮬레이터보다 정확한 사전 제작 데이터)
    if (lesson.content?.steps && lesson.content.steps.length > 0) {
      const VIZ_FIELDS = ['stack', 'memoryState', 'pythonMemoryState', 'javaMemoryState',
        'scopeState', 'eventLoopState', 'promiseState', 'thisState', 'prototypeState', 'callStackState'];
      const allStepsHaveViz = lesson.content.steps.every((s: any) =>
        VIZ_FIELDS.some(f => s[f] != null)
      );
      if (allStepsHaveViz) {
        setLiveSteps(lesson.content.steps);
        return;
      }
    }

    // 3. 지원되지 않는 언어이거나 코드가 없으면 JSON steps fallback
    if (!isLanguageSupported(lang) || !memoizedCode) {
      if (lesson.content?.steps) {
        setLiveSteps(lesson.content.steps);
      }
      return;
    }

    // 3. 캐시 히트
    if (simulationCache.current[memoizedCode]) {
      setLiveSteps(simulationCache.current[memoizedCode]);
      return;
    }

    // 4. 이미 같은 코드로 시뮬레이션 완료
    if (lastSimulatedCodeRef.current === memoizedCode) {
      return;
    }

    let cancelled = false;

    const runSimulation = async () => {
      if (cancelled) return;
      setSimulating(true);

      try {
        let codeToRun = memoizedCode;

        // C: main 없으면 래핑
        if (lang === 'c' && !codeToRun.includes('main')) {
          codeToRun = `#include <stdio.h>\n\nint main() {\n${codeToRun
            .split('\n')
            .map((line) => '  ' + line)
            .join('\n')}\n  return 0;\n}`;
        }

        const result = await simulatorService.simulate(lang, { code: codeToRun });
        if (cancelled) return;

        if (result.success) {
          // lesson.content.steps는 courses.ts에서 이미 resolve됨
          const jsonSteps = lesson.content?.steps || [];
          const merged = mergeSteps(result.steps, jsonSteps, lang);
          const filtered = filterConsecutiveDuplicateLines(merged);
          // 빈 줄 스텝 제거 (시뮬레이터가 빈 줄도 스텝으로 생성하는 문제 방지)
          const withoutEmptyLines = filterEmptyLineSteps(filtered, codeToRun);

          simulationCache.current[memoizedCode] = withoutEmptyLines;
          lastSimulatedCodeRef.current = memoizedCode;
          setSimulationError(null);
          setLiveSteps(withoutEmptyLines);
        } else {
          console.error('Simulation failed:', result.error);
          setSimulationError(result.error || 'Failed to simulate code.');
          if (lesson.content?.steps) {
            setLiveSteps(lesson.content.steps);
          }
        }
      } catch (e) {
        if (cancelled) return;
        console.error('Simulation exception:', e);
        setSimulationError(
          e instanceof Error ? e.message : 'An unknown error occurred during simulation.',
        );
        if (lesson.content?.steps) {
          setLiveSteps(lesson.content.steps);
        }
      } finally {
        if (!cancelled) setSimulating(false);
      }
    };

    runSimulation();
    return () => { cancelled = true; };
  }, [lesson, lang, memoizedCode]);

  const steps = useMemo(() => liveSteps || [], [liveSteps]);
  const code = lesson?.content?.code || '';

  // 시뮬레이션 대기: 코드가 있는데 아직 liveSteps가 없고 simulating도 아닌 상태
  const isSimulationPending =
    !!lesson?.content?.code &&
    isLanguageSupported(lang || '') &&
    liveSteps === null &&
    !simulating;

  return {
    steps,
    code,
    simulating: simulating || isSimulationPending,
    simulationError,
  };
}
