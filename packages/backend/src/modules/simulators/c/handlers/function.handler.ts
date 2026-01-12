/**
 * Function Call Handler
 * 사용자 정의 함수 호출 처리
 *
 * 처리하는 패턴:
 * - func();
 * - myFunction(arg1, arg2);
 * - calculate(x, y, z);
 *
 * 주의: printf, scanf, malloc, free 등은 다른 핸들러가 처리
 * 이 핸들러는 가장 낮은 우선순위로 일반 함수 호출을 잡아냄
 */

import type { CodeHandler, SimContext, Step } from './types';

// 함수 호출 패턴: identifier(...)
// 단, 선언(int func(), void func())은 제외
const FUNCTION_CALL_PATTERN = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)$/;

// 시스템 함수 (다른 핸들러가 처리)
const SYSTEM_FUNCTIONS = ['printf', 'scanf', 'malloc', 'calloc', 'realloc', 'free', 'sizeof'];

export const FunctionCallHandler: CodeHandler = {
  name: 'function-call',
  priority: 5, // 가장 낮은 우선순위 (다른 핸들러가 먼저 처리)

  canHandle(code: string): boolean {
    const match = code.match(FUNCTION_CALL_PATTERN);
    if (!match) return false;

    const funcName = match[1];

    // 시스템 함수는 다른 핸들러가 처리
    if (SYSTEM_FUNCTIONS.includes(funcName)) return false;

    // 타입 선언은 제외 (int func(), void func())
    if (['int', 'void', 'char', 'float', 'double', 'long', 'short', 'unsigned'].includes(funcName)) {
      return false;
    }

    return true;
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    const match = code.match(FUNCTION_CALL_PATTERN);
    if (!match) return null;

    const funcName = match[1];
    const argsStr = match[2].trim();

    // 인자 분석
    let argsInfo = '';
    if (argsStr) {
      const args = argsStr.split(',').map((a) => a.trim());
      const argValues = args.map((arg) => {
        const v = ctx.variables.get(arg);
        if (v) {
          return `${arg} = ${v.value}`;
        }
        // 숫자 리터럴 또는 표현식
        return arg;
      });
      argsInfo = `\n• 전달된 인자: ${argValues.join(', ')}`;
    }

    const explanation = `📞 함수 호출: ${funcName}()
${argsInfo}
💡 ${funcName} 함수를 호출합니다.
   함수가 실행된 후 다음 줄로 돌아옵니다.

⚡ 함수 호출 시:
   1. 인자값이 스택에 복사됨
   2. 반환 주소가 저장됨
   3. 함수 본문 실행
   4. 결과 반환 후 원래 위치로 복귀`;

    return ctx.createStep(lineNum, code, explanation);
  },
};

export default FunctionCallHandler;
