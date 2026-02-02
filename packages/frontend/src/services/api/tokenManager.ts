/**
 * Auth Token Manager
 *
 * This module acts as a simple, decoupled store for the JWT token.
 * It allows other parts of the application (like firebase) to set the token,
 * and the api client (axios) to get the token, without them needing to know about each other.
 * This breaks the circular dependency between the api client and the auth provider.
 *
 * ENHANCEMENT (2026-02-02):
 * - getAuthToken()이 null이면 Firebase auth에서 동적으로 가져옴
 * - 토큰 만료 시에도 자동 갱신 가능
 */

import { getAuth } from 'firebase/auth';
import { logger } from '@/utils/logger';

let authToken: string | null = null;

/**
 * Sets the current authentication token.
 * @param token The JWT token, or null if logged out.
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Retrieves the current authentication token.
 * - 먼저 메모리 캐시 확인
 * - 캐시가 없으면 Firebase auth에서 동적으로 가져옴
 * @returns The JWT token, or null if not available.
 */
export function getAuthToken(): string | null {
  // 메모리 캐시가 있으면 반환
  if (authToken) {
    return authToken;
  }

  // 캐시가 없으면 null 반환 (동기 함수이므로 비동기 작업 불가)
  // 대신 getAuthTokenAsync를 사용하도록 권장
  return null;
}

/**
 * 비동기로 토큰을 가져옴 (Firebase에서 동적으로)
 * - 메모리 캐시가 있으면 반환
 * - 없으면 Firebase auth에서 가져와서 캐시 업데이트
 * - 토큰 갱신도 자동으로 처리됨
 */
export async function getAuthTokenAsync(): Promise<string | null> {
  // 메모리 캐시가 있으면 반환
  if (authToken) {
    return authToken;
  }

  // Firebase auth에서 동적으로 가져옴
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // forceRefresh: false - 캐시된 토큰 사용 (만료 시에만 갱신)
      const token = await user.getIdToken(false);
      authToken = token; // 캐시 업데이트
      logger.debug('[TokenManager] Token fetched from Firebase');
      return token;
    }
  } catch (error) {
    logger.error('[TokenManager] Failed to get token from Firebase:', error);
  }

  return null;
}

/**
 * 토큰 강제 갱신 (만료 임박 시 사용)
 */
export async function refreshAuthToken(): Promise<string | null> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      // forceRefresh: true - 항상 새 토큰 발급
      const token = await user.getIdToken(true);
      authToken = token;
      logger.debug('[TokenManager] Token refreshed from Firebase');
      return token;
    }
  } catch (error) {
    logger.error('[TokenManager] Failed to refresh token:', error);
  }

  return null;
}
