/**
 * Parser Types
 * C 코드 파싱을 위한 타입 정의
 */

/** 함수 파라미터 */
export interface FunctionParam {
  name: string;
  type: string;
}

/** 함수 정의 */
export interface FunctionDef {
  name: string;
  returnType: string;
  params: FunctionParam[];
  bodyStart: number;  // 함수 본문 시작 라인 (0-indexed)
  bodyEnd: number;    // 함수 본문 끝 라인 (0-indexed)
  lines: string[];    // 함수 본문 라인들
}

/** 파싱 결과 */
export interface ParseResult {
  functions: Map<string, FunctionDef>;
  sourceLines: string[];
  errors: string[];
}
