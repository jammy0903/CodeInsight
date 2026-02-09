/**
 * Axios 인스턴스 설정
 * - 인증 토큰 자동 추가 (동기적 캐시 읽기)
 * - 기본 URL/타임아웃 설정
 * - 에러 처리 interceptor
 *
 * WHY 동기적 토큰 읽기:
 * - AuthProvider(상위 컨텍스트)가 onAuthStateChanged → setAuthToken()으로 토큰 관리
 * - 인터셉터는 캐시만 읽으면 됨 → 공개 API 즉시 발송, Firebase 중복 호출 제거
 */

import axios from 'axios';
import { config } from '../../config';
import { logger } from '@/utils/logger';
import { getAuthToken } from './tokenManager';

// API 기본 URL (버전 포함)
const BASE_URL = config.api.baseUrl;

// axios 인스턴스 생성
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60초
});

// Request Interceptor: 인증 토큰 자동 추가 (동기적 캐시 읽기)
api.interceptors.request.use(
  (config) => {
    // AuthProvider가 관리하는 캐시에서 동기적으로 토큰 읽기
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error('Request interceptor error:', error);
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


