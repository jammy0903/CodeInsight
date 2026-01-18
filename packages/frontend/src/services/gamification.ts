/**
 * Gamification Service
 * 스트릭 등 게이미피케이션 API 클라이언트
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { logger } from '@/utils/logger';

// =============================================
// Types
// =============================================

export interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: string | null;
  isActiveToday: boolean;
  streakAtRisk: boolean;
}

// =============================================
// API Endpoints
// =============================================

const ENDPOINTS = {
  streak: '/gamification/streak',
  streakCheck: '/gamification/streak/check',
  streakUpdate: '/gamification/streak/update',
};

// =============================================
// Streak API
// =============================================

/**
 * 현재 사용자 스트릭 조회
 */
export async function getStreak(): Promise<StreakStatus> {
  try {
    const response = await api.get<StreakStatus>(ENDPOINTS.streak);
    return response.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get streak:', error);
    throw error;
  }
}

/**
 * 스트릭 상태 확인 (at-risk 여부)
 */
export async function checkStreakStatus(): Promise<StreakStatus> {
  try {
    const response = await api.post<StreakStatus>(ENDPOINTS.streakCheck);
    return response.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to check streak status:', error);
    throw error;
  }
}

/**
 * 스트릭 업데이트 (수동, 테스트용)
 * 일반적으로 레슨 완료 시 자동 호출됨
 */
export async function updateStreak(): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastActiveAt: string | null;
}> {
  try {
    const response = await api.post(ENDPOINTS.streakUpdate);
    return response.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to update streak:', error);
    throw error;
  }
}
