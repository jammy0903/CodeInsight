/**
 * C++ Language Adapter
 *
 * CppTransformer + CppStyler + CppAnimator 통합
 */

import type { IFlowAdapter } from '../../shared/adapters/types';
import { CppTransformer, cppTransformer } from './CppTransformer';
import { CppStyler, cppStyler } from './CppStyler';
import { CppAnimator, cppAnimator } from './CppAnimator';

export { CppTransformer, cppTransformer } from './CppTransformer';
export { CppStyler, cppStyler } from './CppStyler';
export { CppAnimator, cppAnimator } from './CppAnimator';

/**
 * C++ 언어 통합 어댑터
 */
export const cppAdapter: IFlowAdapter = {
  language: 'cpp',
  transformer: cppTransformer,
  styler: cppStyler,
  animator: cppAnimator,
};

/**
 * C++ 어댑터 팩토리 (테마 설정 가능)
 */
export function createCppAdapter(theme: 'light' | 'dark' = 'light'): IFlowAdapter {
  return {
    language: 'cpp',
    transformer: new CppTransformer(),
    styler: new CppStyler(theme),
    animator: new CppAnimator(),
  };
}
