/**
 * CodeMirror 테마 통합 export
 */
export { soft } from './soft';
export { dark } from './dark';
export { minimal } from './minimal';

import { soft } from './soft';
import { dark } from './dark';
import { minimal } from './minimal';
import type { Extension } from '@codemirror/state';

export const codemirrorThemes: Record<'soft' | 'dark' | 'minimal', Extension[]> = {
  soft,
  dark,
  minimal,
};
