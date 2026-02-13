/**
 * JavaScript Language Adapter
 *
 * JSTransformer + JSStyler + JSAnimator 통합
 */

import type { IFlowAdapter } from '../../shared/adapters/types';
import { JSTransformer, jsTransformer } from './JSTransformer';
import { JSStyler, jsStyler } from './JSStyler';
import { JSAnimator, jsAnimator } from './JSAnimator';

export { JSTransformer, jsTransformer } from './JSTransformer';
export { JSStyler, jsStyler } from './JSStyler';
export { JSAnimator, jsAnimator } from './JSAnimator';

/**
 * JavaScript 언어 통합 어댑터
 */
export const javascriptAdapter: IFlowAdapter = {
  language: 'javascript',
  transformer: jsTransformer,
  styler: jsStyler,
  animator: jsAnimator,
};

/**
 * JavaScript 어댑터 팩토리 (테마 설정 가능)
 */
export function createJavaScriptAdapter(theme: 'light' | 'dark' = 'light'): IFlowAdapter {
  const styler = new JSStyler(theme);
  return {
    language: 'javascript',
    transformer: new JSTransformer(),
    styler,
    animator: new JSAnimator(),
  };
}
