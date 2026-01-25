/**
 * Python Function Definition Handler
 *
 * 함수 정의 처리: def func(params):
 *
 * Python에서 함수 정의는:
 * - 함수 객체를 생성
 * - 함수명을 해당 객체에 바인딩
 */

import type {
  PyBlockHandler,
  PySimContext,
  PyStep,
  PyCodeLine,
  PyFunctionValue,
  PyChange,
} from '../types';
import { parseFunctionHeader } from '../parser/block-parser';

// 함수 정의 패턴: def name(params):
const FUNCTION_DEF_PATTERN = /^def\s+\w+\s*\(.*\)\s*:$/;

export const FunctionDefHandler: PyBlockHandler = {
  name: 'function-def',
  priority: 50,

  canHandle(code: string): boolean {
    return FUNCTION_DEF_PATTERN.test(code);
  },

  handleDefinition(
    ctx: PySimContext,
    lineNum: number,
    code: string,
    bodyLines: PyCodeLine[]
  ): PyStep | null {
    const parsed = parseFunctionHeader(code);
    if (!parsed) return null;

    const { name, params } = parsed;

    // 함수 본문의 끝 줄 계산
    const endLine = bodyLines.length > 0
      ? bodyLines[bodyLines.length - 1].lineNum
      : lineNum;

    // 함수 객체 값 생성
    const funcValue: PyFunctionValue = {
      name,
      params: params.map((p) => ({
        name: p.name,
        defaultValue: p.defaultValue,
      })),
      startLine: lineNum,
      endLine,
      bodyLines: bodyLines.filter((l) => l.code), // 빈 줄 제외
    };

    // 함수 객체 생성
    const funcObj = ctx.createObject('function', funcValue, false);
    funcObj.highlight = true;

    // 함수명을 글로벌 네임스페이스에 바인딩
    const pyName = ctx.bindName(name, funcObj.id, 'global');
    pyName.highlight = true;

    // 변경 사항
    const changes: PyChange[] = [
      { type: 'create', objectId: funcObj.id },
      { type: 'bind', name, objectId: funcObj.id },
    ];

    // 설명 생성
    const paramNames = params.map((p) => p.name).join(', ');
    const explanation = `함수 '${name}(${paramNames})' 정의 - 함수 객체 생성 및 이름 바인딩`;

    const step = ctx.createStep(lineNum, code, explanation);
    step.changes = changes;

    // 하이라이트 초기화
    setTimeout(() => {
      funcObj.highlight = false;
      pyName.highlight = false;
    }, 0);

    return step;
  },
};
