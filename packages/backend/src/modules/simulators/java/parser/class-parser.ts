/**
 * Java Class Parser
 * 교육용으로 간략화된 Java 코드 파서
 *
 * 지원 패턴:
 * - public class Main { ... }
 * - public static void main(String[] args) { ... }
 * - private int age;
 * - public static int add(int a, int b) { ... }
 */

import {
  ParsedClass,
  ParsedMethod,
  ParsedField,
  ParsedParameter,
  JavaType
} from '../runtime/types';

// 클래스 정의 패턴
const CLASS_PATTERN = /^(public|private)?\s*class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{?\s*$/;

// 메서드 정의 패턴
const METHOD_PATTERN = /^(public|private|protected)?\s*(static)?\s*([a-zA-Z_][a-zA-Z0-9_\[\]]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{?\s*$/;

// 필드 정의 패턴
const FIELD_PATTERN = /^(public|private|protected)?\s*(static)?\s*([a-zA-Z_][a-zA-Z0-9_\[\]]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;?\s*$/;

// 파라미터 패턴 (Java)
const PARAM_PATTERN = /^\s*([a-zA-Z_][a-zA-Z0-9_\[\]]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/;

/**
 * 파라미터 문자열 파싱
 * "int a, String b" → [{ name: "a", type: "int" }, { name: "b", type: "String" }]
 * "String[] args" → [{ name: "args", type: "String[]" }]
 */
function parseParams(paramsStr: string): ParsedParameter[] {
  if (!paramsStr.trim()) {
    return [];
  }

  const params: ParsedParameter[] = [];
  const parts = paramsStr.split(',');

  for (const part of parts) {
    const match = part.trim().match(PARAM_PATTERN);
    if (match) {
      const type = match[1].trim() as JavaType;
      const name = match[2].trim();

      params.push({ name, type });
    }
  }

  return params;
}

/**
 * 중괄호 매칭으로 블록 끝 찾기
 */
function findBlockEnd(lines: string[], startLine: number): number {
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
 * 접근 제어자 추출
 */
function extractAccessModifier(modifier?: string): 'public' | 'private' | 'protected' | 'default' {
  if (modifier === 'public') return 'public';
  if (modifier === 'private') return 'private';
  if (modifier === 'protected') return 'protected';
  return 'default';
}

/**
 * 메서드 본문 추출 (중괄호 안의 라인들)
 */
function extractMethodBody(lines: string[], startLine: number, endLine: number): string[] {
  const bodyLines: string[] = [];
  let insideBody = false;

  for (let i = startLine; i <= endLine; i++) {
    const line = lines[i].trim();

    // 첫 { 찾기
    if (!insideBody && line.includes('{')) {
      insideBody = true;
      // { 이후 내용이 있으면 추가
      const afterBrace = line.substring(line.indexOf('{') + 1).trim();
      if (afterBrace && !afterBrace.startsWith('}')) {
        bodyLines.push(afterBrace);
      }
      continue;
    }

    // 마지막 } 찾기
    if (insideBody && line.includes('}')) {
      // } 이전 내용이 있으면 추가
      const beforeBrace = line.substring(0, line.indexOf('}')).trim();
      if (beforeBrace) {
        bodyLines.push(beforeBrace);
      }
      break;
    }

    // 본문 라인 추가
    if (insideBody && line) {
      bodyLines.push(line);
    }
  }

  return bodyLines;
}

/**
 * Java 코드 파싱
 */
export function parseJavaCode(code: string): ParsedClass {
  const lines = code.split('\n');

  let className = 'Main'; // 기본값
  const fields: ParsedField[] = [];
  const methods: ParsedMethod[] = [];

  let i = 0;
  let insideClass = false;

  while (i < lines.length) {
    const line = lines[i].trim();

    // 빈 줄이나 주석 스킵
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      i++;
      continue;
    }

    // 클래스 정의 찾기
    const classMatch = line.match(CLASS_PATTERN);
    if (classMatch) {
      className = classMatch[2];
      insideClass = true;
      i++;
      continue;
    }

    if (!insideClass) {
      i++;
      continue;
    }

    // 메서드 정의 찾기
    const methodMatch = line.match(METHOD_PATTERN);
    if (methodMatch) {
      const accessModifier = extractAccessModifier(methodMatch[1]);
      const isStatic = methodMatch[2] === 'static';
      const returnType = methodMatch[3].trim() as JavaType;
      const methodName = methodMatch[4].trim();
      const paramsStr = methodMatch[5].trim();

      const parameters = parseParams(paramsStr);

      // 메서드 본문 찾기
      const endLine = findBlockEnd(lines, i);
      const bodyLines = extractMethodBody(lines, i, endLine);

      methods.push({
        name: methodName,
        returnType,
        parameters,
        lines: bodyLines,
        isStatic,
        accessModifier
      });

      i = endLine + 1;
      continue;
    }

    // 필드 정의 찾기
    const fieldMatch = line.match(FIELD_PATTERN);
    if (fieldMatch) {
      const accessModifier = extractAccessModifier(fieldMatch[1]);
      const isStatic = fieldMatch[2] === 'static';
      const type = fieldMatch[3].trim() as JavaType;
      const name = fieldMatch[4].trim();

      fields.push({
        name,
        type,
        isStatic,
        accessModifier
      });

      i++;
      continue;
    }

    i++;
  }

  return {
    className,
    fields,
    methods
  };
}

/**
 * main 메서드 찾기
 */
export function findMainMethod(parsedClass: ParsedClass): ParsedMethod | undefined {
  return parsedClass.methods.find(
    m => m.name === 'main' && m.isStatic && m.returnType === 'void'
  );
}

/**
 * 특정 메서드 찾기
 */
export function findMethod(parsedClass: ParsedClass, methodName: string): ParsedMethod | undefined {
  return parsedClass.methods.find(m => m.name === methodName);
}

/**
 * 소스 라인 추출 (디버깅/시각화용)
 */
export function extractSourceLines(code: string): string[] {
  return code.split('\n').map(line => line.trimEnd());
}
