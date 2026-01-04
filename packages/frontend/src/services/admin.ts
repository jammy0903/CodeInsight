/**
 * Admin API Service
 * AI Provider 관리 및 관리자 기능
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';
import type {
  AIProvidersResponse,
  SwitchProviderRequest,
  SwitchProviderResponse,
} from './api/types';

/**
 * 사용 가능한 AI Provider 목록 조회
 */
export async function getAIProviders(): Promise<AIProvidersResponse> {
  try {
    const response = await api.get<AIProvidersResponse>(
      `${config.api.endpoints.aiProviders}`
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);
    throw new Error(`Provider 목록을 불러올 수 없습니다: ${error.message}`);
  }
}

/**
 * AI Provider 전환
 */
export async function switchAIProvider(
  provider: SwitchProviderRequest['provider']
): Promise<SwitchProviderResponse> {
  try {
    const response = await api.post<SwitchProviderResponse>(
      `${config.api.endpoints.aiProviders}/switch`,
      { provider }
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);

    // Provider가 사용 불가능한 경우
    if (error.status === 400) {
      throw new Error(`${provider}를 사용할 수 없습니다. 설정을 확인해주세요.`);
    }

    throw new Error(`Provider 전환 실패: ${error.message}`);
  }
}
