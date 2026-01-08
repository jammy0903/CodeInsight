/**
 * useLessonNavigation - 레슨 학습 흐름 관리 (스텝 → 퀴즈 → 완료)
 *
 * WHY: useDayNavigation의 일반화 버전. Day/Lesson 둘 다 지원.
 * TRADEOFF: 별도 hook 생성 > 기존 hook 수정 (레거시 호환성 유지)
 */

import { useState, useCallback, useEffect } from 'react';

export type LessonPhase = 'learning' | 'quiz' | 'completed';

export interface UseLessonNavigationOptions {
  totalSteps: number;
  lessonId?: string; // 레슨 변경 감지용
  onComplete?: () => void;
}

export interface UseLessonNavigationReturn {
  phase: LessonPhase;
  currentStepIndex: number;
  totalSteps: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  goToPrevStep: () => void;
  goToNextStep: () => void;
  goToQuiz: () => void;
  completeLesson: () => void;
  reset: () => void;
}

export function useLessonNavigation(
  options: UseLessonNavigationOptions
): UseLessonNavigationReturn {
  const { totalSteps, lessonId, onComplete } = options;
  const [phase, setPhase] = useState<LessonPhase>('learning');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 레슨이 바뀌면 상태 초기화
  useEffect(() => {
    setPhase('learning');
    setCurrentStepIndex(0);
  }, [lessonId]);

  const isLastStep = currentStepIndex === totalSteps - 1;
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < totalSteps - 1;

  const goToPrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, totalSteps]);

  const goToQuiz = useCallback(() => {
    setPhase('quiz');
  }, []);

  const completeLesson = useCallback(() => {
    onComplete?.();
    setPhase('completed');
  }, [onComplete]);

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
    completeLesson,
    reset,
  };
}
