/**
 * useLessonAnalytics - 레슨 학습 분석 데이터 수집 hook
 *
 * WHY: 학습 분석을 위한 데이터 수집 로직을 LessonPage에서 분리
 * - 레슨 시작/종료 시 activity 기록
 * - 스텝별 체류 시간, 뒤로가기 등 행동 추적
 * - 세션 컨텍스트 (디바이스, 네트워크) 자동 수집
 */

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/stores/store';
import {
  startLessonActivity,
  endLessonActivity,
  endLessonActivityBeacon,
  collectSessionContext,
  saveSessionContext,
  saveStepActivities,
  type StepActivityData,
} from '@/services/analytics';
import { logger } from '@/utils/logger';

interface UseLessonAnalyticsOptions {
  lessonId: string | undefined;
  totalSteps: number;
  currentStepIndex: number;
  enabled?: boolean; // 로그인 안 된 경우 비활성화
}

interface StepData {
  startTime: number;
  duration: number;
  wentBack: boolean;
  visHoverCount: number;
  visClickCount: number;
  aiQuestionCount: number;
  codeSelections: number;
  scrollEvents: number;
}

export function useLessonAnalytics({
  lessonId,
  totalSteps,
  currentStepIndex,
  enabled = true,
}: UseLessonAnalyticsOptions) {
  // 로그인 상태
  const { appUser } = useStore();
  const isLoggedIn = !!appUser;
  const shouldTrack = enabled && isLoggedIn && !!lessonId;

  // Refs (리렌더 방지)
  const activityIdRef = useRef<string | null>(null);
  const stepDataRef = useRef<Map<number, StepData>>(new Map());
  const stepStartTimeRef = useRef<number>(Date.now());
  const prevStepIndexRef = useRef<number>(currentStepIndex);

  /**
   * 레슨 시작 - activity 생성 + 세션 컨텍스트 저장
   */
  const startTracking = useCallback(async () => {
    if (!shouldTrack || !lessonId) return;

    try {
      // 1. Activity 시작
      const activityId = await startLessonActivity(lessonId);
      if (!activityId) return;

      activityIdRef.current = activityId;

      // 2. 세션 컨텍스트 저장
      const context = collectSessionContext(activityId);
      await saveSessionContext(context);

      logger.info('[Analytics] Lesson tracking started:', {
        lessonId,
        activityId,
        context: {
          screen: `${context.screenWidth}x${context.screenHeight}`,
          inputMethod: context.inputMethod,
          timezone: context.timezone,
        },
      });
    } catch (err) {
      logger.error('[Analytics] Failed to start tracking:', err);
    }
  }, [shouldTrack, lessonId]);

  /**
   * 레슨 종료 - 스텝 데이터 저장 + activity 종료
   */
  const stopTracking = useCallback(
    async (useBeacon = false) => {
      if (!activityIdRef.current || !lessonId) return;

      const activityId = activityIdRef.current;

      try {
        // 1. 현재 스텝 duration 업데이트
        updateCurrentStepDuration();

        // 2. 모든 스텝 데이터 저장
        const activities: StepActivityData[] = [];
        stepDataRef.current.forEach((data, stepIndex) => {
          activities.push({
            lessonActivityId: activityId,
            lessonId: lessonId,
            stepIndex,
            duration: Math.round(data.duration / 1000), // ms → s
            wentBack: data.wentBack,
            visHoverCount: data.visHoverCount || undefined,
            visClickCount: data.visClickCount || undefined,
            aiQuestionCount: data.aiQuestionCount || undefined,
            codeSelections: data.codeSelections || undefined,
            scrollEvents: data.scrollEvents || undefined,
          });
        });

        if (activities.length > 0) {
          await saveStepActivities(activities);
        }

        // 3. Activity 종료
        if (useBeacon) {
          endLessonActivityBeacon(activityId);
        } else {
          await endLessonActivity(activityId);
        }

        logger.info('[Analytics] Lesson tracking stopped:', {
          lessonId,
          stepsTracked: activities.length,
        });
      } catch (err) {
        logger.error('[Analytics] Failed to stop tracking:', err);
      } finally {
        // 상태 초기화
        activityIdRef.current = null;
        stepDataRef.current.clear();
      }
    },
    [lessonId]
  );

  /**
   * 현재 스텝 duration 업데이트 (내부 함수)
   */
  const updateCurrentStepDuration = () => {
    const now = Date.now();
    const elapsed = now - stepStartTimeRef.current;
    const currentData = stepDataRef.current.get(prevStepIndexRef.current) || createEmptyStepData();
    currentData.duration += elapsed;
    stepDataRef.current.set(prevStepIndexRef.current, currentData);
    stepStartTimeRef.current = now;
  };

  /**
   * 빈 스텝 데이터 생성
   */
  const createEmptyStepData = (): StepData => ({
    startTime: Date.now(),
    duration: 0,
    wentBack: false,
    visHoverCount: 0,
    visClickCount: 0,
    aiQuestionCount: 0,
    codeSelections: 0,
    scrollEvents: 0,
  });

  // === 이벤트 기록 함수들 (Phase 1-2) ===

  const recordVisHover = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.visHoverCount++;
  }, [currentStepIndex]);

  const recordVisClick = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.visClickCount++;
  }, [currentStepIndex]);

  const recordAIQuestion = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.aiQuestionCount++;
  }, [currentStepIndex]);

  const recordCodeSelection = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.codeSelections++;
  }, [currentStepIndex]);

  const recordScroll = useCallback(() => {
    const data = stepDataRef.current.get(currentStepIndex);
    if (data) data.scrollEvents++;
  }, [currentStepIndex]);

  // === Effects ===

  // 레슨 시작 시 tracking 시작
  useEffect(() => {
    if (!shouldTrack) return;

    startTracking();

    // Cleanup: 페이지 이탈 시
    return () => {
      if (activityIdRef.current) {
        // sendBeacon 사용 (페이지 언로드에도 안전)
        stopTracking(true);
      }
    };
  }, [lessonId, shouldTrack, startTracking]);

  // 스텝 변경 시 duration 업데이트 + 뒤로가기 감지
  useEffect(() => {
    if (!shouldTrack) return;

    const prevIndex = prevStepIndexRef.current;

    // 스텝이 변경되었을 때만 처리
    if (prevIndex !== currentStepIndex) {
      // 이전 스텝 duration 저장
      updateCurrentStepDuration();

      // 뒤로가기 감지
      if (currentStepIndex < prevIndex) {
        const currentData =
          stepDataRef.current.get(currentStepIndex) || createEmptyStepData();
        currentData.wentBack = true;
        stepDataRef.current.set(currentStepIndex, currentData);
      }

      // 새 스텝 데이터 초기화 (없으면)
      if (!stepDataRef.current.has(currentStepIndex)) {
        stepDataRef.current.set(currentStepIndex, createEmptyStepData());
      }

      prevStepIndexRef.current = currentStepIndex;
      stepStartTimeRef.current = Date.now();
    }
  }, [currentStepIndex, shouldTrack]);

  // 페이지 visibility 변경 시 duration 일시 정지/재개
  useEffect(() => {
    if (!shouldTrack) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 탭 비활성화 → duration 일시 정지
        updateCurrentStepDuration();
      } else {
        // 탭 활성화 → 다시 시작
        stepStartTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [shouldTrack]);

  // beforeunload 시 데이터 저장 (백업)
  useEffect(() => {
    if (!shouldTrack) return;

    const handleBeforeUnload = () => {
      if (activityIdRef.current) {
        stopTracking(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldTrack, stopTracking]);

  return {
    // 수동 종료 (레슨 완료 시 호출)
    finishTracking: () => stopTracking(false),
    // 이벤트 기록 함수들 (Phase 1-2용)
    recordVisHover,
    recordVisClick,
    recordAIQuestion,
    recordCodeSelection,
    recordScroll,
    // 상태 (디버깅용)
    isTracking: !!activityIdRef.current,
  };
}
