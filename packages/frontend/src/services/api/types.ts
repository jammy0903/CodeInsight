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

/**
 * AI Provider 정보
 */
export interface AIProvider {
  type: 'deepseek';
  name: string;
  available: boolean;
  current: boolean;
}

/**
 * AI Provider 목록 응답
 */
export interface AIProvidersResponse {
  current: string;
  providers: AIProvider[];
}

/**
 * AI Provider 전환 요청
 */
export interface SwitchProviderRequest {
  provider: 'deepseek';
}

/**
 * AI Provider 전환 응답
 */
export interface SwitchProviderResponse {
  success: boolean;
  current: string;
  name: string;
}
