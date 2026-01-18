/**
 * Python Language Adapter
 *
 * PyTransformer + PyStyler + PyAnimator 통합
 */

import type { IFlowAdapter } from '../base/types';
import { PyTransformer, pyTransformer } from './PyTransformer';
import { PyStyler, pyStyler } from './PyStyler';
import { PyAnimator, pyAnimator } from './PyAnimator';

export { PyTransformer, pyTransformer } from './PyTransformer';
export { PyStyler, pyStyler } from './PyStyler';
export { PyAnimator, pyAnimator } from './PyAnimator';

/**
 * Python 언어 통합 어댑터
 */
export const pythonAdapter: IFlowAdapter = {
  language: 'python',
  transformer: pyTransformer,
  styler: pyStyler,
  animator: pyAnimator,
};

/**
 * Python 어댑터 팩토리 (테마 설정 가능)
 */
export function createPythonAdapter(theme: 'light' | 'dark' = 'light'): IFlowAdapter {
  const styler = new PyStyler(theme);
  return {
    language: 'python',
    transformer: new PyTransformer(),
    styler,
    animator: new PyAnimator(),
  };
}
