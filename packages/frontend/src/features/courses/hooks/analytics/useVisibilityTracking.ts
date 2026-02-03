/**
 * useVisibilityTracking — 탭 포커스 감지 + beforeunload 처리
 */

import { useEffect } from 'react';

interface UseVisibilityTrackingOptions {
  shouldTrack: boolean;
  updateCurrentStepDuration: () => void;
  stepStartTimeRef: React.RefObject<number>;
  activityIdRef: React.RefObject<string | null>;
  stopTracking: (useBeacon?: boolean) => Promise<void>;
}

export function useVisibilityTracking({
  shouldTrack,
  updateCurrentStepDuration,
  stepStartTimeRef,
  activityIdRef,
  stopTracking,
}: UseVisibilityTrackingOptions) {
  // 페이지 visibility 변경 시 duration 일시 정지/재개
  useEffect(() => {
    if (!shouldTrack) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateCurrentStepDuration();
      } else {
        (stepStartTimeRef as React.MutableRefObject<number>).current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [shouldTrack, updateCurrentStepDuration, stepStartTimeRef]);

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
  }, [shouldTrack, activityIdRef, stopTracking]);
}
