/**
 * 공통 API 타입
 */

/**
 * 표준 API 응답
 */
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}
