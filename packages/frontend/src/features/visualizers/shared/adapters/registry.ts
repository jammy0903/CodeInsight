/**
 * Adapter Registry
 *
 * 언어별 어댑터 관리
 * - 언어 이름으로 어댑터 조회
 * - 기본 어댑터 제공
 */

import type { FlowLanguage } from '@codeinsight/shared';
import type { IFlowAdapter } from './types';
import { cAdapter, createCAdapter } from '../../c/adapters';
import { pythonAdapter, createPythonAdapter } from '../../python/adapters';
import { javaAdapter, createJavaAdapter } from '../../java/adapters';
import { javascriptAdapter, createJavaScriptAdapter } from '../../javascript/adapters';

// Re-export all adapters
export { cAdapter, createCAdapter, CTransformer, CStyler, CAnimator } from '../../c/adapters';
export { pythonAdapter, createPythonAdapter, PyTransformer, PyStyler, PyAnimator } from '../../python/adapters';
export { javaAdapter, createJavaAdapter, JavaTransformer, JavaStyler, JavaAnimator } from '../../java/adapters';
export { javascriptAdapter, createJavaScriptAdapter, JSTransformer, JSStyler, JSAnimator } from '../../javascript/adapters';

// ============================================
// Adapter Registry
// ============================================

type Theme = 'light' | 'dark';

// 기본 어댑터 (light 테마)
const defaultAdapters: Record<string, IFlowAdapter> = {
  c: cAdapter,
  python: pythonAdapter,
  java: javaAdapter,
  javascript: javascriptAdapter,
};

/**
 * 언어별 어댑터 가져오기
 */
export function getAdapter(language: FlowLanguage | string): IFlowAdapter {
  const adapter = defaultAdapters[language];
  if (!adapter) {
    console.warn(`No adapter found for language: ${language}, falling back to C`);
    return defaultAdapters.c;
  }
  return adapter;
}

/**
 * 테마가 적용된 어댑터 생성
 */
export function createAdapter(language: FlowLanguage | string, theme: Theme = 'light'): IFlowAdapter {
  switch (language) {
    case 'c':
      return createCAdapter(theme);
    case 'python':
      return createPythonAdapter(theme);
    case 'java':
      return createJavaAdapter(theme);
    case 'javascript':
      return createJavaScriptAdapter(theme);
    default:
      console.warn(`No adapter factory for language: ${language}, falling back to C`);
      return createCAdapter(theme);
  }
}

/**
 * 지원되는 언어 목록
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(defaultAdapters);
}

/**
 * 언어 지원 여부 확인
 */
export function isLanguageSupported(language: string): boolean {
  return language in defaultAdapters;
}
