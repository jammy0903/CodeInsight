/**
 * Expression Evaluator Types
 * 식 평가 시스템의 타입 정의
 */

import type { Variable } from '../runtime/types';

/**
 * 식 평가 결과
 */
export interface EvalResult {
  /** 평가된 값 (숫자 또는 주소 문자열) */
  value: number | string;

  /** 결과 타입 */
  type: 'int' | 'float' | 'char' | 'pointer' | 'address' | 'void';

  /** 주소/포인터면 가리키는 대상 주소 */
  pointsTo?: string;

  /** 원본 변수명 (디버깅/설명용) */
  sourceVar?: string;

  /** 원본 프레임명 (크로스 프레임 참조 시) */
  sourceFrame?: string;
}

/**
 * 크로스 프레임 변수 검색 결과
 */
export interface CrossFrameVariable {
  frameName: string;
  variableName: string;
  variable: Variable;
}

/**
 * 식 평가 컨텍스트
 * Evaluator가 필요로 하는 최소한의 인터페이스
 */
export interface EvalContext {
  /** 현재 스코프의 변수들 */
  variables: Map<string, Variable>;

  /** 주소로 변수 찾기 (크로스 프레임 지원) */
  findVariableByAddress(address: string): CrossFrameVariable | null;

  /** 이름으로 변수 찾기 (크로스 프레임 지원)
   * 현재 프레임 → 부모 프레임 순으로 검색
   * 용도: &x 평가 시 호출자 프레임의 변수 참조 */
  findVariableByName?(name: string): CrossFrameVariable | null;

  /** 현재 프레임 이름 */
  getCurrentFrame(): string;

  /** 힙 블록 조회 (포인터가 힙을 가리킬 때) */
  getHeapBlock?(address: string): { value: string; bytes: number[] } | null;
}

/**
 * 연산자 핸들러 인터페이스
 * 확장 가능한 연산자 시스템
 */
export interface OperatorHandler {
  /** 연산자 이름 */
  name: string;

  /** 이 연산자가 처리할 수 있는지 확인 */
  canHandle(expr: string): boolean;

  /** 식 평가 */
  evaluate(expr: string, ctx: EvalContext, evaluator: ExpressionEvaluatorInterface): EvalResult;
}

/**
 * ExpressionEvaluator 인터페이스
 * 연산자 핸들러가 재귀 평가 시 사용
 */
export interface ExpressionEvaluatorInterface {
  evaluate(expr: string): EvalResult;
}
