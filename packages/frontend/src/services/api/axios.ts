/**
 * Axios 인스턴스 설정
 * - 인증 토큰 자동 추가
 * - 기본 URL/타임아웃 설정
 * - 에러 처리 interceptor
 */

import axios from 'axios';
import { auth, waitForAuth } from '../firebase';
import { config } from '../../config';
import { logger } from '@/utils/logger';

// API 기본 URL (버전 포함)
const BASE_URL = config.api.baseUrl;

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
      await waitForAuth();

      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
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
