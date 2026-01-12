/**
 * 교육용 C 메모리 시뮬레이터 v2
 * - 함수 호출/복귀 지원
 * - 모듈화된 구조 (parser + runtime + handlers)
 */

import { parseCode, type FunctionDef, type ParseResult } from './parser';
import { CallStack, ScopeManager, type Step, type MemoryBlock, type Variable, type HeapBlock } from './runtime';
import { registry, type SimContext } from './handlers';

class CSimulator implements SimContext {
  // 파싱 결과
  private parseResult: ParseResult | null = null;

  // 런타임
  private callStack: CallStack;
  private scopeManager: ScopeManager;

  // 힙 메모리
  heapBase = 0x555555559000;
  heapOffset = 0;
  heapBlocks: Map<string, HeapBlock> = new Map();

  // stdin
  stdinBuffer: string[] = [];
  stdinIndex = 0;

  // stdout (printf 출력 누적)
  stdoutBuffer: string = '';
  lastStdoutLength: number = 0; // 마지막 스텝까지의 stdout 길이

  // SimContext 호환용 (핸들러가 접근)
  stackBase = 0x7fffffffde00;
  stackOffset = 0;
  variables: Map<string, Variable>;

  constructor() {
    this.callStack = new CallStack();
    this.scopeManager = new ScopeManager(this.callStack);
    this.variables = this.scopeManager.getVariablesMap();
  }

  /**
   * 코드 시뮬레이션 실행
   */
  simulate(
    code: string,
    stdin = ''
  ): { success: boolean; steps: Step[]; source_lines: string[]; message: string } {
    // stdin 파싱
    this.stdinBuffer = stdin
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0);
    this.stdinIndex = 0;

    // 코드 파싱
    this.parseResult = parseCode(code);
    const { functions, sourceLines } = this.parseResult;

    // main 함수 찾기
    const mainFunc = functions.get('main');
    if (!mainFunc) {
      return {
        success: false,
        steps: [],
        source_lines: sourceLines,
        message: 'main 함수를 찾을 수 없습니다',
      };
    }

    // 실행
    const steps = this.executeFunction(mainFunc, sourceLines);

    return {
      success: true,
      steps,
      source_lines: sourceLines,
      message: '',
    };
  }

  /**
   * 함수 프레임 설정 (push + 매개변수 추가)
   * 재사용을 위해 분리
   */
  private setupFunctionFrame(
    func: FunctionDef,
    args: { name: string; value: number; type: string }[] = []
  ): void {
    // 콜 스택에 함수 프레임 추가
    const scope = this.callStack.push(func.name, -1, func.bodyStart);
    this.variables = scope.variables;

    // 매개변수를 지역 변수로 추가 (Pass by Value)
    for (let i = 0; i < func.params.length && i < args.length; i++) {
      const param = func.params[i];
      const arg = args[i];
      const size = this.getTypeSize(param.type);
      const addr = this.allocateStack(size);

      this.variables.set(param.name, {
        address: this.toHex(addr),
        type: param.type,
        size,
        bytes: this.intToBytes(arg.value, size),
        value: String(arg.value),
      });
    }
  }

  /**
   * 함수 실행
   * @param args 호출 시 전달된 인자값 배열
   * @param options.skipPush 이미 프레임이 push된 경우 true
   */
  private executeFunction(
    func: FunctionDef,
    sourceLines: string[],
    args: { name: string; value: number; type: string }[] = [],
    options: { skipPush?: boolean } = {}
  ): Step[] {
    const steps: Step[] = [];

    // 프레임 설정 (skipPush가 아닌 경우)
    if (!options.skipPush) {
      this.setupFunctionFrame(func, args);
    }

    // 함수 본문 실행
    for (let i = 0; i < func.lines.length; i++) {
      const line = func.lines[i];
      const lineNum = func.bodyStart + i + 1; // 실제 라인 번호

      const stripped = line.trim();
      if (!stripped || stripped === '{' || stripped === '}') continue;

      // 주석 무시
      if (stripped.startsWith('//')) continue;

      // return 처리
      if (stripped.startsWith('return')) {
        // main 함수에서 return 시 메모리 누수 검사
        if (func.name === 'main' && this.heapBlocks.size > 0) {
          const leakedBlocks = Array.from(this.heapBlocks.entries());
          const leakWarning = this.createMemoryLeakWarning(lineNum, leakedBlocks);
          steps.push(leakWarning);
        }

        steps.push(this.createStep(lineNum, stripped, '함수 종료 및 값 반환'));

        // 콜 스택에서 pop (main이 아닌 경우에만)
        if (this.callStack.depth() > 1) {
          this.callStack.pop();
          const parentScope = this.callStack.currentScope();
          if (parentScope) {
            this.variables = parentScope.variables;
          }
        }
        break;
      }

      // 반환값 할당 패턴: type var = func(args);
      const assignCallMatch = stripped.match(
        /^(unsigned\s+)?(\w+)\s+(\w+)\s*=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\);?$/
      );
      if (assignCallMatch) {
        const varType = (assignCallMatch[1] || '') + assignCallMatch[2];
        const varName = assignCallMatch[3];
        const calledFuncName = assignCallMatch[4];
        const argsString = assignCallMatch[5].trim();
        const calledFunc = this.parseResult?.functions.get(calledFuncName);

        if (calledFunc && !['printf', 'scanf', 'malloc', 'free'].includes(calledFuncName)) {
          const parsedArgs = this.parseArguments(argsString, calledFunc.params);

          // 1. 먼저 프레임 생성 (스텝에서 새 프레임이 보이도록)
          this.setupFunctionFrame(calledFunc, parsedArgs);

          const argsExplanation = parsedArgs.length > 0
            ? `\n   인자 전달: ${parsedArgs.map(a => `${a.name}=${a.value}`).join(', ')} (값 복사)`
            : '';

          // 2. 함수 호출 스텝 추가 (이제 스택에 새 프레임이 보임!)
          steps.push(
            this.createStep(
              lineNum,
              stripped,
              `📞 함수 호출 + 할당: ${varType} ${varName} = ${calledFuncName}(${argsString})\n\n` +
                `💡 ${calledFuncName} 함수를 호출하고 반환값을 ${varName}에 저장합니다.${argsExplanation}\n` +
                `   콜 스택 깊이: ${this.callStack.depth()}`
            )
          );

          // 3. 함수 실행 (skipPush: 이미 프레임 push됨)
          const { steps: innerSteps, returnValue } = this.executeFunctionWithReturn(calledFunc, sourceLines, parsedArgs, { skipPush: true });
          steps.push(...innerSteps);

          // 반환값을 변수에 할당
          const size = this.getTypeSize(varType);
          const addr = this.allocateStack(size);
          this.variables.set(varName, {
            address: this.toHex(addr),
            type: varType,
            size,
            bytes: this.intToBytes(returnValue, size),
            value: String(returnValue),
          });

          steps.push(
            this.createStep(
              lineNum,
              `// ${calledFuncName}() → ${varName} = ${returnValue}`,
              `↩️ ${calledFuncName}() 반환값 저장\n\n` +
                `💡 반환값 ${returnValue}이(가) ${varName}에 저장되었습니다.\n` +
                `   콜 스택 깊이: ${this.callStack.depth()}`
            )
          );

          continue;
        }
      }

      // 단순 함수 호출 감지: func(args);
      const funcCallMatch = stripped.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\);?$/);
      if (funcCallMatch) {
        const calledFuncName = funcCallMatch[1];
        const argsString = funcCallMatch[2].trim();
        const calledFunc = this.parseResult?.functions.get(calledFuncName);

        // 시스템 함수가 아닌 사용자 정의 함수인 경우
        if (calledFunc && !['printf', 'scanf', 'malloc', 'free'].includes(calledFuncName)) {
          // 인자 파싱 및 값 평가
          const parsedArgs = this.parseArguments(argsString, calledFunc.params);

          // 1. 먼저 프레임 생성 (스텝에서 새 프레임이 보이도록)
          this.setupFunctionFrame(calledFunc, parsedArgs);

          // 인자 전달 설명 생성
          const argsExplanation = parsedArgs.length > 0
            ? `\n   인자 전달: ${parsedArgs.map(a => `${a.name}=${a.value}`).join(', ')} (값 복사)`
            : '';

          // 2. 함수 호출 스텝 추가 (이제 스택에 새 프레임이 보임!)
          steps.push(
            this.createStep(
              lineNum,
              stripped,
              `📞 함수 호출: ${calledFuncName}(${argsString})\n\n` +
                `💡 ${calledFuncName} 함수로 진입합니다.${argsExplanation}\n` +
                `   콜 스택 깊이: ${this.callStack.depth()}`
            )
          );

          // 3. 함수 본문 실행 (skipPush: 이미 프레임 push됨)
          const innerSteps = this.executeFunction(calledFunc, sourceLines, parsedArgs, { skipPush: true });
          steps.push(...innerSteps);

          // 4. 복귀 스텝
          steps.push(
            this.createStep(
              lineNum,
              `// ${calledFuncName}() 복귀`,
              `↩️ ${calledFuncName}() 함수에서 복귀\n\n` +
                `💡 함수 실행이 완료되어 원래 위치로 돌아옵니다.\n` +
                `   콜 스택 깊이: ${this.callStack.depth()}`
            )
          );

          continue;
        }
      }

      // 일반 핸들러에 위임
      const cleanCode = stripped.replace(/;$/, '').trim();
      const step = this.analyzeLine(lineNum, cleanCode);
      if (step) steps.push(step);
    }

    return steps;
  }

  /**
   * 한 줄 분석 - 핸들러에 위임
   */
  private analyzeLine(lineNum: number, code: string): Step | null {
    // 폴백 지원 핸들러 찾기 (배열/포인터 구분)
    const handler = registry.findHandlerWithFallback(code, { variables: this.variables });
    if (handler) {
      return handler.handle(this, lineNum, code);
    }
    return null;
  }

  // === SimContext 인터페이스 구현 ===

  toHex(n: number): string {
    return '0x' + n.toString(16);
  }

  intToBytes(value: number, size: number): number[] {
    const bytes: number[] = [];
    if (value < 0) {
      value = value >>> 0;
    }
    for (let i = 0; i < size; i++) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  }

  allocateStack(size: number): number {
    return this.callStack.allocateStack(size);
  }

  allocateHeap(size: number): number {
    const addr = this.heapBase + this.heapOffset;
    this.heapOffset += size;
    return addr;
  }

  getTypeSize(typeName: string): number {
    // TypeRegistry에서 타입 크기 조회
    const typeMap: Record<string, number> = {
      'int': 4,
      'float': 4,
      'double': 8,
      'char': 1,
      'short': 2,
      'long': 8,
      'long long': 8,
      'unsigned int': 4,
      'unsigned char': 1,
      'unsigned short': 2,
      'unsigned long': 8,
      'void': 0,
    };
    // 포인터 타입은 8바이트 (64bit)
    if (typeName.includes('*')) return 8;
    return typeMap[typeName] || 4;
  }

  /**
   * 함수 실행 (반환값 포함)
   * - executeFunction과 동일하지만 return 값을 캡처
   * @param options.skipPush 이미 프레임이 push된 경우 true
   */
  private executeFunctionWithReturn(
    func: FunctionDef,
    sourceLines: string[],
    args: { name: string; value: number; type: string }[] = [],
    options: { skipPush?: boolean } = {}
  ): { steps: Step[]; returnValue: number } {
    const steps: Step[] = [];
    let returnValue = 0;

    // 프레임 설정 (skipPush가 아닌 경우)
    if (!options.skipPush) {
      this.setupFunctionFrame(func, args);
    }

    // 함수 본문 실행
    for (let i = 0; i < func.lines.length; i++) {
      const line = func.lines[i];
      const lineNum = func.bodyStart + i + 1;

      const stripped = line.trim();
      if (!stripped || stripped === '{' || stripped === '}') continue;
      if (stripped.startsWith('//')) continue;

      // return 처리 (값 캡처)
      if (stripped.startsWith('return')) {
        const returnMatch = stripped.match(/^return\s+(.+?)\s*;?$/);
        if (returnMatch) {
          returnValue = this.evaluateExpression(returnMatch[1]);
        }

        steps.push(
          this.createStep(
            lineNum,
            stripped,
            `↩️ 함수 종료: return ${returnValue}\n\n` +
              `💡 ${func.name} 함수가 ${returnValue}을(를) 반환하고 종료합니다.`
          )
        );

        // 콜 스택에서 pop
        if (this.callStack.depth() > 1) {
          this.callStack.pop();
          const parentScope = this.callStack.currentScope();
          if (parentScope) {
            this.variables = parentScope.variables;
          }
        }
        break;
      }

      // 일반 코드 처리
      const cleanCode = stripped.replace(/;$/, '').trim();
      const step = this.analyzeLine(lineNum, cleanCode);
      if (step) steps.push(step);
    }

    return { steps, returnValue };
  }

  /**
   * 함수 호출 인자 파싱
   * - 인자 문자열을 파싱하여 값으로 평가
   * - 변수 참조 시 현재 스코프에서 값 조회
   */
  private parseArguments(
    argsString: string,
    params: { name: string; type: string }[]
  ): { name: string; value: number; type: string }[] {
    if (!argsString) return [];

    const argTokens = argsString.split(',').map(s => s.trim());
    const result: { name: string; value: number; type: string }[] = [];

    for (let i = 0; i < argTokens.length && i < params.length; i++) {
      const argExpr = argTokens[i];
      const param = params[i];
      const value = this.evaluateExpression(argExpr);

      result.push({
        name: param.name,
        value,
        type: param.type,
      });
    }

    return result;
  }

  /**
   * 식 평가 (변수, 리터럴, 간단한 연산)
   */
  private evaluateExpression(expr: string): number {
    const trimmed = expr.trim();

    // 숫자 리터럴
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    // 16진수 리터럴
    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      return parseInt(trimmed, 16);
    }

    // 문자 리터럴
    if (/^'(.)'$/.test(trimmed)) {
      return trimmed.charCodeAt(1);
    }

    // 변수 참조
    const variable = this.variables.get(trimmed);
    if (variable) {
      return parseFloat(variable.value) || 0;
    }

    // 간단한 이항 연산 (a + b, a - b, a * b, a / b)
    const binOpMatch = trimmed.match(/^(.+?)\s*([+\-*/])\s*(.+)$/);
    if (binOpMatch) {
      const left = this.evaluateExpression(binOpMatch[1]);
      const op = binOpMatch[2];
      const right = this.evaluateExpression(binOpMatch[3]);
      switch (op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right !== 0 ? left / right : 0;
      }
    }

    return 0;
  }

  appendStdout(text: string): void {
    this.stdoutBuffer += text;
  }

  /**
   * 메모리 누수 경고 스텝 생성
   */
  private createMemoryLeakWarning(
    lineNum: number,
    leakedBlocks: [string, HeapBlock][]
  ): Step {
    const totalBytes = leakedBlocks.reduce((sum, [, block]) => sum + block.size, 0);
    const blockList = leakedBlocks
      .map(([name, block]) => `   • ${name}: ${block.size}바이트 @ ${block.address}`)
      .join('\n');

    const explanation = `🚨 메모리 누수 감지! (Memory Leak)

⚠️ 해제되지 않은 힙 메모리:
${blockList}

📊 총 누수: ${totalBytes}바이트 (${leakedBlocks.length}개 블록)

💡 원인: malloc()으로 할당한 메모리를 free()로 해제하지 않음

🔧 해결 방법:
   • 프로그램 종료 전 모든 malloc에 대해 free() 호출
   • 할당된 포인터를 추적하는 변수 관리 필요

⚡ 메모리 누수의 위험:
   • 장시간 실행 시 메모리 고갈
   • 시스템 성능 저하
   • 심한 경우 프로그램 크래시`;

    return {
      line: lineNum,
      code: '// ⚠️ MEMORY LEAK WARNING',
      stack: [],
      heap: leakedBlocks.map(([name, block]) => ({
        name: `*${name} (LEAKED!)`,
        address: block.address,
        type: block.type,
        size: block.size,
        bytes: block.bytes,
        value: block.value,
        points_to: null,
        explanation: '해제되지 않은 메모리',
      })),
      explanation,
      rsp: this.callStack.getRsp(),
      rbp: this.callStack.getRbp(),
      functionName: 'main',
      callDepth: 1,
    };
  }

  createStep(lineNum: number, code: string, explanation: string): Step {
    // 모든 스코프의 변수 수집 (이름과 함께)
    const allVariables = this.callStack.getAllVariables();

    const stack: MemoryBlock[] = allVariables.map(([name, v]) => ({
      name,
      address: v.address,
      type: v.type,
      size: v.size,
      bytes: v.bytes,
      value: v.value,
      points_to: v.points_to || null,
      explanation: '',
    }));

    const heap: MemoryBlock[] = [];
    for (const [name, block] of this.heapBlocks) {
      heap.push({
        name: `*${name}`,
        address: block.address,
        type: block.type,
        size: block.size,
        bytes: block.bytes,
        value: block.value,
        points_to: null,
        explanation: '',
      });
    }

    // 이번 스텝에서 새로 추가된 stdout만 추출
    const newStdout = this.stdoutBuffer.length > this.lastStdoutLength
      ? this.stdoutBuffer.slice(this.lastStdoutLength)
      : undefined;

    // 다음 스텝을 위해 길이 업데이트
    this.lastStdoutLength = this.stdoutBuffer.length;

    return {
      line: lineNum,
      code,
      stack,
      heap,
      explanation,
      rsp: this.callStack.getRsp(),
      rbp: this.callStack.getRbp(),
      functionName: this.callStack.currentFunction(),
      callDepth: this.callStack.depth(),
      stdout: newStdout,
    };
  }
}

/**
 * 코드 시뮬레이션 함수 (외부 API)
 */
export function simulateCode(
  code: string,
  stdin = ''
): {
  success: boolean;
  steps: Step[];
  source_lines: string[];
  error?: string;
  message?: string;
} {
  try {
    const sim = new CSimulator();
    return sim.simulate(code, stdin);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      success: false,
      steps: [],
      source_lines: [],
      error: 'simulation_error',
      message,
    };
  }
}

// 타입 re-export
export type { Step, MemoryBlock } from './runtime';
