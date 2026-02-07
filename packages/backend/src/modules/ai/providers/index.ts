/**
 * AI Provider Factory
 *
 * 지원 Provider:
 * - DeepSeek: 클라우드 API (유료, 스트리밍 지원)
 */

import { IAIProvider, ProviderType } from './types';
import { DeepSeekProvider } from './deepseek.provider';

// Singleton instance
const provider = new DeepSeekProvider();

/**
 * 현재 활성화된 provider 가져오기
 */
export async function getCurrentProvider(): Promise<IAIProvider> {
  return provider;
}

/**
 * 특정 provider 가져오기
 */
export function getProvider(type: ProviderType): IAIProvider {
  return provider;
}

/**
 * 모든 provider 목록 (상태 포함)
 */
export async function getAllProviders(): Promise<Array<{
  type: ProviderType;
  name: string;
  available: boolean;
  current: boolean;
}>> {
  return [{
    type: 'deepseek',
    name: provider.name,
    available: await provider.isAvailable(),
    current: true,
  }];
}

/**
 * Provider 변경 (현재 DeepSeek만 지원)
 */
export async function setCurrentProvider(type: ProviderType): Promise<boolean> {
  if (type !== 'deepseek') {
    throw new Error(`Unknown provider: ${type}`);
  }

  const available = await provider.isAvailable();
  if (!available) {
    throw new Error('DeepSeek provider is not available');
  }

  return true;
}

export * from './types';
