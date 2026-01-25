/**
 * Python Class Definition Handler
 *
 * 클래스 정의 처리: class MyClass:
 *
 * 클래스 정의 시:
 * - 클래스 객체 생성
 * - 메서드들을 함수 객체로 생성
 * - 클래스명을 해당 객체에 바인딩
 */

import type {
  PyBlockHandler,
  PySimContext,
  PyStep,
  PyCodeLine,
  PyClassValue,
  PyFunctionValue,
  PyChange,
} from '../types';
import { parseClassHeader, parseFunctionHeader, getIndentLevel } from '../parser/block-parser';
import { extractDeclaredLocals } from './function-def.handler';

// 클래스 정의 패턴
const CLASS_DEF_PATTERN = /^class\s+\w+(\s*\(.*\))?\s*:$/;

export const ClassDefHandler: PyBlockHandler = {
  name: 'class-def',
  priority: 55,

  canHandle(code: string): boolean {
    return CLASS_DEF_PATTERN.test(code);
  },

  handleDefinition(
    ctx: PySimContext,
    lineNum: number,
    code: string,
    bodyLines: PyCodeLine[]
  ): PyStep | null {
    const parsed = parseClassHeader(code);
    if (!parsed) return null;

    const { name } = parsed;
    const changes: PyChange[] = [];

    // 메서드와 클래스 속성 추출
    const methods: Record<string, string> = {};
    const classAttributes: Record<string, string> = {};

    // 본문에서 메서드 정의 찾기
    const methodBlocks = extractMethodBlocks(bodyLines);

    for (const methodBlock of methodBlocks) {
      const methodParsed = parseFunctionHeader(methodBlock.header);
      if (!methodParsed) continue;

      // 메서드용 함수 객체 생성
      const paramNames = methodParsed.params.map((p) => p.name);
      const funcValue: PyFunctionValue = {
        name: methodParsed.name,
        params: methodParsed.params.map((p) => ({
          name: p.name,
          defaultValue: p.defaultValue,
        })),
        startLine: methodBlock.startLine,
        endLine: methodBlock.endLine,
        bodyLines: methodBlock.bodyLines,
        className: name,
        declaredLocals: extractDeclaredLocals(methodBlock.bodyLines, paramNames),
      };

      const funcObj = ctx.createObject('function', funcValue, false);
      methods[methodParsed.name] = funcObj.id;

      changes.push({ type: 'create', objectId: funcObj.id });
    }

    // 클래스 본문의 끝 줄 계산
    const endLine = bodyLines.length > 0
      ? bodyLines[bodyLines.length - 1].lineNum
      : lineNum;

    // 클래스 객체 값 생성
    const classValue: PyClassValue = {
      name,
      methods,
      classAttributes,
      startLine: lineNum,
      endLine,
    };

    // 클래스 객체 생성
    const classObj = ctx.createObject('class', classValue, false);
    classObj.highlight = true;

    // 클래스명을 글로벌 네임스페이스에 바인딩
    const pyName = ctx.bindName(name, classObj.id, 'global');
    pyName.highlight = true;

    changes.push(
      { type: 'create', objectId: classObj.id },
      { type: 'bind', name, objectId: classObj.id }
    );

    // 설명 생성
    const methodNames = Object.keys(methods);
    let explanation = `클래스 '${name}' 정의 - 클래스 객체 생성`;
    if (methodNames.length > 0) {
      explanation += ` (메서드: ${methodNames.join(', ')})`;
    }

    const step = ctx.createStep(lineNum, code, explanation);
    step.changes = changes;

    // 하이라이트 초기화
    setTimeout(() => {
      classObj.highlight = false;
      pyName.highlight = false;
    }, 0);

    return step;
  },
};

/**
 * 메서드 블록 정보
 */
interface MethodBlock {
  header: string;
  startLine: number;
  endLine: number;
  bodyLines: PyCodeLine[];
}

/**
 * 본문에서 메서드 블록 추출
 */
function extractMethodBlocks(bodyLines: PyCodeLine[]): MethodBlock[] {
  const methods: MethodBlock[] = [];
  let currentMethod: MethodBlock | null = null;
  let methodIndent = -1;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];

    // 빈 줄 처리
    if (!line.code) {
      if (currentMethod) {
        currentMethod.bodyLines.push(line);
      }
      continue;
    }

    // def로 시작하는 메서드 정의
    if (/^def\s+\w+\s*\(/.test(line.code)) {
      // 이전 메서드 저장
      if (currentMethod) {
        methods.push(currentMethod);
      }

      // 새 메서드 시작
      methodIndent = line.indent;
      currentMethod = {
        header: line.code,
        startLine: line.lineNum,
        endLine: line.lineNum,
        bodyLines: [],
      };
      continue;
    }

    // 현재 메서드의 본문
    if (currentMethod && line.indent > methodIndent) {
      currentMethod.bodyLines.push(line);
      currentMethod.endLine = line.lineNum;
    } else if (currentMethod && line.indent <= methodIndent) {
      // 메서드 종료
      methods.push(currentMethod);
      currentMethod = null;
      methodIndent = -1;

      // 다른 메서드가 아닌 클래스 레벨 코드 (속성 등)
      // 지금은 무시
    }
  }

  // 마지막 메서드 저장
  if (currentMethod) {
    methods.push(currentMethod);
  }

  return methods;
}
