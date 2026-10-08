/**
 * API 에러 처리
 * - 커스텀 APIError 클래스
 * - handleError: axios 에러를 APIError로 변환
 */

import i18n from 'i18next';
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
            data.message || i18n.t('errors.bad_request'),
            data.details
          );

        case 403:
          return new APIError(
            403,
            'FORBIDDEN',
            i18n.t('errors.forbidden')
          );

        case 404:
          return new APIError(
            404,
            'NOT_FOUND',
            i18n.t('errors.not_found')
          );

        case 429:
          return new APIError(
            429,
            'RATE_LIMIT',
            i18n.t('errors.rate_limit')
          );

        case 500:
          return new APIError(
            500,
            'INTERNAL_SERVER_ERROR',
            data.message || i18n.t('errors.server')
          );

        case 503:
          return new APIError(
            503,
            'SERVICE_UNAVAILABLE',
            i18n.t('errors.service_unavailable')
          );

        default:
          return new APIError(
            status,
            'UNKNOWN_ERROR',
            data.message || i18n.t('errors.unknown'),
            data
          );
      }
    }

    // 네트워크 에러 (서버 응답 없음)
    if (error.request) {
      return new APIError(
        0,
        'NETWORK_ERROR',
        i18n.t('errors.network')
      );
    }
  }

  // 기타 에러
  return new APIError(
    0,
    'UNKNOWN_ERROR',
    error instanceof Error ? error.message : i18n.t('errors.unknown')
  );
}
