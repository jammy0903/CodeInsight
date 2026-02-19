/**
 * useLessonNavigation - 레슨 학습 흐름 관리 (스텝 → 퀴즈 → 완료)
 *
 * WHY: useDayNavigation의 일반화 버전. Day/Lesson 둘 다 지원.
 * TRADEOFF: 별도 hook 생성 > 기존 hook 수정 (레거시 호환성 유지)
 * CHANGE: onStart, onStepChange 콜백 추가 - 진행 상태 저장 지원
 * CHANGE: lessonKey 기반 상태 관리로 lesson 전환 시 effect reset 제거
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { LessonStep } from '@/types';

export type LessonPhase = 'learning' | 'quiz' | 'completed';

export interface UseLessonNavigationOptions {
  totalSteps: number;
  lessonId?: string; // 레슨 변경 감지용
  code?: string; // deprecated: 빈 줄 감지 로직 제거로 미사용
  steps?: LessonStep[]; // deprecated: 빈 줄 감지 로직 제거로 미사용
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

interface NavigationState {
  lessonKey: string;
  phase: LessonPhase;
  currentStepIndex: number;
}

export function useLessonNavigation(
  options: UseLessonNavigationOptions
): UseLessonNavigationReturn {
  const { totalSteps, lessonId, onStart, onStepChange, onComplete } = options;
  const lessonKey = lessonId ?? '__default_lesson__';
  const [navigationState, setNavigationState] = useState<NavigationState>(() => ({
    lessonKey,
    phase: 'learning',
    currentStepIndex: 0,
  }));
  const hasStartedByLessonRef = useRef<Record<string, boolean>>({});

  const phase = navigationState.lessonKey === lessonKey ? navigationState.phase : 'learning';
  const currentStepIndex = navigationState.lessonKey === lessonKey
    ? navigationState.currentStepIndex
    : 0;

  const updateNavigation = useCallback((
    updater: (prev: Omit<NavigationState, 'lessonKey'>) => Omit<NavigationState, 'lessonKey'>
  ) => {
    setNavigationState((prev) => {
      const base = prev.lessonKey === lessonKey
        ? { phase: prev.phase, currentStepIndex: prev.currentStepIndex }
        : { phase: 'learning' as LessonPhase, currentStepIndex: 0 };
      const next = updater(base);
      return { lessonKey, ...next };
    });
  }, [lessonKey]);

  // 레슨 시작 시 한 번만 onStart 호출
  useEffect(() => {
    if (totalSteps <= 0 || !lessonId || hasStartedByLessonRef.current[lessonKey]) return;
    hasStartedByLessonRef.current[lessonKey] = true;
    onStart?.();
  }, [totalSteps, lessonId, lessonKey, onStart]);

  const isLastStep = currentStepIndex === totalSteps - 1;
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < totalSteps - 1;

  const goToPrevStep = useCallback(() => {
    if (currentStepIndex <= 0) return;
    const newIndex = currentStepIndex - 1;
    updateNavigation(() => ({
      phase: 'learning',
      currentStepIndex: newIndex,
    }));
    onStepChange?.(newIndex);
  }, [currentStepIndex, onStepChange, updateNavigation]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) return;
    const newIndex = currentStepIndex + 1;
    updateNavigation((prev) => ({
      ...prev,
      currentStepIndex: newIndex,
    }));
    onStepChange?.(newIndex);
  }, [currentStepIndex, totalSteps, onStepChange, updateNavigation]);

  const goToQuiz = useCallback(() => {
    updateNavigation((prev) => ({ ...prev, phase: 'quiz' }));
  }, [updateNavigation]);

  const completeLesson = useCallback(() => {
    onComplete?.();
    updateNavigation((prev) => ({ ...prev, phase: 'completed' }));
  }, [onComplete, updateNavigation]);

  const reset = useCallback(() => {
    updateNavigation(() => ({ phase: 'learning', currentStepIndex: 0 }));
  }, [updateNavigation]);

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
