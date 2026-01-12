/**
 * Expression Evaluator Module
 *
 * 언어에 무관한 표현식 파싱 및 평가
 *
 * 지원 기능:
 * - 산술 연산: +, -, *, /, %
 * - 비교 연산: <, >, <=, >=, ==, !=
 * - 논리 연산: &&, ||, !
 * - 삼항 연산: ? :
 * - 배열 인덱싱: arr[i]
 * - 함수 호출: func(args)
 * - sizeof: sizeof(type) (C 전용)
 * - 포인터 역참조: *p (C 전용)
 * - 괄호: (expr)
 *
 * 언어별 확장:
 * - EvalContext를 통해 언어별 기능 추가 가능
 * - C: derefPointer, sizeof
 * - Python: len(), in (미래)
 * - Java: instanceof, .length (미래)
 */

export { tokenize, Tokenizer } from './tokenizer';
export { parse, Parser } from './parser';
export { evaluateExpression, simpleEvaluate, Evaluator } from './evaluator';
export type {
  Token,
  TokenType,
  ASTNode,
  EvalContext,
  VariableLookup,
  ArrayLookup,
  PointerDeref,
  FunctionCall,
} from './types';
