/**
 * Axios 인스턴스 설정
 * - 인증 토큰 자동 추가
 * - 기본 URL/타임아웃 설정
 * - 에러 처리 interceptor
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
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 인증 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 이 에러는 요청을 보내기 전에 발생하는 에러 (네트워크 문제 등)
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

export default api;
