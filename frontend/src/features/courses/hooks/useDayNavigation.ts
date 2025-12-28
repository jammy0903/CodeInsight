/**
 * useDayNavigation - Day 학습 흐름 관리 (스텝 → 퀴즈 → 완료)
 */

import { useState, useCallback } from 'react';
import type { Day } from '@/types/course';

export type DayPhase = 'learning' | 'quiz' | 'completed';

export interface UseDayNavigationReturn {
  phase: DayPhase;
  currentStepIndex: number;
  totalSteps: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  goToPrevStep: () => void;
  goToNextStep: () => void;
  goToQuiz: () => void;
  completeDay: () => void;
  reset: () => void;
}

export function useDayNavigation(
  day: Day,
  markDayComplete: (day: number) => void
): UseDayNavigationReturn {
  const [phase, setPhase] = useState<DayPhase>('learning');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const totalSteps = day.steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < totalSteps - 1;

  const goToPrevStep = useCallback(() => {
    if (canGoPrev) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [canGoPrev]);

  const goToNextStep = useCallback(() => {
    if (canGoNext) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [canGoNext]);

  const goToQuiz = useCallback(() => {
    setPhase('quiz');
  }, []);

  const completeDay = useCallback(() => {
    markDayComplete(day.day);
    setPhase('completed');
  }, [day.day, markDayComplete]);

  const reset = useCallback(() => {
    setPhase('learning');
    setCurrentStepIndex(0);
  }, []);

  return {
    phase,
    currentStepIndex,
    totalSteps,
    canGoPrev,
    canGoNext,
    isLastStep,
    goToPrevStep,
    goToNextStep,
    goToQuiz,
    completeDay,
    reset,
  };
}
