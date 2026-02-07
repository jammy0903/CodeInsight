/**
 * AI Settings
 * Provider 설정 (현재 DeepSeek 전용)
 */

import { ProviderType } from './providers/types';

interface AISettings {
  currentProvider: ProviderType;
}

/**
 * 현재 설정 가져오기
 */
export function getSettings(): AISettings {
  return { currentProvider: 'deepseek' };
}

/**
 * 설정 업데이트 (호환성 유지)
 */
export function updateSettings(updates: Partial<AISettings>): AISettings {
  return { currentProvider: 'deepseek' };
}
