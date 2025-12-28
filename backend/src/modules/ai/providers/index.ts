/**
 * AI Provider Factory
 * 현재 설정된 provider를 반환
 */

import { IAIProvider, ProviderType } from './types';
import { DeepSeekProvider } from './deepseek.provider';
import { OllamaProvider } from './ollama.provider';
import { ClaudeCliProvider } from './claude-cli.provider';
import { getSettings, updateSettings } from '../settings';

// Singleton instances
const providers: Record<ProviderType, IAIProvider> = {
  'deepseek': new DeepSeekProvider(),
  'ollama': new OllamaProvider(),
  'claude-cli': new ClaudeCliProvider(),
};

/**
 * 현재 활성화된 provider 가져오기
 */
export function getCurrentProvider(): IAIProvider {
  const settings = getSettings();
  return providers[settings.currentProvider];
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
  const results = [];

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
