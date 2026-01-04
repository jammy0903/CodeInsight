/**
 * AI Settings
 * Provider 설정 저장/조회 (JSON 파일 기반)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ProviderType } from './providers/types';

interface AISettings {
  currentProvider: ProviderType;
  updatedAt: string;
}

const SETTINGS_FILE = join(__dirname, '../../../data/ai-settings.json');
const DEFAULT_SETTINGS: AISettings = {
  currentProvider: 'ollama', // 기본값: 로컬 Ollama
  updatedAt: new Date().toISOString(),
};

/**
 * 설정 파일 존재 확인 및 생성
 */
function ensureSettingsFile(): void {
  const dataDir = join(__dirname, '../../../data');

  // data 디렉토리 생성
  if (!existsSync(dataDir)) {
    const { mkdirSync } = require('fs');
    mkdirSync(dataDir, { recursive: true });
  }

  // 설정 파일 생성
  if (!existsSync(SETTINGS_FILE)) {
    writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  }
}

/**
 * 현재 설정 가져오기
 */
export function getSettings(): AISettings {
  ensureSettingsFile();

  try {
    const content = readFileSync(SETTINGS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * 설정 업데이트
 */
export function updateSettings(updates: Partial<AISettings>): AISettings {
  ensureSettingsFile();

  const current = getSettings();
  const newSettings: AISettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
  return newSettings;
}
