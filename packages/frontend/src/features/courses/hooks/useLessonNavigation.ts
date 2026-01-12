/**
 * useLessonNavigation - 레슨 학습 흐름 관리 (스텝 → 퀴즈 → 완료)
 *
 * WHY: useDayNavigation의 일반화 버전. Day/Lesson 둘 다 지원.
 * TRADEOFF: 별도 hook 생성 > 기존 hook 수정 (레거시 호환성 유지)
 * CHANGE: onStart, onStepChange 콜백 추가 - 진행 상태 저장 지원
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export type LessonPhase = 'learning' | 'quiz' | 'completed';

export interface UseLessonNavigationOptions {
  totalSteps: number;
  lessonId?: string; // 레슨 변경 감지용
  onStart?: () => void; // 레슨 시작 시 호출 (in_progress 저장)
  onStepChange?: (stepIndex: number) => void; // 스텝 변경 시 호출
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
  const { totalSteps, lessonId, onStart, onStepChange, onComplete } = options;
  const [phase, setPhase] = useState<LessonPhase>('learning');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const hasStartedRef = useRef(false);

  // 레슨이 바뀌면 상태 초기화 + 시작 콜백 호출
  useEffect(() => {
    setPhase('learning');
    setCurrentStepIndex(0);
    hasStartedRef.current = false;
  }, [lessonId]);

  // 레슨 시작 시 한 번만 onStart 호출
  useEffect(() => {
    if (totalSteps > 0 && lessonId && !hasStartedRef.current) {
      hasStartedRef.current = true;
      onStart?.();
    }
  }, [totalSteps, lessonId, onStart]);

  const isLastStep = currentStepIndex === totalSteps - 1;
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < totalSteps - 1;

  const goToPrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      onStepChange?.(newIndex);
    }
  }, [currentStepIndex, onStepChange]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      onStepChange?.(newIndex);
    }
  }, [currentStepIndex, totalSteps, onStepChange]);

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
