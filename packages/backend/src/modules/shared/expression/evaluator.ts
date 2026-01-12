/**
 * Expression Evaluator
 * AST를 순회하며 값 계산
 *
 * 언어별 확장은 EvalContext를 통해 처리
 */

import type { ASTNode, EvalContext } from './types';
import { parse } from './parser';

/** 기본 타입별 크기 (sizeof용, C 기준) */
const DEFAULT_TYPE_SIZES: Record<string, number> = {
  char: 1,
  short: 2,
  int: 4,
  long: 8,
  float: 4,
  double: 8,
  'long long': 8,
  'unsigned char': 1,
  'unsigned short': 2,
  'unsigned int': 4,
  'unsigned long': 8,
  // 포인터는 8바이트 (64비트)
  'int*': 8,
  'char*': 8,
  'void*': 8,
};

export class Evaluator {
  private ctx: EvalContext;
  private typeSizes: Record<string, number>;

  constructor(ctx: EvalContext, typeSizes?: Record<string, number>) {
    this.ctx = ctx;
    this.typeSizes = typeSizes ?? DEFAULT_TYPE_SIZES;
  }

  evaluate(node: ASTNode): number {
    switch (node.kind) {
      case 'NumberLiteral':
        return node.value;

      case 'CharLiteral':
        return node.value;

      case 'Identifier':
        return this.ctx.getVariable(node.name) ?? 0;

      case 'BinaryExpr':
        return this.evalBinary(node.operator, node.left, node.right);

      case 'UnaryExpr':
        return this.evalUnary(node.operator, node.operand);

      case 'CallExpr':
        return this.evalCall(node.callee, node.args);

      case 'IndexExpr':
        return this.evalIndex(node.array, node.index);

      case 'TernaryExpr':
        return this.evaluate(node.condition) !== 0
          ? this.evaluate(node.consequent)
          : this.evaluate(node.alternate);

      case 'SizeofExpr':
        return this.evalSizeof(node.operand);

      default:
        return 0;
    }
  }

  private evalBinary(op: string, left: ASTNode, right: ASTNode): number {
    // 논리 연산은 단축 평가
    if (op === '&&') {
      return this.evaluate(left) !== 0 && this.evaluate(right) !== 0 ? 1 : 0;
    }
    if (op === '||') {
      return this.evaluate(left) !== 0 || this.evaluate(right) !== 0 ? 1 : 0;
    }

    const l = this.evaluate(left);
    const r = this.evaluate(right);

    switch (op) {
      // 산술
      case '+': return l + r;
      case '-': return l - r;
      case '*': return l * r;
      case '/': return r !== 0 ? Math.trunc(l / r) : 0;
      case '%': return r !== 0 ? l % r : 0;

      // 비교
      case '<': return l < r ? 1 : 0;
      case '>': return l > r ? 1 : 0;
      case '<=': return l <= r ? 1 : 0;
      case '>=': return l >= r ? 1 : 0;
      case '==': return l === r ? 1 : 0;
      case '!=': return l !== r ? 1 : 0;

      default:
        return 0;
    }
  }

  private evalUnary(op: string, operand: ASTNode): number {
    switch (op) {
      case '-':
        return -this.evaluate(operand);

      case '!':
        return this.evaluate(operand) === 0 ? 1 : 0;

      case '*':
        // 포인터 역참조 (C 전용, EvalContext.derefPointer 필요)
        if (operand.kind === 'Identifier' && this.ctx.derefPointer) {
          return this.ctx.derefPointer(operand.name) ?? 0;
        }
        return 0;

      case '&':
        // 주소 연산 - 시뮬레이터에서는 특별 처리 필요
        // 현재는 0 반환 (실제 주소는 핸들러에서 처리)
        return 0;

      default:
        return 0;
    }
  }

  private evalCall(callee: string, args: ASTNode[]): number {
    const evaluatedArgs = args.map((arg) => this.evaluate(arg));
    return this.ctx.callFunction(callee, evaluatedArgs) ?? 0;
  }

  private evalIndex(array: string, index: ASTNode): number {
    const idx = this.evaluate(index);
    return this.ctx.getArrayElement(array, idx) ?? 0;
  }

  private evalSizeof(operand: string): number {
    // 타입명 또는 변수명
    const normalized = operand.replace(/\s+/g, ' ').trim();
    return this.typeSizes[normalized] ?? this.typeSizes[operand] ?? 4;
  }
}

/**
 * 편의 함수: 표현식 문자열 → 값
 */
export function evaluateExpression(expr: string, ctx: EvalContext): number {
  try {
    const ast = parse(expr);
    return new Evaluator(ctx).evaluate(ast);
  } catch (e) {
    // 파싱 실패 시 0 반환
    return 0;
  }
}

/**
 * 간단한 컨텍스트로 평가 (변수 맵만 제공)
 */
export function simpleEvaluate(
  expr: string,
  variables: Record<string, number>
): number {
  const ctx: EvalContext = {
    getVariable: (name) => variables[name] ?? null,
    getArrayElement: () => null,
    callFunction: () => null,
  };
  return evaluateExpression(expr, ctx);
}
