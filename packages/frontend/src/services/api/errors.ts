/**
 * API 에러 처리
 * - 커스텀 APIError 클래스
 * - handleError: axios 에러를 APIError로 변환
 */

import { AxiosError } from 'axios';

/**
 * API 에러 클래스
 */
export class APIError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * axios 에러를 APIError로 변환
 */
export function handleError(error: unknown): APIError {
  // axios 에러인 경우
  if (error instanceof AxiosError) {
    const response = error.response;

    // 서버 응답이 있는 경우
    if (response) {
      const status = response.status;
      const data = response.data;

      switch (status) {
        case 400:
          return new APIError(
            400,
            data.code || 'BAD_REQUEST',
            data.message || '잘못된 요청입니다',
            data.details
          );

        case 401:
          return new APIError(
            401,
            'UNAUTHORIZED',
            '로그인이 필요합니다'
          );

        case 402:
          return new APIError(
            402,
            'INSUFFICIENT_BALANCE',
            'API 크레딧이 부족합니다'
          );

        case 403:
          return new APIError(
            403,
            'FORBIDDEN',
            '권한이 없습니다'
          );

        case 404:
          return new APIError(
            404,
            'NOT_FOUND',
            '요청한 리소스를 찾을 수 없습니다'
          );

        case 429:
          return new APIError(
            429,
            'RATE_LIMIT',
            '요청이 너무 많습니다. 잠시 후 다시 시도해주세요'
          );

        case 500:
          return new APIError(
            500,
            'INTERNAL_SERVER_ERROR',
            data.message || '서버 오류가 발생했습니다'
          );

        case 503:
          return new APIError(
            503,
            'SERVICE_UNAVAILABLE',
            'AI 서비스를 사용할 수 없습니다'
          );

        default:
          return new APIError(
            status,
            'UNKNOWN_ERROR',
            data.message || '알 수 없는 오류가 발생했습니다',
            data
          );
      }
    }

    // 네트워크 에러 (서버 응답 없음)
    if (error.request) {
      return new APIError(
        0,
        'NETWORK_ERROR',
        '서버에 연결할 수 없습니다. 네트워크를 확인해주세요'
      );
    }
  }

  // 기타 에러
  return new APIError(
    0,
    'UNKNOWN_ERROR',
    error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
  );
}
