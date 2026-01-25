/**
 * Python Global/Nonlocal Handler
 *
 * global x, y 또는 nonlocal x 문을 처리
 * - global: 해당 변수에 할당 시 전역 스코프에 바인딩
 * - nonlocal: 해당 변수에 할당 시 외부 스코프에 바인딩 (클로저)
 */

import type { PyCodeHandler, PySimContext, PyStep } from '../types';

// global 또는 nonlocal 패턴
const GLOBAL_NONLOCAL_PATTERN = /^(?:global|nonlocal)\s+\w+(?:\s*,\s*\w+)*$/;

export const GlobalNonlocalHandler: PyCodeHandler = {
  name: 'global-nonlocal',
  priority: 5, // 낮은 우선순위 (다른 핸들러보다 나중에 체크)

  canHandle(code: string): boolean {
    return GLOBAL_NONLOCAL_PATTERN.test(code.trim());
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const trimmed = code.trim();
    const isGlobal = trimmed.startsWith('global');

    // 변수 이름 추출
    const varsPart = trimmed.replace(/^(?:global|nonlocal)\s+/, '');
    const varNames = varsPart.split(',').map((v) => v.trim());

    // 현재 프레임에 global 변수 등록
    const frame = ctx.getCurrentFrame();
    if (frame && isGlobal) {
      varNames.forEach((varName) => {
        frame.globalVars.add(varName);
        // unboundLocals에서 제거 (global 변수는 UnboundLocalError 대상 아님)
        frame.unboundLocals.delete(varName);
      });
    }

    // 설명 생성
    const explanation = isGlobal
      ? `'${varNames.join(', ')}'을(를) 전역 변수로 선언 (할당 시 전역 스코프 사용)`
      : `'${varNames.join(', ')}'을(를) 외부 스코프 변수로 선언 (할당 시 외부 스코프 사용)`;

    // 스텝 생성
    const step = ctx.createStep(lineNum, code, explanation);

    return step;
  },
};
