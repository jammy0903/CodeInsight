/**
 * C Language Adapter
 *
 * CTransformer + CStyler + CAnimator 통합
 */

import type { IFlowAdapter } from '../../shared/adapters/types';
import { CTransformer, cTransformer } from './CTransformer';
import { CStyler, cStyler } from './CStyler';
import { CAnimator, cAnimator } from './CAnimator';

export { CTransformer, cTransformer } from './CTransformer';
export { CStyler, cStyler } from './CStyler';
export { CAnimator, cAnimator } from './CAnimator';
export { CMemoryAdapter } from './CMemoryAdapter';

/**
 * C 언어 통합 어댑터
 */
export const cAdapter: IFlowAdapter = {
  language: 'c',
  transformer: cTransformer,
  styler: cStyler,
  animator: cAnimator,
};

/**
 * C 어댑터 팩토리 (테마 설정 가능)
 */
export function createCAdapter(theme: 'light' | 'dark' = 'light'): IFlowAdapter {
  const styler = new CStyler(theme);
  return {
    language: 'c',
    transformer: new CTransformer(),
    styler,
    animator: new CAnimator(),
  };
}
