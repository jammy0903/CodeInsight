/**
 * Function Pointer Handler
 * 함수 포인터 선언, 초기화, 호출 처리
 *
 * 지원 패턴:
 * - void (*callback)(int) = &greet;
 * - int (*operation)(int, int) = &add;
 * - callback(42);
 */

import type { CodeHandler, SimContext, Step } from './types';

// 함수 포인터 선언: returnType (*name)(params) = &targetFunc;
const FUNC_PTR_DECL_PATTERN =
  /^(\w+)\s*\(\s*\*\s*(\w+)\s*\)\s*\(([^)]*)\)\s*=\s*&(\w+)\s*;?$/;

// 함수 포인터 호출은 일반 함수 호출과 동일: funcPtr(args);
// 이것은 FunctionCallHandler와 겹치므로, 변수 타입으로 구분

export const FunctionPointerHandler: CodeHandler = {
  name: 'function-pointer',
  priority: 27, // PointerHandler(25)보다 높고 MallocHandler(30)보다 낮음

  canHandle(code: string): boolean {
    // 1. 함수 포인터 선언 패턴
    if (FUNC_PTR_DECL_PATTERN.test(code)) {
      return true;
    }

    // 2. 함수 포인터 호출은 일반 함수 호출과 같으므로
    // 여기서는 선언만 처리하고, 호출은 FunctionCallHandler가 처리
    return false;
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    const match = code.match(FUNC_PTR_DECL_PATTERN);
    if (!match) return null;

    const [, returnType, ptrName, params, targetFunc] = match;

    // 함수 주소 생성 (가상 주소)
    const funcAddress = ctx.toHex(0xf000 + Math.floor(Math.random() * 0x1000));

    // 포인터 변수로 저장
    const address = ctx.allocateStack(8); // 포인터 크기 (64비트)

    ctx.variables.set(ptrName, {
      name: ptrName,
      type: 'function_pointer',
      value: funcAddress,
      address: ctx.toHex(address),
      size: 8,
      // 추가 메타데이터
      pointsTo: targetFunc,
      returnType,
      params,
    } as any);

    const explanation = `🔗 함수 포인터 선언: ${ptrName}

📌 ${ptrName}는 ${targetFunc} 함수를 가리키는 포인터입니다.
   타입: ${returnType} (*${ptrName})(${params})
   주소: ${ctx.toHex(address)}
   가리키는 함수: ${targetFunc} @ ${funcAddress}

💡 함수 포인터란?
   • 함수의 주소를 저장하는 변수
   • ${ptrName}()를 호출하면 ${targetFunc}()가 실행됨
   • 콜백, 함수 배열, 전략 패턴 등에 활용

⚡ 선언 형식:
   ${returnType} (*${ptrName})(${params}) = &${targetFunc};

   이제 ${ptrName}(...)로 ${targetFunc}를 간접 호출할 수 있습니다!`;

    return ctx.createStep(lineNum, code, explanation);
  },
};

export default FunctionPointerHandler;
