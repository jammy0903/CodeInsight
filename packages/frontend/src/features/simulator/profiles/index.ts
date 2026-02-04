/**
 * Profile Registry
 *
 * 언어 식별자로 프로파일을 조회한다.
 * 새 언어 추가 시 여기에 프로파일을 등록.
 */

import type { LanguageProfile } from './types';
import type { Language } from '../engine/types';
import { cProfile } from './c';
import { pythonProfile } from './python';
import { javaProfile } from './java';
import { javascriptProfile } from './javascript';

const profiles: Record<Language, LanguageProfile> = {
  c: cProfile,
  python: pythonProfile,
  java: javaProfile,
  javascript: javascriptProfile,
};

/** 언어에 해당하는 프로파일 반환 */
export function getProfile(lang: Language): LanguageProfile {
  const profile = profiles[lang];
  if (!profile) {
    throw new Error(`Unknown language: ${lang}`);
  }
  return profile;
}

/** 등록된 모든 언어 목록 */
export function getSupportedLanguages(): Language[] {
  return Object.keys(profiles) as Language[];
}

export type { LanguageProfile, ModuleConfig, VariableModel, ModulePosition } from './types';
