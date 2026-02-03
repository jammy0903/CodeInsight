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

    // Python: pythonMemoryState.output (배열)
    if (languageId === 'python' || languageId === 'python-practical') {
      const output = (currentStep as any)?.pythonMemoryState?.output;
      if (!Array.isArray(output)) return [];
      if (!diffMode) {
        return output.map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
      }
      const prevOutput = (prevStep as any)?.pythonMemoryState?.output || [];
      return output.slice(prevOutput.length)
        .map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
    }

    // Java: javaMemoryState.output (배열)
    if (languageId === 'java') {
      const output = (currentStep as any)?.javaMemoryState?.output;
      if (!Array.isArray(output)) return [];
      if (!diffMode) {
        return output.map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
      }
      const prevOutput = (prevStep as any)?.javaMemoryState?.output || [];
      return output.slice(prevOutput.length)
        .map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
    }

    // JavaScript: eventLoopState.output (배열)
    if (languageId === 'javascript' || languageId === 'js') {
      const output = (currentStep as any)?.eventLoopState?.output;
      if (!Array.isArray(output)) return [];
      if (!diffMode) {
        return output.map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
      }
      const prevOutput = (prevStep as any)?.eventLoopState?.output || [];
      return output.slice(prevOutput.length)
        .map((line): TerminalLine => ({ content: String(line), type: 'stdout' }));
    }

    return [];
  }, [steps, currentStepIndex, languageId, diffMode]);
}
