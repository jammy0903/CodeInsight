/**
 * useLessonNavigation - 레슨 학습 흐름 관리 (스텝 → 퀴즈 → 완료)
 *
 * WHY: useDayNavigation의 일반화 버전. Day/Lesson 둘 다 지원.
 * TRADEOFF: 별도 hook 생성 > 기존 hook 수정 (레거시 호환성 유지)
 * CHANGE: onStart, onStepChange 콜백 추가 - 진행 상태 저장 지원
 * CHANGE: 빈 줄 자동 스킵 기능 추가 - 모든 언어 공통 적용
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { LessonStep } from '@/types';

export type LessonPhase = 'learning' | 'quiz' | 'completed';

export interface UseLessonNavigationOptions {
  totalSteps: number;
  lessonId?: string; // 레슨 변경 감지용
  code?: string; // 빈 줄 감지용 원본 코드
  steps?: LessonStep[]; // 빈 줄 감지용 스텝 배열
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

/**
 * 특정 스텝이 빈 줄인지 확인
 *
 * NOTE: 이 기능은 레슨 JSON에서 모든 스텝이 유효한 코드 라인을 가리키므로
 * 비활성화됨. 빈 줄 스킵이 필요하면 JSON 작성 시 해당 스텝을 제외해야 함.
 */
function isEmptyLineStep(
  _stepIndex: number,
  _steps: LessonStep[] | undefined,
  _code: string | undefined
): boolean {
  // 빈 줄 스킵 기능 비활성화 - 모든 스텝 실행
  return false;
}

/**
 * 빈 줄을 스킵하여 다음 유효한 스텝 인덱스 찾기
 * @param startIndex 시작 인덱스
 * @param direction 1 (forward) or -1 (backward)
 * @param steps 스텝 배열
 * @param code 원본 코드
 * @param totalSteps 총 스텝 수
 * @returns 다음 유효한 스텝 인덱스 (없으면 경계값 반환)
 */
function findNextNonEmptyStep(
  startIndex: number,
  direction: 1 | -1,
  steps: LessonStep[] | undefined,
  code: string | undefined,
  totalSteps: number
): number {
  let index = startIndex;
  const maxIterations = totalSteps; // 무한 루프 방지

  for (let i = 0; i < maxIterations; i++) {
    if (index < 0) return 0;
    if (index >= totalSteps) return totalSteps - 1;

    if (!isEmptyLineStep(index, steps, code)) {
      return index;
    }

    index += direction;
  }

  // 모든 줄이 빈 줄인 경우 원래 인덱스 반환
  return startIndex;
}

export function useLessonNavigation(
  options: UseLessonNavigationOptions
): UseLessonNavigationReturn {
  const { totalSteps, lessonId, code, steps, onStart, onStepChange, onComplete } = options;
  const [phase, setPhase] = useState<LessonPhase>('learning');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const hasStartedRef = useRef(false);
  const initialSkipDoneRef = useRef(false);

  // 레슨이 바뀌면 상태 초기화 + 시작 콜백 호출
  useEffect(() => {
    setPhase('learning');
    setCurrentStepIndex(0);
    hasStartedRef.current = false;
    initialSkipDoneRef.current = false;
  }, [lessonId]);

  // 초기 로드 시 첫 스텝이 빈 줄이면 자동으로 다음 유효한 스텝으로 이동
  useEffect(() => {
    if (initialSkipDoneRef.current || !steps || !code || totalSteps === 0) return;

    const firstNonEmptyIndex = findNextNonEmptyStep(0, 1, steps, code, totalSteps);
    if (firstNonEmptyIndex !== 0) {
      setCurrentStepIndex(firstNonEmptyIndex);
      onStepChange?.(firstNonEmptyIndex);
    }
    initialSkipDoneRef.current = true;
  }, [steps, code, totalSteps, onStepChange]);

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
      // 빈 줄 스킵: 이전 유효한 스텝 찾기
      const candidateIndex = currentStepIndex - 1;
      const newIndex = findNextNonEmptyStep(candidateIndex, -1, steps, code, totalSteps);

      if (newIndex !== currentStepIndex) {
        setCurrentStepIndex(newIndex);
        // 퀴즈/완료 상태에서 이전 스텝으로 가면 학습 모드로 전환
        setPhase('learning');
        onStepChange?.(newIndex);
      }
    }
  }, [currentStepIndex, steps, code, totalSteps, onStepChange]);

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      // 빈 줄 스킵: 다음 유효한 스텝 찾기
      const candidateIndex = currentStepIndex + 1;
      const newIndex = findNextNonEmptyStep(candidateIndex, 1, steps, code, totalSteps);

      if (newIndex !== currentStepIndex) {
        setCurrentStepIndex(newIndex);
        onStepChange?.(newIndex);
      }
    }
  }, [currentStepIndex, steps, code, totalSteps, onStepChange]);

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
