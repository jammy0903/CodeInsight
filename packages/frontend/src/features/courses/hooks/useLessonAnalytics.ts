/**
 * useLessonAnalytics - 레슨 학습 분석 데이터 수집 hook (오케스트레이터)
 *
 * 서브 훅으로 로직 분리:
 *   - useStepTracking: 스텝별 체류 시간 + 이벤트 기록
 *   - useActivityTracking: 활동 시작/종료 + 세션 컨텍스트
 *   - useVisibilityTracking: 탭 포커스 감지 + beforeunload
 */

import { useEffect } from 'react';
import { useStore } from '@/stores/store';

import { useStepTracking } from './analytics/useStepTracking';
import { useActivityTracking } from './analytics/useActivityTracking';
import { useVisibilityTracking } from './analytics/useVisibilityTracking';

interface UseLessonAnalyticsOptions {
  lessonId: string | undefined;
  totalSteps: number;
  currentStepIndex: number;
  enabled?: boolean;
}

export function useLessonAnalytics({
  lessonId,
  totalSteps,
  currentStepIndex,
  enabled = true,
}: UseLessonAnalyticsOptions) {
  // 선택적 구독: appUser만 구독하여 불필요한 리렌더링 방지
  const appUser = useStore((state) => state.appUser);
  const isLoggedIn = !!appUser;
  const shouldTrack = enabled && isLoggedIn && !!lessonId;

  // 스텝 데이터 추적
  const {
    stepDataRef,
    stepStartTimeRef,
    updateCurrentStepDuration,
    handleStepChange,
    clearStepData,
    recordVisHover,
    recordVisClick,
    recordAIQuestion,
    recordCodeSelection,
    recordScroll,
  } = useStepTracking(currentStepIndex);

  // 활동 시작/종료
  const {
    activityIdRef,
    startTracking,
    stopTracking,
  } = useActivityTracking({
    lessonId,
    shouldTrack,
    stepDataRef,
    updateCurrentStepDuration,
    clearStepData,
  });

  // 탭 포커스 + beforeunload
  useVisibilityTracking({
    shouldTrack,
    updateCurrentStepDuration,
    stepStartTimeRef,
    activityIdRef,
    stopTracking,
  });

  // 레슨 시작 시 tracking 시작
  useEffect(() => {
    if (!shouldTrack) return;

    startTracking();

    return () => {
      if (activityIdRef.current) {
        stopTracking(true);
      }
    };
  }, [lessonId, shouldTrack, startTracking]);

  // 스텝 변경 시 duration 업데이트 + 뒤로가기 감지
  useEffect(() => {
    if (!shouldTrack) return;
    handleStepChange(currentStepIndex);
  }, [currentStepIndex, shouldTrack, handleStepChange]);

  return {
    finishTracking: () => stopTracking(false),
    recordVisHover,
    recordVisClick,
    recordAIQuestion,
    recordCodeSelection,
    recordScroll,
    isTracking: !!activityIdRef.current,
  };
}
