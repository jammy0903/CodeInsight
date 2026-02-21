/**
 * CppAnimator
 *
 * CAnimator를 재사용하여 C++ 엔트리 포인트를 분리한다.
 */

import { CAnimator } from '../../c/adapters/CAnimator';

export class CppAnimator extends CAnimator {}

export const cppAnimator = new CppAnimator();
