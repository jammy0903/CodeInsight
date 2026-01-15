/**
 * Simulator Service - STUB
 * TODO: 다른 서버(58.227.56.154)에서 실제 파일 가져온 후 교체
 *
 * 현재는 빈 결과를 반환하는 스텁 코드입니다.
 */

import type { LessonStep } from '@/types';

export type SupportedLanguage = 'c' | 'python' | 'javascript';

interface SimulateOptions {
  code: string;
}

interface SimulateResult {
  success: boolean;
  steps: LessonStep[];
  error?: string;
}

/**
 * 지원 언어 체크 (스텁: 항상 false)
 */
export function isLanguageSupported(_language: string): boolean {
  // TODO: 실제 구현 후 true 반환
  console.warn('[Simulator STUB] isLanguageSupported called - returning false');
  return false;
}

/**
 * 시뮬레이션 서비스 (스텁)
 */
export const simulatorService = {
  async simulate(_language: SupportedLanguage, _options: SimulateOptions): Promise<SimulateResult> {
    console.warn('[Simulator STUB] simulate called - returning empty result');
    return {
      success: false,
      steps: [],
      error: '시뮬레이터가 아직 준비되지 않았습니다. (STUB)',
    };
  },
};
