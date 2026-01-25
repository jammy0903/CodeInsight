/**
 * Python Simulator
 *
 * Python 코드를 한 줄씩 시뮬레이션하여
 * Names → Objects 참조 관계를 추적
 *
 * 블록 기반 실행 지원 (함수, 클래스 정의)
 */

import type { PyStep, PySimContext, PyFunctionValue, PyCodeLine } from './types';
import { createPyContext, resolveNameToObject } from './context';
import { pyHandlerRegistry } from './handlers';
import { parseCode, type ParsedCode, type ParsedBlock } from './parser';

export interface PySimulateRequest {
  code: string;
  stdin?: string;
}

export interface PySimulateResult {
  success: boolean;
  steps: PyStep[];
  error?: string;
}

/**
 * Python 코드 시뮬레이션
 */
export function simulatePython(request: PySimulateRequest): PySimulateResult {
  const { code } = request;

  try {
    const ctx = createPyContext();
    const steps: PyStep[] = [];

    // 코드 파싱 (블록 구조 분석)
    const parsed = parseCode(code);

    // 메인 레벨 실행
    executeLines(ctx, parsed, steps);

    return {
      success: true,
      steps,
    };
  } catch (error) {
    return {
      success: false,
      steps: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 코드 라인들 실행
 */
function executeLines(
  ctx: PySimContext,
  parsed: ParsedCode,
  steps: PyStep[],
  startIdx = 0,
  endIdx?: number
): void {
  const lines = parsed.lines;
  const end = endIdx ?? lines.length;

  for (let i = startIdx; i < end; i++) {
    const line = lines[i];

    // 빈 줄, 주석 스킵
    if (!line.code || line.code.startsWith('#')) {
      continue;
    }

    // 현재 줄 설정
    ctx.currentLine = line.lineNum;

    // 블록 핸들러 확인 (함수/클래스 정의)
    const block = parsed.blocks.get(line.lineNum);
    if (block) {
      const step = handleBlock(ctx, block, parsed);
      if (step) {
        steps.push(step);
      }

      // 블록 끝으로 점프
      i = block.endLine - 1; // for loop이 1 증가시키므로
      continue;
    }

    // 일반 핸들러 확인
    const handler = pyHandlerRegistry.findHandler(line.code);

    if (handler) {
      const step = handler.handle(ctx, line.lineNum, line.code);
      if (step) {
        steps.push(step);

        // 함수 호출인 경우 본문 실행
        if (ctx.callStack.length > 0) {
          // 할당문인지 확인 (result = func(...))
          const assignMatch = line.code.match(/^(\w+)\s*=\s*/);
          const assignVar = assignMatch?.[1];

          const returnValue = executeFunctionBody(ctx, parsed, steps);

          // 반환값이 있고 할당 변수가 있으면 바인딩
          if (returnValue && assignVar) {
            // 현재 스코프에 바인딩 (함수 내부면 로컬, 아니면 글로벌)
            const scope = ctx.getCurrentScope();
            ctx.bindName(assignVar, returnValue.id, scope);

            // 반환값 바인딩 스텝 추가
            const bindStep = ctx.createStep(
              line.lineNum,
              `${assignVar} = <return value>`,
              `'${assignVar}'에 반환값 ${formatReturnValue(returnValue)} 바인딩`
            );
            steps.push(bindStep);
          }
        }
      }
    } else {
      // 처리할 수 없는 코드 - 기본 스텝 생성
      steps.push(ctx.createStep(line.lineNum, line.code, `실행: ${line.code}`));
    }
  }
}

/**
 * 반환값 포맷
 */
function formatReturnValue(obj: { type: string; value: unknown }): string {
  switch (obj.type) {
    case 'int':
    case 'float':
      return String(obj.value);
    case 'str':
      return `"${obj.value}"`;
    case 'bool':
      return obj.value ? 'True' : 'False';
    case 'NoneType':
      return 'None';
    default:
      return String(obj.value);
  }
}

/**
 * 블록 처리 (함수/클래스 정의)
 */
function handleBlock(
  ctx: PySimContext,
  block: ParsedBlock,
  parsed: ParsedCode
): PyStep | null {
  const blockHandler = pyHandlerRegistry.findBlockHandler(block.headerCode);

  if (blockHandler) {
    return blockHandler.handleDefinition(
      ctx,
      block.headerLine,
      block.headerCode,
      block.bodyLines
    );
  }

  return null;
}

/**
 * 함수 본문 실행
 * @returns 반환값 객체 (있는 경우)
 */
function executeFunctionBody(
  ctx: PySimContext,
  parsed: ParsedCode,
  steps: PyStep[]
): { id: string; type: string; value: unknown } | null {
  const frame = ctx.getCurrentFrame();
  if (!frame) return null;

  // 함수 객체에서 본문 가져오기
  const funcName = frame.functionName.split('.').pop() || frame.functionName;
  const className = frame.functionName.includes('.')
    ? frame.functionName.split('.')[0]
    : undefined;

  let bodyLines: PyCodeLine[] = [];

  if (className) {
    // 메서드인 경우
    const classResult = resolveNameToObject(ctx, className);
    if (classResult && classResult.object.type === 'class') {
      const classValue = classResult.object.value as any;
      const methodId = classValue.methods[funcName];
      if (methodId) {
        const methodObj = ctx.getObject(methodId);
        if (methodObj && methodObj.type === 'function') {
          bodyLines = (methodObj.value as PyFunctionValue).bodyLines;
        }
      }
    }
  } else {
    // 일반 함수
    const funcResult = resolveNameToObject(ctx, funcName);
    if (funcResult && funcResult.object.type === 'function') {
      bodyLines = (funcResult.object.value as PyFunctionValue).bodyLines;
    }
  }

  // 본문 실행
  let returnValue: { id: string; type: string; value: unknown } | null = null;

  for (const line of bodyLines) {
    if (!line.code || line.code.startsWith('#')) {
      continue;
    }

    ctx.currentLine = line.lineNum;

    const handler = pyHandlerRegistry.findHandler(line.code);

    if (handler) {
      const step = handler.handle(ctx, line.lineNum, line.code);
      if (step) {
        steps.push(step);

        // return 문인 경우 반환값 추출 후 함수 종료
        if (line.code.startsWith('return')) {
          returnValue = (step as any).returnValue || null;
          break;
        }

        // 중첩 함수 호출인 경우 재귀 실행
        if (ctx.callStack.length > frame.depth) {
          // 할당문인지 확인 (msg = func(...))
          const assignMatch = line.code.match(/^(\w+)\s*=\s*/);
          const assignVar = assignMatch?.[1];

          const nestedReturn = executeFunctionBody(ctx, parsed, steps);

          // 반환값이 있고 할당 변수가 있으면 현재 프레임에 바인딩
          if (nestedReturn && assignVar) {
            const scope = ctx.getCurrentScope();
            ctx.bindName(assignVar, nestedReturn.id, scope);

            // 바인딩 스텝 추가
            const bindStep = ctx.createStep(
              line.lineNum,
              `${assignVar} = <return value>`,
              `'${assignVar}'에 반환값 ${formatReturnValue(nestedReturn)} 바인딩`
            );
            steps.push(bindStep);
          }
        }
      }
    } else {
      steps.push(ctx.createStep(line.lineNum, line.code, `실행: ${line.code}`));
    }
  }

  return returnValue;
}

/**
 * Python 시뮬레이터 클래스 (확장용)
 */
export class PySimulator {
  private ctx: PySimContext;
  private steps: PyStep[] = [];

  constructor() {
    this.ctx = createPyContext();
  }

  /**
   * 코드 실행
   */
  run(code: string): PySimulateResult {
    return simulatePython({ code });
  }

  /**
   * 한 줄 실행
   */
  step(lineNum: number, code: string): PyStep | null {
    const trimmed = code.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return null;
    }

    const handler = pyHandlerRegistry.findHandler(trimmed);
    if (handler) {
      const step = handler.handle(this.ctx, lineNum, trimmed);
      if (step) {
        this.steps.push(step);
        return step;
      }
    }

    return null;
  }

  /**
   * 현재 상태 반환
   */
  getSteps(): PyStep[] {
    return this.steps;
  }

  /**
   * 컨텍스트 접근 (테스트용)
   */
  getContext(): PySimContext {
    return this.ctx;
  }
}
