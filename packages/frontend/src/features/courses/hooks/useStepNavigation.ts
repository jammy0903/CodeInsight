/**
 * useStepNavigation - 레슨 스텝 이동
 *
 * 설명과 시각화를 한 화면에서 함께 보여주므로 스텝을 한 줄로 이동한다.
 * 마지막 스텝 다음은 퀴즈.
 */

import { useCallback, useState } from 'react';

interface UseStepNavigationOptions {
  stepCount: number;
  onQuiz?: () => void;
}

export interface StepNavigation {
  stepIndex: number;
  total: number;
  canGoPrev: boolean;
  isLast: boolean;
  goNext: () => void;
  goPrev: () => void;
}

export function useStepNavigation({ stepCount, onQuiz }: UseStepNavigationOptions): StepNavigation {
  const [rawIndex, setStepIndex] = useState(0);
  // 스텝 수가 줄어든 경우(시뮬레이션 결과 교체 등)에도 범위를 벗어나지 않게
  const stepIndex = Math.min(rawIndex, Math.max(stepCount - 1, 0));
  const isLast = stepIndex >= stepCount - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onQuiz?.();
      return;
    }
    setStepIndex(stepIndex + 1);
  }, [isLast, onQuiz, stepIndex]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }, [stepIndex]);

  return {
    stepIndex,
    total: stepCount,
    canGoPrev: stepIndex > 0,
    isLast,
    goNext,
    goPrev,
  };
}
