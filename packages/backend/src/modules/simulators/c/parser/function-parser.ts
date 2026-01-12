/**
 * Function Parser
 * C 코드에서 함수 정의를 추출
 *
 * 지원 패턴:
 * - int main() { ... }
 * - void func() { ... }
 * - int add(int a, int b) { ... }
 */

import type { FunctionDef, FunctionParam, ParseResult } from './types';

// 함수 정의 패턴: returnType functionName(params) {
const FUNCTION_DEF_PATTERN = /^(int|void|char|float|double|long|short|unsigned\s+\w+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{?\s*$/;

// 파라미터 패턴: type name
const PARAM_PATTERN = /^\s*((?:unsigned\s+)?[a-zA-Z_][a-zA-Z0-9_]*\s*\*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/;

/**
 * 파라미터 문자열 파싱
 * "int a, int b" → [{ name: "a", type: "int" }, { name: "b", type: "int" }]
 */
function parseParams(paramsStr: string): FunctionParam[] {
  if (!paramsStr.trim() || paramsStr.trim() === 'void') {
    return [];
  }

  const params: FunctionParam[] = [];
  const parts = paramsStr.split(',');

  for (const part of parts) {
    const match = part.match(PARAM_PATTERN);
    if (match) {
      params.push({
        type: match[1].trim(),
        name: match[2].trim(),
      });
    }
  }

  return params;
}

/**
 * 중괄호 매칭으로 함수 본문 끝 찾기
 */
function findBodyEnd(lines: string[], startLine: number): number {
  let braceCount = 0;
  let foundOpen = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];

    for (const char of line) {
      if (char === '{') {
        braceCount++;
        foundOpen = true;
      } else if (char === '}') {
        braceCount--;
        if (foundOpen && braceCount === 0) {
          return i;
        }
      }
    }
  }

  return lines.length - 1;
}

/**
 * C 코드 파싱 - 함수 정의 추출
 */
export function parseCode(code: string): ParseResult {
  const lines = code.split('\n');
  const functions = new Map<string, FunctionDef>();
  const errors: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // 전처리기 지시문, 빈 줄 건너뛰기
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      i++;
      continue;
    }

    // 함수 정의 확인
    const match = line.match(FUNCTION_DEF_PATTERN);
    if (match) {
      const returnType = match[1];
      const funcName = match[2];
      const paramsStr = match[3];

      const params = parseParams(paramsStr);
      const bodyStart = i;
      const bodyEnd = findBodyEnd(lines, i);

      // 함수 본문 라인 추출 (중괄호 내부만)
      const bodyLines: string[] = [];
      let insideBody = false;
      let braceCount = 0;

      for (let j = bodyStart; j <= bodyEnd; j++) {
        const bodyLine = lines[j];

        for (const char of bodyLine) {
          if (char === '{') {
            braceCount++;
            insideBody = true;
          } else if (char === '}') {
            braceCount--;
          }
        }

        // 첫 번째 { 이후부터 마지막 } 이전까지
        if (insideBody && braceCount > 0) {
          // 첫 줄은 { 이후 내용만
          if (j === bodyStart) {
            const afterBrace = bodyLine.indexOf('{');
            if (afterBrace !== -1 && bodyLine.length > afterBrace + 1) {
              bodyLines.push(bodyLine.slice(afterBrace + 1).trim());
            }
          } else {
            bodyLines.push(bodyLine);
          }
        } else if (insideBody && braceCount === 0 && j !== bodyEnd) {
          bodyLines.push(bodyLine);
        }
      }

      functions.set(funcName, {
        name: funcName,
        returnType,
        params,
        bodyStart: bodyStart + 1, // 1-indexed for display
        bodyEnd: bodyEnd + 1,
        lines: bodyLines.filter((l) => l.trim()), // 빈 줄 제거
      });

      i = bodyEnd + 1;
    } else {
      i++;
    }
  }

  return {
    functions,
    sourceLines: lines,
    errors,
  };
}

/**
 * 함수 목록 조회
 */
export function getFunctionNames(parseResult: ParseResult): string[] {
  return Array.from(parseResult.functions.keys());
}

/**
 * 특정 함수 조회
 */
export function getFunction(parseResult: ParseResult, name: string): FunctionDef | undefined {
  return parseResult.functions.get(name);
}
