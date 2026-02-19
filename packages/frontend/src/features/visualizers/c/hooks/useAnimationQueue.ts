/**
 * useAnimationQueue Hook
 *
 * 애니메이션 순차 실행을 위한 큐 시스템
 * - 동시 애니메이션 충돌 방지
 * - delay 기준 그룹화하여 순차/병렬 실행
 *
 * ⚠️ 설계 의도 (2026-01-18):
 * play() 함수는 의존성 배열이 비어있음 ([]).
 * 이전에 [queue]에 의존했더니 무한 루프 발생:
 *   addBatch → queue 변경 → play 재생성 → useEffect 재실행 → 무한 루프
 *
 * 해결: queueRef를 사용하여 현재 queue 값을 읽음 (의존성에서 제외)
 * → play()는 안정적인 참조 유지, 무한 루프 방지
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { FlowAnimation } from '@codeinsight/shared';

interface QueuedAnimation {
  id: string;
  animation: FlowAnimation;
  status: 'pending' | 'playing' | 'completed';
}

interface UseAnimationQueueReturn {
  /** 현재 큐에 있는 애니메이션들 */
  queue: QueuedAnimation[];
  /** 재생 중인지 여부 */
  isPlaying: boolean;
  /** 단일 애니메이션 추가 */
  add: (animation: FlowAnimation) => void;
  /** 여러 애니메이션 동시 추가 (같은 시점에 실행) */
  addBatch: (animations: FlowAnimation[]) => void;
  /** 큐 실행 시작 */
  play: () => Promise<void>;
  /** 큐 비우기 */
  clear: () => void;
  /** 현재 재생 중인 애니메이션 ID들 */
  playingIds: string[];
}

/**
 * delay 기준으로 애니메이션 그룹화
 */
function groupByDelay(
  items: QueuedAnimation[]
): Map<number, QueuedAnimation[]> {
  const groups = new Map<number, QueuedAnimation[]>();

  items.forEach((item) => {
    const delay = item.animation.delay ?? 0;
    const existing = groups.get(delay) || [];
    groups.set(delay, [...existing, item]);
  });

  return groups;
}

/**
 * 단일 애니메이션 실행 (Promise로 래핑)
 */
function playAnimation(animation: FlowAnimation): Promise<void> {
  return new Promise((resolve) => {
    // duration 후 완료
    const duration = animation.duration ?? 300;
    setTimeout(resolve, duration);
  });
}

export function useAnimationQueue(): UseAnimationQueueReturn {
  const [queue, setQueue] = useState<QueuedAnimation[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIds, setPlayingIds] = useState<string[]>([]);
  const playingRef = useRef(false);
  const queueRef = useRef<QueuedAnimation[]>([]);

  // Keep queueRef in sync with queue state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  /**
   * 단일 애니메이션 추가
   */
  const add = useCallback((animation: FlowAnimation) => {
    const id = animation.id || crypto.randomUUID();
    setQueue((prev) => [
      ...prev,
      {
        id,
        animation: { ...animation, id },
        status: 'pending',
      },
    ]);
  }, []);

  /**
   * 여러 애니메이션 동시 추가 (같은 시점에 실행될 애니메이션들)
   */
  const addBatch = useCallback((animations: FlowAnimation[]) => {
    const batched = animations.map((a) => {
      const id = a.id || crypto.randomUUID();
      return {
        id,
        animation: { ...a, id },
        status: 'pending' as const,
      };
    });
    setQueue((prev) => [...prev, ...batched]);
  }, []);

  /**
   * 큐 실행
   * Note: Uses queueRef instead of queue to avoid dependency issues
   */
  const play = useCallback(async () => {
    // 이미 재생 중이면 무시
    if (playingRef.current) return;
    playingRef.current = true;
    setIsPlaying(true);

    // delay 기준으로 그룹화 (ref에서 현재 queue 읽기)
    const currentQueue = queueRef.current;
    const grouped = groupByDelay(currentQueue);
    const sortedDelays = Array.from(grouped.keys()).sort((a, b) => a - b);

    for (const delay of sortedDelays) {
      const group = grouped.get(delay) || [];

      // 이 그룹의 애니메이션들을 playing 상태로 변경
      const groupIds = group.map((item) => item.id);
      setPlayingIds(groupIds);
      setQueue((prev) =>
        prev.map((item) =>
          groupIds.includes(item.id) ? { ...item, status: 'playing' } : item
        )
      );

      // 그룹 내 애니메이션들 병렬 실행
      await Promise.all(group.map((item) => playAnimation(item.animation)));

      // 완료 상태로 변경
      setQueue((prev) =>
        prev.map((item) =>
          groupIds.includes(item.id) ? { ...item, status: 'completed' } : item
        )
      );
    }

    // 정리
    setPlayingIds([]);
    setIsPlaying(false);
    playingRef.current = false;
    setQueue([]);
  }, []); // No dependencies - uses refs for current values

  /**
   * 큐 비우기
   */
  const clear = useCallback(() => {
    setQueue([]);
    setPlayingIds([]);
    setIsPlaying(false);
    playingRef.current = false;
  }, []);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      queue,
      isPlaying,
      add,
      addBatch,
      play,
      clear,
      playingIds,
    }),
    [queue, isPlaying, add, addBatch, play, clear, playingIds]
  );
}
