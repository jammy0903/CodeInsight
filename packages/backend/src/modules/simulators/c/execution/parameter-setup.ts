/**
 * Parameter Setup
 * 함수 파라미터 타입별 처리
 *
 * 지원하는 파라미터 타입:
 * - 값 타입: int, float, char, double, long, short
 * - 포인터 타입: int *, char *, void *, ...
 * - 배열 타입: int arr[] (포인터로 decay)
 */

import type { Variable } from '../runtime/types';
import type { VisualizationEvent } from '@codeinsight/shared';
import type { ExpressionEvaluator } from '../evaluator';
import type { ParameterResult, ParameterInfo, ExecutionContext } from './types';

export class ParameterSetup {
  constructor(
    private evaluator: ExpressionEvaluator,
    private ctx: ExecutionContext
  ) {}

  /**
   * 파라미터 설정 (타입별 분기)
   * @param param 파라미터 정의 (name, type)
   * @param argExpr 인자 표현식 (예: "&x", "10", "arr")
   * @returns 생성된 변수와 이벤트
   */
  setup(param: ParameterInfo, argExpr: string): ParameterResult {
    // 포인터 타입 파라미터: int *a, char *p, void *ptr
    if (param.type.includes('*')) {
      return this.setupPointerParam(param, argExpr);
    }

    // 배열 타입 파라미터: int arr[] → 포인터로 decay
    if (param.type.includes('[')) {
      return this.setupArrayParam(param, argExpr);
    }

    // 값 타입 파라미터: int, float, char, double, ...
    return this.setupValueParam(param, argExpr);
  }

  /**
   * 포인터 파라미터 설정
   * 예: void swap(int *a, int *b) 호출 시 swap(&x, &y)
   *
   * a와 b는 포인터 변수로 스택에 할당되고,
   * points_to에 x, y의 주소가 저장됨
   */
  private setupPointerParam(param: ParameterInfo, argExpr: string): ParameterResult {
    const evalResult = this.evaluator.evaluate(argExpr);

    // 포인터는 8바이트 (64-bit)
    const size = 8;
    const addr = this.ctx.allocateStack(size);

    // 주소값을 바이트 배열로 변환
    let addrInt: number;
    if (typeof evalResult.value === 'string') {
      // "0x7fffffffde00" 형식
      addrInt = parseInt(evalResult.value, 16);
    } else {
      addrInt = evalResult.value;
    }

    const variable: Variable = {
      address: this.ctx.toHex(addr),
      type: param.type,                         // "int *"
      size,
      bytes: this.intToBytes64(addrInt),        // 64비트 주소
      value: typeof evalResult.value === 'string'
        ? evalResult.value
        : this.ctx.toHex(evalResult.value),
      points_to: evalResult.pointsTo,           // ⭐ 핵심: 가리키는 대상 주소
    };

    const events: VisualizationEvent[] = [
      // 포인터 변수 선언 이벤트
      {
        type: 'variable',
        action: 'declare',
        frame: this.ctx.getCurrentFrame(),
        name: param.name,
        varType: param.type,
        value: variable.value,
        address: this.ctx.toHex(addr),
        size,
      },
    ];

    // 유효한 주소를 가리키면 포인터 할당 이벤트 추가
    if (evalResult.pointsTo) {
      events.push({
        type: 'pointer',
        action: 'assign',
        frame: this.ctx.getCurrentFrame(),
        pointer: param.name,
        targetAddress: evalResult.pointsTo,
        targetName: evalResult.sourceVar,
      });
    }

    return { variable, events };
  }

  /**
   * 배열 파라미터 설정 (포인터로 decay)
   * 예: void process(int arr[]) 호출 시 process(myArr)
   *
   * arr 파라미터는 포인터로 취급되어
   * myArr의 첫 번째 요소 주소를 가리킴
   */
  private setupArrayParam(param: ParameterInfo, argExpr: string): ParameterResult {
    // 배열은 포인터로 decay
    const pointerType = param.type.replace(/\[\d*\]/, '*');
    return this.setupPointerParam(
      { name: param.name, type: pointerType },
      argExpr.startsWith('&') ? argExpr : `&${argExpr}[0]`
    );
  }

  /**
   * 값 타입 파라미터 설정 (Pass by Value)
   * 예: int add(int a, int b) 호출 시 add(x, y)
   *
   * a와 b는 x, y의 값이 복사됨 (독립적인 변수)
   */
  private setupValueParam(param: ParameterInfo, argExpr: string): ParameterResult {
    const evalResult = this.evaluator.evaluate(argExpr);

    const size = this.ctx.getTypeSize(param.type);
    const addr = this.ctx.allocateStack(size);

    // 값을 숫자로 변환
    const numValue = typeof evalResult.value === 'number'
      ? evalResult.value
      : parseFloat(String(evalResult.value)) || 0;

    const variable: Variable = {
      address: this.ctx.toHex(addr),
      type: param.type,
      size,
      bytes: this.ctx.intToBytes(Math.floor(numValue), size),
      value: String(numValue),
    };

    const events: VisualizationEvent[] = [
      {
        type: 'variable',
        action: 'declare',
        frame: this.ctx.getCurrentFrame(),
        name: param.name,
        varType: param.type,
        value: numValue,
        address: this.ctx.toHex(addr),
        size,
      },
    ];

    return { variable, events };
  }

  /**
   * 64비트 정수를 바이트 배열로 변환 (리틀 엔디안)
   */
  private intToBytes64(value: number): number[] {
    const bytes: number[] = [];
    // JavaScript의 비트 연산은 32비트로 제한되므로
    // BigInt 사용 또는 수동 처리
    const low = value >>> 0;  // 하위 32비트
    const high = Math.floor(value / 0x100000000) >>> 0;  // 상위 32비트

    // 리틀 엔디안: 낮은 바이트부터
    for (let i = 0; i < 4; i++) {
      bytes.push((low >> (i * 8)) & 0xff);
    }
    for (let i = 0; i < 4; i++) {
      bytes.push((high >> (i * 8)) & 0xff);
    }

    return bytes;
  }
}
