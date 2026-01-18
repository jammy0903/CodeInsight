/**
 * Expression Evaluator
 * C 표현식 평가기
 *
 * 지원하는 표현식:
 * - 리터럴: 10, 0xFF, 3.14, 'A'
 * - 변수 참조: x, arr[0]
 * - 주소 연산자: &x, &arr[i]
 * - 역참조 연산자: *p
 * - 이항 연산: a + b, a * b, a - b, a / b
 */

import type { EvalResult, EvalContext, ExpressionEvaluatorInterface } from './types';

export class ExpressionEvaluator implements ExpressionEvaluatorInterface {
  constructor(private ctx: EvalContext) {}

  /**
   * 컨텍스트 업데이트 (스코프 변경 시)
   */
  updateContext(ctx: EvalContext): void {
    this.ctx = ctx;
  }

  /**
   * 모든 표현식의 진입점
   * @param expr 평가할 표현식
   * @returns 평가 결과
   * @throws 평가 실패 시 에러
   */
  evaluate(expr: string): EvalResult {
    const trimmed = expr.trim();

    if (!trimmed) {
      return { value: 0, type: 'int' };
    }

    // 1. 주소 연산자 &x, &arr[i]
    if (trimmed.startsWith('&')) {
      return this.evaluateAddressOf(trimmed.slice(1).trim());
    }

    // 2. 역참조 *p (단, **p는 아직 미지원)
    if (trimmed.startsWith('*') && !trimmed.startsWith('**')) {
      return this.evaluateDereference(trimmed.slice(1).trim());
    }

    // 3. 괄호 처리 (expr)
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      return this.evaluate(trimmed.slice(1, -1));
    }

    // 4. 리터럴 (숫자, 16진수, 문자)
    const literal = this.tryParseLiteral(trimmed);
    if (literal) return literal;

    // 5. 배열 인덱스 접근 arr[i]
    const arrayAccess = this.tryParseArrayAccess(trimmed);
    if (arrayAccess) return arrayAccess;

    // 6. 변수 참조
    const varResult = this.tryParseVariable(trimmed);
    if (varResult) return varResult;

    // 7. 이항 연산 (가장 낮은 우선순위로 마지막에)
    const binaryResult = this.tryParseBinaryOp(trimmed);
    if (binaryResult) return binaryResult;

    // 평가 실패 - 기본값 반환 (에러 대신)
    console.warn(`[ExpressionEvaluator] Cannot evaluate: "${trimmed}"`);
    return { value: 0, type: 'int' };
  }

  /**
   * 주소 연산자 &x
   * 변수의 메모리 주소를 반환
   *
   * 검색 순서:
   * 1. 현재 프레임의 variables
   * 2. 크로스 프레임 검색 (함수 호출 시 &x 전달용)
   */
  private evaluateAddressOf(varName: string): EvalResult {
    // 배열 인덱스 주소: &arr[i]
    const arrayMatch = varName.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      return this.evaluateArrayElementAddress(arrayMatch[1], parseInt(arrayMatch[2]));
    }

    // 1. 현재 프레임에서 검색
    const variable = this.ctx.variables.get(varName);
    if (variable) {
      return {
        value: variable.address,
        type: 'address',
        pointsTo: variable.address,
        sourceVar: varName,
        sourceFrame: this.ctx.getCurrentFrame(),
      };
    }

    // 2. 크로스 프레임 검색 (함수 호출 시 &x 전달)
    // 예: swap(&x, &y) 호출 시 main.x, main.y 검색
    if (this.ctx.findVariableByName) {
      const crossFrame = this.ctx.findVariableByName(varName);
      if (crossFrame) {
        return {
          value: crossFrame.variable.address,
          type: 'address',
          pointsTo: crossFrame.variable.address,
          sourceVar: crossFrame.variableName,
          sourceFrame: crossFrame.frameName,
        };
      }
    }

    throw new Error(`Variable '${varName}' not found for address-of operator`);
  }

  /**
   * 배열 요소 주소: &arr[i]
   */
  private evaluateArrayElementAddress(arrName: string, index: number): EvalResult {
    const arr = this.ctx.variables.get(arrName);
    if (!arr) {
      throw new Error(`Array '${arrName}' not found`);
    }

    const elementSize = arr.element_size || 4; // 기본 int
    const baseAddr = parseInt(arr.address, 16);
    const elemAddr = baseAddr + (index * elementSize);

    return {
      value: '0x' + elemAddr.toString(16),
      type: 'address',
      pointsTo: '0x' + elemAddr.toString(16),
      sourceVar: `${arrName}[${index}]`,
      sourceFrame: this.ctx.getCurrentFrame(),
    };
  }

  /**
   * 역참조 연산자 *p
   * 포인터가 가리키는 값을 반환
   */
  private evaluateDereference(ptrExpr: string): EvalResult {
    // 포인터 변수 조회
    const ptr = this.ctx.variables.get(ptrExpr);
    if (!ptr) {
      throw new Error(`Pointer '${ptrExpr}' not found`);
    }

    if (!ptr.points_to) {
      throw new Error(`Pointer '${ptrExpr}' is null or uninitialized`);
    }

    // 1. 힙 메모리 확인
    if (this.ctx.getHeapBlock) {
      const heapBlock = this.ctx.getHeapBlock(ptr.points_to);
      if (heapBlock) {
        return {
          value: parseFloat(heapBlock.value) || 0,
          type: 'int',
          sourceVar: `*${ptrExpr}`,
        };
      }
    }

    // 2. 스택 메모리 (크로스 프레임 지원)
    const target = this.ctx.findVariableByAddress(ptr.points_to);
    if (target) {
      const numValue = parseFloat(target.variable.value);
      return {
        value: isNaN(numValue) ? 0 : numValue,
        type: this.inferType(target.variable.type),
        sourceVar: target.variableName,
        sourceFrame: target.frameName,
      };
    }

    throw new Error(`Pointer '${ptrExpr}' points to invalid address ${ptr.points_to}`);
  }

  /**
   * 리터럴 파싱
   */
  private tryParseLiteral(expr: string): EvalResult | null {
    // 정수 리터럴: 10, -5
    if (/^-?\d+$/.test(expr)) {
      return { value: parseInt(expr, 10), type: 'int' };
    }

    // 실수 리터럴: 3.14, -0.5
    if (/^-?\d+\.\d+$/.test(expr)) {
      return { value: parseFloat(expr), type: 'float' };
    }

    // 16진수 리터럴: 0xFF, 0x7fff
    if (/^0x[0-9a-fA-F]+$/i.test(expr)) {
      return { value: parseInt(expr, 16), type: 'int' };
    }

    // 문자 리터럴: 'A', '\n'
    const charMatch = expr.match(/^'(.)'$/);
    if (charMatch) {
      const char = charMatch[1];
      // 이스케이프 시퀀스 처리
      const escapeMap: Record<string, number> = {
        'n': 10, 't': 9, 'r': 13, '0': 0, '\\': 92, "'": 39,
      };
      if (char.startsWith('\\') && char.length === 2) {
        return { value: escapeMap[char[1]] || 0, type: 'char' };
      }
      return { value: char.charCodeAt(0), type: 'char' };
    }

    return null;
  }

  /**
   * 배열 인덱스 접근: arr[i]
   */
  private tryParseArrayAccess(expr: string): EvalResult | null {
    const match = expr.match(/^(\w+)\[(\d+)\]$/);
    if (!match) return null;

    const arrName = match[1];
    const index = parseInt(match[2]);
    const arr = this.ctx.variables.get(arrName);

    if (!arr) return null;

    // 배열인 경우
    if (arr.is_array && arr.bytes) {
      const elementSize = arr.element_size || 4;
      const offset = index * elementSize;

      if (offset + elementSize <= arr.bytes.length) {
        // 리틀 엔디안으로 값 읽기
        let value = 0;
        for (let i = 0; i < elementSize; i++) {
          value |= (arr.bytes[offset + i] || 0) << (i * 8);
        }
        return {
          value,
          type: this.inferType(arr.element_type || 'int'),
          sourceVar: `${arrName}[${index}]`,
        };
      }
    }

    // 포인터를 배열처럼 사용하는 경우 (p[i])
    if (arr.type?.includes('*') && arr.points_to) {
      // 힙 메모리 접근
      if (this.ctx.getHeapBlock) {
        const baseAddr = parseInt(arr.points_to, 16);
        const elemAddr = baseAddr + (index * 4); // int 가정
        const heapBlock = this.ctx.getHeapBlock('0x' + elemAddr.toString(16));
        if (heapBlock) {
          return {
            value: parseFloat(heapBlock.value) || 0,
            type: 'int',
            sourceVar: `${arrName}[${index}]`,
          };
        }
      }
    }

    return null;
  }

  /**
   * 변수 참조
   */
  private tryParseVariable(expr: string): EvalResult | null {
    // 유효한 식별자인지 확인
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr)) {
      return null;
    }

    const variable = this.ctx.variables.get(expr);
    if (!variable) return null;

    // 포인터 변수는 주소값 반환
    if (variable.type?.includes('*')) {
      return {
        value: variable.value,
        type: 'pointer',
        pointsTo: variable.points_to,
        sourceVar: expr,
        sourceFrame: this.ctx.getCurrentFrame(),
      };
    }

    // 일반 변수는 값 반환
    const numValue = parseFloat(variable.value);
    return {
      value: isNaN(numValue) ? 0 : numValue,
      type: this.inferType(variable.type),
      sourceVar: expr,
      sourceFrame: this.ctx.getCurrentFrame(),
    };
  }

  /**
   * 이항 연산: a + b, a - b, a * b, a / b
   * 연산자 우선순위: *, / > +, -
   */
  private tryParseBinaryOp(expr: string): EvalResult | null {
    // 낮은 우선순위 연산자 먼저 찾기 (+, -)
    // 괄호 깊이 추적하여 최외곽 연산자 찾기
    let depth = 0;
    let lastPlusMinusIdx = -1;
    let lastMulDivIdx = -1;

    for (let i = expr.length - 1; i >= 0; i--) {
      const char = expr[i];
      if (char === ')') depth++;
      else if (char === '(') depth--;
      else if (depth === 0) {
        if ((char === '+' || char === '-') && i > 0) {
          // 부호가 아닌 연산자인지 확인
          const prevChar = expr[i - 1].trim();
          if (prevChar && !/[+\-*/]/.test(prevChar)) {
            lastPlusMinusIdx = i;
            break; // 가장 낮은 우선순위 찾음
          }
        } else if ((char === '*' || char === '/') && lastMulDivIdx === -1) {
          lastMulDivIdx = i;
        }
      }
    }

    const opIdx = lastPlusMinusIdx !== -1 ? lastPlusMinusIdx : lastMulDivIdx;
    if (opIdx === -1) return null;

    const left = expr.slice(0, opIdx).trim();
    const op = expr[opIdx];
    const right = expr.slice(opIdx + 1).trim();

    if (!left || !right) return null;

    try {
      const leftResult = this.evaluate(left);
      const rightResult = this.evaluate(right);

      const leftVal = typeof leftResult.value === 'number' ? leftResult.value : parseFloat(String(leftResult.value)) || 0;
      const rightVal = typeof rightResult.value === 'number' ? rightResult.value : parseFloat(String(rightResult.value)) || 0;

      let result: number;
      switch (op) {
        case '+': result = leftVal + rightVal; break;
        case '-': result = leftVal - rightVal; break;
        case '*': result = leftVal * rightVal; break;
        case '/': result = rightVal !== 0 ? leftVal / rightVal : 0; break;
        default: return null;
      }

      // 결과 타입 결정 (float가 있으면 float)
      const resultType = leftResult.type === 'float' || rightResult.type === 'float' ? 'float' : 'int';

      return {
        value: resultType === 'int' ? Math.floor(result) : result,
        type: resultType,
      };
    } catch {
      return null;
    }
  }

  /**
   * C 타입 문자열에서 EvalResult 타입 추론
   */
  private inferType(cType: string): EvalResult['type'] {
    if (!cType) return 'int';
    if (cType.includes('*')) return 'pointer';
    if (cType.includes('float') || cType.includes('double')) return 'float';
    if (cType.includes('char')) return 'char';
    if (cType === 'void') return 'void';
    return 'int';
  }
}
