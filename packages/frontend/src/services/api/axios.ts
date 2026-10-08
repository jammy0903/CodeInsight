/**
 * Axios 인스턴스 설정
 * - 기본 URL/타임아웃 설정
 * - 에러 처리 interceptor
 */

import axios from 'axios';
import { config } from '../../config';
import { handleAPIError } from '@/components/common/Toast/notifications';

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

// Response Interceptor: 에러는 toast
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const message = error.response?.data?.message;
      handleAPIError(status, message);
    }
    return Promise.reject(error);
  }
);
