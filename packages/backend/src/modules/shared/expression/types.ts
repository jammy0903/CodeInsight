/**
 * Expression Evaluator Types
 * 언어에 무관한 표현식 평가를 위한 타입 정의
 *
 * 지원: C, Python, Java (공통 문법)
 */

// =============================================
// Token Types
// =============================================

export type TokenType =
  // 리터럴
  | 'NUMBER'      // 123, 0xFF, 3.14
  | 'CHAR'        // 'a', '\n'
  | 'IDENTIFIER'  // 변수명, 함수명

  // 연산자 - 산술
  | 'PLUS'        // +
  | 'MINUS'       // -
  | 'STAR'        // * (곱셈 또는 역참조)
  | 'SLASH'       // /
  | 'PERCENT'     // %

  // 연산자 - 비교
  | 'LT'          // <
  | 'GT'          // >
  | 'LE'          // <=
  | 'GE'          // >=
  | 'EQ'          // ==
  | 'NE'          // !=

  // 연산자 - 논리
  | 'AND'         // &&
  | 'OR'          // ||
  | 'NOT'         // !

  // 연산자 - 기타
  | 'AMP'         // & (주소 연산, C전용)
  | 'QUESTION'    // ?
  | 'COLON'       // :

  // 구분자
  | 'LPAREN'      // (
  | 'RPAREN'      // )
  | 'LBRACKET'    // [
  | 'RBRACKET'    // ]
  | 'COMMA'       // ,

  // 특수
  | 'SIZEOF'      // sizeof (C전용, 확장 가능)
  | 'EOF';        // 끝

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// =============================================
// AST Node Types
// =============================================

export type ASTNode =
  | NumberLiteral
  | CharLiteral
  | Identifier
  | BinaryExpr
  | UnaryExpr
  | CallExpr
  | IndexExpr
  | TernaryExpr
  | SizeofExpr;

export interface NumberLiteral {
  kind: 'NumberLiteral';
  value: number;
}

export interface CharLiteral {
  kind: 'CharLiteral';
  value: number;  // ASCII 값
}

export interface Identifier {
  kind: 'Identifier';
  name: string;
}

export interface BinaryExpr {
  kind: 'BinaryExpr';
  operator: string;  // +, -, *, /, %, <, >, <=, >=, ==, !=, &&, ||
  left: ASTNode;
  right: ASTNode;
}

export interface UnaryExpr {
  kind: 'UnaryExpr';
  operator: string;  // -, !, *, &
  operand: ASTNode;
}

export interface CallExpr {
  kind: 'CallExpr';
  callee: string;
  args: ASTNode[];
}

export interface IndexExpr {
  kind: 'IndexExpr';
  array: string;
  index: ASTNode;
}

export interface TernaryExpr {
  kind: 'TernaryExpr';
  condition: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode;
}

export interface SizeofExpr {
  kind: 'SizeofExpr';
  operand: string;  // 타입명 또는 표현식
}

// =============================================
// Evaluation Context (언어 확장 가능)
// =============================================

/** 변수 값 조회 함수 */
export type VariableLookup = (name: string) => number | null;

/** 배열 요소 조회 함수 */
export type ArrayLookup = (name: string, index: number) => number | null;

/** 포인터 역참조 함수 (C 전용) */
export type PointerDeref = (name: string) => number | null;

/** 함수 호출 함수 */
export type FunctionCall = (name: string, args: number[]) => number | null;

/**
 * 표현식 평가 컨텍스트
 *
 * 공통 기능은 필수, 언어별 확장은 optional
 * - C: derefPointer, sizeof
 * - Python: len(), in 연산자 (미래)
 * - Java: instanceof, .length (미래)
 */
export interface EvalContext {
  // 공통 (필수)
  getVariable: VariableLookup;
  getArrayElement: ArrayLookup;
  callFunction: FunctionCall;

  // C 전용 (optional)
  derefPointer?: PointerDeref;

  // 확장 포인트 (미래)
  // getLength?: (name: string) => number | null;  // Python, Java
  // checkInstanceOf?: (obj: string, type: string) => boolean; // Java
}
