/**
 * useStreak
 * 스트릭 데이터 조회 및 관리 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { getStreak, type StreakStatus } from '@/services/gamification';
import { useStore } from '@/stores/store';
import { logger } from '@/utils/logger';

interface UseStreakResult {
  streak: StreakStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStreak(): UseStreakResult {
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { appUser } = useStore();

  const fetchStreak = useCallback(async () => {
    // 로그인 안 된 상태
    if (!appUser) {
      setStreak(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getStreak();
      setStreak(data);
    } catch (err) {
      logger.error('Failed to fetch streak:', err);
      setError('스트릭 정보를 불러올 수 없습니다');
      setStreak(null);
    } finally {
      setLoading(false);
    }
  }, [appUser]);

  // 초기 로드
  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak,
    loading,
    error,
    refresh: fetchStreak,
  };
}
