/**
 * AI Provider Factory
 * 현재 설정된 provider를 반환
 *
 * 지원 Provider:
 * - DeepSeek: 클라우드 API (유료, 스트리밍 지원)
 * - Ollama: 로컬 LLM (무료, 스트리밍 지원)
 */

import { IAIProvider, ProviderType } from './types';
import { DeepSeekProvider } from './deepseek.provider';
import { OllamaProvider } from './ollama.provider';
import { getSettings, updateSettings } from '../settings';

// Singleton instances
const providers: Record<ProviderType, IAIProvider> = {
  'deepseek': new DeepSeekProvider(),
  'ollama': new OllamaProvider(),
};

/**
 * 현재 활성화된 provider 가져오기
 * 현재 provider가 불가능하면 사용 가능한 다른 provider로 자동 폴백
 */
export async function getCurrentProvider(): Promise<IAIProvider> {
  const settings = getSettings();
  const current = providers[settings.currentProvider];

  if (await current.isAvailable()) {
    return current;
  }

  // 폴백: 다른 사용 가능한 provider 탐색
  for (const [type, provider] of Object.entries(providers)) {
    if (type !== settings.currentProvider && await provider.isAvailable()) {
      return provider;
    }
  }

  // 모든 provider 불가 시 설정된 provider 반환 (에러는 호출 시 발생)
  return current;
}

/**
 * 특정 provider 가져오기
 */
export function getProvider(type: ProviderType): IAIProvider {
  return providers[type];
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
  const settings = getSettings();
  const results: Array<{
    type: ProviderType;
    name: string;
    available: boolean;
    current: boolean;
  }> = [];

  for (const [type, provider] of Object.entries(providers)) {
    results.push({
      type: type as ProviderType,
      name: provider.name,
      available: await provider.isAvailable(),
      current: type === settings.currentProvider,
    });
  }

  return results;
}

/**
 * Provider 변경
 */
export async function setCurrentProvider(type: ProviderType): Promise<boolean> {
  const provider = providers[type];
  if (!provider) {
    throw new Error(`Unknown provider: ${type}`);
  }

  const available = await provider.isAvailable();
  if (!available) {
    throw new Error(`Provider ${type} is not available`);
  }

  updateSettings({ currentProvider: type });
  return true;
}

export * from './types';
