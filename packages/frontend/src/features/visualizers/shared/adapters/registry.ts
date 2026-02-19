/**
 * Adapter Registry
 *
 * 언어별 어댑터 관리
 * - 언어 이름으로 어댑터 조회
 * - 기본 어댑터 제공
 */

import type { FlowLanguage } from '@codeinsight/shared';
import type { IFlowAdapter } from './types';
import { createCAdapter } from '../../c/adapters';
import { createPythonAdapter } from '../../python/adapters';
import { createJavaAdapter } from '../../java/adapters';
import { createJavaScriptAdapter } from '../../javascript/adapters';

// ============================================
// Adapter Registry
// ============================================

type Theme = 'light' | 'dark';

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
