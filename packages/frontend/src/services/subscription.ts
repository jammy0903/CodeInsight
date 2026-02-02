/**
 * Subscription API Service
 * 구독 관리 API 호출
 */

import { api } from './api/axios';
import { handleError } from './api/errors';

// 구독 플랜 타입
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  monthlyTokenLimit: number | null;
  dailyTokenLimit: number | null;
  features: string[];
  isActive: boolean;
}

// 사용자 구독 정보
export interface UserSubscription {
  planId: string;
  planName: string;
  status: string;
  monthlyTokenLimit: number | null;
  dailyTokenLimit: number | null;
  currentMonthUsage: number;
  currentDayUsage: number;
  features: string[];
}

// 사용량 정보
export interface UsageInfo {
  plan: {
    id: string;
    name: string;
  };
  limits: {
    monthly: number | null;
    daily: number | null;
  };
  usage: {
    monthly: number;
    daily: number;
  };
  remaining: {
    monthly: number | null;
    daily: number | null;
  };
  allowed: boolean;
  reason?: string;
}

/**
 * 구독 플랜 목록 조회
 */
export async function getPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await api.get<SubscriptionPlan[]>('/subscription/plans');
    return response.data;
  } catch (err) {
    const error = handleError(err);
    throw new Error(`플랜 목록을 불러올 수 없습니다: ${error.message}`);
  }
}

/**
 * 내 구독 정보 조회
 */
export async function getMySubscription(): Promise<UserSubscription> {
  try {
    const response = await api.get<UserSubscription>('/subscription/me');
    return response.data;
  } catch (err) {
    const error = handleError(err);
    throw new Error(`구독 정보를 불러올 수 없습니다: ${error.message}`);
  }
}

/**
 * 내 사용량 조회
 */
export async function getMyUsage(): Promise<UsageInfo> {
  try {
    const response = await api.get<UsageInfo>('/subscription/usage');
    return response.data;
  } catch (err) {
    const error = handleError(err);
    throw new Error(`사용량 정보를 불러올 수 없습니다: ${error.message}`);
  }
}

/**
 * 구독 취소
 */
export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await api.post<{ success: boolean; message: string }>('/subscription/cancel');
    return response.data;
  } catch (err) {
    const error = handleError(err);
    throw new Error(`구독 취소에 실패했습니다: ${error.message}`);
  }
}

// 챕터 접근 체크 결과
export interface ChapterAccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * 챕터 접근 권한 체크
 * - 비로그인: 챕터 1만
 * - 로그인 무료: 챕터 1-2
 * - 유료 구독: 전체
 */
export async function checkChapterAccess(chapterOrder: number): Promise<ChapterAccessResult> {
  try {
    const response = await api.get<ChapterAccessResult>(`/subscription/chapter-access/${chapterOrder}`);
    return response.data;
  } catch (err) {
    // API 실패 시 기본 제한 적용
    if (chapterOrder >= 3) {
      return { allowed: false, reason: '챕터 3 이상은 유료 구독이 필요합니다.' };
    }
    if (chapterOrder >= 2) {
      return { allowed: false, reason: '챕터 2 이상은 로그인이 필요합니다.' };
    }
    return { allowed: true };
  }
}
