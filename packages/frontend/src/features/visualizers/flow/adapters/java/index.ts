/**
 * Java Language Adapter
 *
 * JavaTransformer + JavaStyler + JavaAnimator 통합
 */

import type { IFlowAdapter } from '../base/types';
import { JavaTransformer, javaTransformer } from './JavaTransformer';
import { JavaStyler, javaStyler } from './JavaStyler';
import { JavaAnimator, javaAnimator } from './JavaAnimator';

export { JavaTransformer, javaTransformer } from './JavaTransformer';
export { JavaStyler, javaStyler } from './JavaStyler';
export { JavaAnimator, javaAnimator } from './JavaAnimator';

/**
 * Java 언어 통합 어댑터
 */
export const javaAdapter: IFlowAdapter = {
  language: 'java',
  transformer: javaTransformer,
  styler: javaStyler,
  animator: javaAnimator,
};

/**
 * Java 어댑터 팩토리 (테마 설정 가능)
 */
export function createJavaAdapter(theme: 'light' | 'dark' = 'light'): IFlowAdapter {
  const styler = new JavaStyler(theme);
  return {
    language: 'java',
    transformer: new JavaTransformer(),
    styler,
    animator: new JavaAnimator(),
  };
}
