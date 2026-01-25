/**
 * Python Block Parser
 *
 * Python의 들여쓰기 기반 블록 구조를 파싱
 * - 함수 정의 (def)
 * - 클래스 정의 (class)
 * - 제어문 (if, for, while 등 - 향후 확장)
 */

import type { PyCodeLine } from '../types';

/**
 * 파싱된 블록
 */
export interface ParsedBlock {
  /** 블록 타입 */
  type: 'function' | 'class' | 'if' | 'for' | 'while' | 'try' | 'with';

  /** 헤더 줄 (def func():, class MyClass: 등) */
  headerLine: number;

  /** 헤더 코드 */
  headerCode: string;

  /** 본문 줄들 */
  bodyLines: PyCodeLine[];

  /** 블록 끝 줄 */
  endLine: number;

  /** 블록 들여쓰기 레벨 */
  indentLevel: number;
}

/**
 * 파싱된 코드 구조
 */
export interface ParsedCode {
  /** 모든 줄 */
  lines: PyCodeLine[];

  /** 블록들 (시작 줄 번호 → 블록) */
  blocks: Map<number, ParsedBlock>;
}

/**
 * Python 코드의 들여쓰기 레벨 계산
 */
export function getIndentLevel(line: string): number {
  let spaces = 0;
  for (const char of line) {
    if (char === ' ') {
      spaces++;
    } else if (char === '\t') {
      spaces += 4; // 탭 = 4 스페이스로 취급
    } else {
      break;
    }
  }
  return Math.floor(spaces / 4);
}

/**
 * Python 코드 파싱
 */
export function parseCode(code: string): ParsedCode {
  const rawLines = code.split('\n');
  const lines: PyCodeLine[] = [];
  const blocks = new Map<number, ParsedBlock>();

  // 1. 모든 줄을 PyCodeLine으로 변환
  for (let i = 0; i < rawLines.length; i++) {
    const lineNum = i + 1;
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    lines.push({
      lineNum,
      code: trimmed,
      indent: getIndentLevel(rawLine),
    });
  }

  // 2. 블록 탐지
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 빈 줄, 주석 스킵
    if (!line.code || line.code.startsWith('#')) {
      continue;
    }

    // 블록 시작 감지
    const blockType = detectBlockType(line.code);
    if (blockType) {
      const block = parseBlock(lines, i, blockType);
      if (block) {
        blocks.set(line.lineNum, block);
      }
    }
  }

  return { lines, blocks };
}

/**
 * 블록 타입 감지
 */
function detectBlockType(code: string): ParsedBlock['type'] | null {
  if (/^def\s+\w+\s*\(/.test(code)) return 'function';
  if (/^class\s+\w+/.test(code)) return 'class';
  if (/^if\s+/.test(code)) return 'if';
  if (/^for\s+/.test(code)) return 'for';
  if (/^while\s+/.test(code)) return 'while';
  if (/^try\s*:/.test(code)) return 'try';
  if (/^with\s+/.test(code)) return 'with';
  return null;
}

/**
 * 블록 파싱
 */
function parseBlock(
  lines: PyCodeLine[],
  startIdx: number,
  type: ParsedBlock['type']
): ParsedBlock | null {
  const headerLine = lines[startIdx];
  const headerIndent = headerLine.indent;
  const bodyLines: PyCodeLine[] = [];

  // 헤더 다음 줄부터 본문 탐색
  let endLine = headerLine.lineNum;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];

    // 빈 줄은 본문에 포함 (연속성 유지)
    if (!line.code) {
      bodyLines.push(line);
      continue;
    }

    // 주석도 본문에 포함
    if (line.code.startsWith('#')) {
      bodyLines.push(line);
      continue;
    }

    // 들여쓰기가 헤더보다 깊으면 본문
    if (line.indent > headerIndent) {
      bodyLines.push(line);
      endLine = line.lineNum;
    } else {
      // 들여쓰기가 같거나 얕으면 블록 종료
      break;
    }
  }

  // 유효한 본문이 있어야 블록으로 인정
  const nonEmptyBody = bodyLines.filter((l) => l.code && !l.code.startsWith('#'));
  if (nonEmptyBody.length === 0) {
    return null;
  }

  return {
    type,
    headerLine: headerLine.lineNum,
    headerCode: headerLine.code,
    bodyLines,
    endLine,
    indentLevel: headerIndent,
  };
}

/**
 * 함수 정의에서 함수명과 파라미터 추출
 * 예: "def add(a, b):" → { name: "add", params: ["a", "b"] }
 */
export function parseFunctionHeader(
  code: string
): { name: string; params: { name: string; defaultValue?: string }[] } | null {
  const match = code.match(/^def\s+(\w+)\s*\((.*)\)\s*:/);
  if (!match) return null;

  const name = match[1];
  const paramsStr = match[2].trim();

  if (!paramsStr) {
    return { name, params: [] };
  }

  const params = parseParams(paramsStr);
  return { name, params };
}

/**
 * 클래스 정의에서 클래스명 추출
 * 예: "class Dog:" → { name: "Dog", baseClass: null }
 * 예: "class Dog(Animal):" → { name: "Dog", baseClass: "Animal" }
 */
export function parseClassHeader(
  code: string
): { name: string; baseClass: string | null } | null {
  // class Name(Base): 형태
  let match = code.match(/^class\s+(\w+)\s*\(\s*(\w*)\s*\)\s*:/);
  if (match) {
    return { name: match[1], baseClass: match[2] || null };
  }

  // class Name: 형태
  match = code.match(/^class\s+(\w+)\s*:/);
  if (match) {
    return { name: match[1], baseClass: null };
  }

  return null;
}

/**
 * 파라미터 문자열 파싱
 */
function parseParams(paramsStr: string): { name: string; defaultValue?: string }[] {
  const params: { name: string; defaultValue?: string }[] = [];
  const parts = splitByComma(paramsStr);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // 기본값이 있는 경우: param=value
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      params.push({
        name: trimmed.slice(0, eqIdx).trim(),
        defaultValue: trimmed.slice(eqIdx + 1).trim(),
      });
    } else {
      params.push({ name: trimmed });
    }
  }

  return params;
}

/**
 * 콤마로 분리 (중첩 괄호 고려)
 */
function splitByComma(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (const char of str) {
    if (inString) {
      current += char;
      if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth--;
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/**
 * 함수 호출 파싱
 * 예: "add(3, 5)" → { funcName: "add", args: ["3", "5"] }
 * 예: "obj.method(x)" → { objName: "obj", methodName: "method", args: ["x"] }
 */
export function parseFunctionCall(
  code: string
): {
  type: 'function' | 'method';
  objName?: string;
  funcName: string;
  args: string[];
} | null {
  // 메서드 호출: obj.method(args)
  const methodMatch = code.match(/^(\w+)\.(\w+)\s*\((.*)\)$/);
  if (methodMatch) {
    return {
      type: 'method',
      objName: methodMatch[1],
      funcName: methodMatch[2],
      args: splitByComma(methodMatch[3]),
    };
  }

  // 일반 함수 호출: func(args)
  const funcMatch = code.match(/^(\w+)\s*\((.*)\)$/);
  if (funcMatch) {
    return {
      type: 'function',
      funcName: funcMatch[1],
      args: splitByComma(funcMatch[2]),
    };
  }

  return null;
}

/**
 * 할당문에서 함수/메서드 호출 추출
 * 예: "result = add(3, 5)" → assignVar: "result", call: { funcName: "add", ... }
 */
export function parseAssignWithCall(
  code: string
): {
  assignVar: string;
  call: ReturnType<typeof parseFunctionCall>;
} | null {
  const match = code.match(/^(\w+)\s*=\s*(.+)$/);
  if (!match) return null;

  const assignVar = match[1];
  const expr = match[2].trim();

  const call = parseFunctionCall(expr);
  if (!call) return null;

  return { assignVar, call };
}
