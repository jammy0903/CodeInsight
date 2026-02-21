/**
 * CppStyler
 *
 * CStyler를 그대로 재사용하되 C++ 전용 엔트리 포인트를 분리해
 * 언어별 폴더 구조 일관성을 유지한다.
 */

import { CStyler } from '../../c/adapters/CStyler';

export class CppStyler extends CStyler {}

export const cppStyler = new CppStyler('light');
