/**
 * useActivityTracking — 레슨 활동 시작/종료 + 세션 컨텍스트
 */

import { useRef, useCallback } from 'react';
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
import type { StepData } from './useStepTracking';

interface UseActivityTrackingOptions {
  lessonId: string | undefined;
  shouldTrack: boolean;
  stepDataRef: React.RefObject<Map<number, StepData>>;
  updateCurrentStepDuration: () => void;
  clearStepData: () => void;
}

export function useActivityTracking({
  lessonId,
  shouldTrack,
  stepDataRef,
  updateCurrentStepDuration,
  clearStepData,
}: UseActivityTrackingOptions) {
  const activityIdRef = useRef<string | null>(null);

  const startTracking = useCallback(async () => {
    if (!shouldTrack || !lessonId) return;

    try {
      const activityId = await startLessonActivity(lessonId);
      if (!activityId) return;

      activityIdRef.current = activityId;

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

  const stopTracking = useCallback(
    async (useBeacon = false) => {
      if (!activityIdRef.current || !lessonId) return;

      const activityId = activityIdRef.current;

      try {
        updateCurrentStepDuration();

        const activities: StepActivityData[] = [];
        stepDataRef.current.forEach((data, stepIndex) => {
          activities.push({
            lessonActivityId: activityId,
            lessonId: lessonId,
            stepIndex,
            duration: Math.round(data.duration / 1000),
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
        activityIdRef.current = null;
        clearStepData();
      }
    },
    [lessonId, stepDataRef, updateCurrentStepDuration, clearStepData]
  );

  return {
    activityIdRef,
    startTracking,
    stopTracking,
  };
}
