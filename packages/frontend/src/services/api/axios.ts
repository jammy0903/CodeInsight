/**
 * Axios 인스턴스 설정
 * - 인증 토큰 자동 추가
 * - 기본 URL/타임아웃 설정
 * - 에러 처리 interceptor
 */

import axios from 'axios';
import { auth, waitForAuth } from '../firebase';
import { config } from '../../config';

// API 기본 URL (버전 포함)
const BASE_URL = config.api.baseUrl;

// 환경별 로거 (프로덕션에서는 민감 정보 출력 안 함)
const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log('[axios]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn('[axios]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    // 에러는 항상 출력 (디버깅 필요)
    console.error('[axios]', ...args);
  },
};

// axios 인스턴스 생성
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 인증 토큰 자동 추가
api.interceptors.request.use(
  async (config) => {
    try {
      // Auth 초기화 완료 대기 (첫 요청 시에만 실제로 대기)
      const authUser = await waitForAuth();
      logger.log('waitForAuth result:', authUser?.email);

      const user = auth.currentUser;
      logger.log('currentUser:', user?.email);

      if (user) {
        const token = await user.getIdToken();
        logger.log('Token obtained');
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        logger.warn('No user - unauthenticated request');
      }
    } catch (error) {
      logger.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 에러 처리는 errors.ts에서
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // errors.ts의 handleError로 위임
    return Promise.reject(error);
  }
);

export default api;
