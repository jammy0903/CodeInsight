/**
 * useLessonTerminal - 터미널 출력 라인 계산 훅
 *
 * languageId 기반으로 현재 스텝의 터미널 출력을 추출.
 * 데스크톱(LessonPage)과 모바일(MobileLessonView) 양쪽에서 공용.
 *
 * 언어별 출력 경로:
 * - C:          step.stdout (누적 문자열)
 * - Python:     step.pythonMemoryState.output (배열)
 * - Java:       step.javaMemoryState.output (배열)
 * - JavaScript: step.eventLoopState.output (배열)
 */

import { useMemo } from 'react';
import type { TerminalLine } from '@/features/visualizers/shared';
import type { LessonStep } from '@/types';

interface UseLessonTerminalOptions {
  steps: LessonStep[];
  currentStepIndex: number;
  languageId: string;
  /** true이면 이전 스텝과의 diff만 표시 (데스크톱), false이면 누적 전체 표시 (모바일) */
  diffMode?: boolean;
}

type OutputField = 'pythonMemoryState' | 'javaMemoryState' | 'eventLoopState' | 'memoryState';

function getOutputList(step: LessonStep | null | undefined, field: OutputField): unknown[] {
  const container = step?.[field] as { output?: unknown } | undefined;
  return Array.isArray(container?.output) ? container.output : [];
}

export function useLessonTerminal({
  steps,
  currentStepIndex,
  languageId,
  diffMode = true,
}: UseLessonTerminalOptions): TerminalLine[] {
  return useMemo((): TerminalLine[] => {
    const currentStep = steps[currentStepIndex];
    if (!currentStep) return [];

    const prevStep = diffMode && currentStepIndex > 0
      ? steps[currentStepIndex - 1]
      : null;

    // C: step.stdout (누적 문자열)
    if (languageId === 'c') {
      if (!currentStep.stdout) return [];
      const currentLines = currentStep.stdout.split('\n').filter(Boolean);
      if (!diffMode) {
        return currentLines.map((line): TerminalLine => ({ content: line, type: 'stdout' }));
      }
      const prevLines = prevStep?.stdout?.split('\n').filter(Boolean) || [];
      return currentLines.slice(prevLines.length)
        .map((line): TerminalLine => ({ content: line, type: 'stdout' }));
    }

    // Python: pythonMemoryState.output (JSON 레슨) 또는 stdout (시뮬레이터)
    if (languageId === 'python' || languageId === 'python-practical') {
      const pyOutput = getOutputList(currentStep, 'pythonMemoryState');
      if (pyOutput.length > 0) {
        if (!diffMode) {
          return pyOutput.map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
        }
        const prevOutput = getOutputList(prevStep, 'pythonMemoryState');
        return pyOutput.slice(prevOutput.length)
          .map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
      }
      // fallback: stdout (시뮬레이터 경로)
      if (currentStep.stdout) {
        const currentLines = currentStep.stdout.split('\n').filter(Boolean);
        if (!diffMode) {
          return currentLines.map((line): TerminalLine => ({ content: line, type: 'stdout' }));
        }
        const prevLines = prevStep?.stdout?.split('\n').filter(Boolean) || [];
        return currentLines.slice(prevLines.length)
          .map((line): TerminalLine => ({ content: line, type: 'stdout' }));
      }
      return [];
    }

    // Java: javaMemoryState.output (JSON 레슨) 또는 stdout (시뮬레이터)
    if (languageId === 'java') {
      const jmsOutput = getOutputList(currentStep, 'javaMemoryState');
      if (jmsOutput.length > 0) {
        if (!diffMode) {
          return jmsOutput.map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
        }
        const prevOutput = getOutputList(prevStep, 'javaMemoryState');
        return jmsOutput.slice(prevOutput.length)
          .map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
      }
      // fallback: stdout (시뮬레이터 경로)
      if (currentStep.stdout) {
        const currentLines = currentStep.stdout.split('\n').filter(Boolean);
        if (!diffMode) {
          return currentLines.map((line): TerminalLine => ({ content: line, type: 'stdout' }));
        }
        const prevLines = prevStep?.stdout?.split('\n').filter(Boolean) || [];
        return currentLines.slice(prevLines.length)
          .map((line): TerminalLine => ({ content: line, type: 'stdout' }));
      }
      return [];
    }

    // JavaScript: eventLoopState.output 또는 memoryState.output (JSON 레슨) 또는 stdout (시뮬레이터)
    if (languageId === 'javascript' || languageId === 'js') {
      const jsOutput = getOutputList(currentStep, 'eventLoopState');
      if (jsOutput.length > 0) {
        if (!diffMode) {
          return jsOutput.map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
        }
        const prevOutput = getOutputList(prevStep, 'eventLoopState');
        return jsOutput.slice(prevOutput.length)
          .map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
      }
      // fallback: memoryState.output (memory vizType 레슨)
      const msOutput = getOutputList(currentStep, 'memoryState');
      if (msOutput.length > 0) {
        if (!diffMode) {
          return msOutput.map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
        }
        const prevMsOutput = getOutputList(prevStep, 'memoryState');
        return msOutput.slice(prevMsOutput.length)
          .map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
      }
      // fallback: stdout (시뮬레이터 경로)
      if (currentStep.stdout) {
        const currentLines = currentStep.stdout.split('\n').filter(Boolean);
        if (!diffMode) {
          return currentLines.map((line): TerminalLine => ({ content: line, type: 'stdout' }));
        }
        const prevLines = prevStep?.stdout?.split('\n').filter(Boolean) || [];
        return currentLines.slice(prevLines.length)
          .map((line): TerminalLine => ({ content: line, type: 'stdout' }));
      }
      return [];
    }

    return [];
  }, [steps, currentStepIndex, languageId, diffMode]);
}
