/**
 * 교육용 C 메모리 시뮬레이터 v3
 * - ExpressionEvaluator: 식 평가 (재사용 가능)
 * - FrameManager: 스택 프레임 생명주기
 * - ParameterSetup: 파라미터 타입별 처리
 * - Event-Driven Visualization 지원
 */

import { parseCode, type FunctionDef, type ParseResult } from './parser';
import { CallStack, ScopeManager, type Step, type MemoryBlock, type Variable, type HeapBlock } from './runtime';
import { registry, type SimContext } from './handlers';
import { ExpressionEvaluator, type EvalContext } from './evaluator';
import { FrameManager, ParameterSetup } from './execution';
import { clearStructDefs } from './handlers/struct.handler';
import type { VisualizationEvent } from '@codeinsight/shared';

/**
 * 이전 스텝 상태 스냅샷 (diff 계산용)
 */
interface PreviousSnapshot {
  frames: string[];
  variables: Map<string, string>;
  heapBlocks: Map<string, string>;
  stdout: string;
}

class CSimulator implements SimContext, EvalContext {
  // 파싱 결과
  private parseResult: ParseResult | null = null;

  // 런타임
  private callStack: CallStack;
  private scopeManager: ScopeManager;

  // ⭐ 새로운 모듈들
  evaluator!: ExpressionEvaluator;
  private frameManager: FrameManager;
  private parameterSetup!: ParameterSetup;

  // 힙 메모리
  heapBase = 0x555555559000;
  heapOffset = 0;
  heapBlocks: Map<string, HeapBlock> = new Map();

  // stdin
  stdinBuffer: string[] = [];
  stdinIndex = 0;

  // stdout
  stdoutBuffer: string = '';
  lastStdoutLength: number = 0;

  // SimContext 호환
  stackBase = 0x7fffffffde00;
  stackOffset = 0;
  variables: Map<string, Variable>;

  // Event-Driven
  private previousSnapshot: PreviousSnapshot = {
    frames: [],
    variables: new Map(),
    heapBlocks: new Map(),
    stdout: '',
  };
  private handlerEvents: VisualizationEvent[] = [];

  constructor() {
    this.callStack = new CallStack();
    this.scopeManager = new ScopeManager(this.callStack);
    this.variables = this.scopeManager.getVariablesMap();

    // 새 모듈 초기화
    this.frameManager = new FrameManager(this.callStack);
    this.evaluator = new ExpressionEvaluator(this);
    this.parameterSetup = new ParameterSetup(this.evaluator, this);
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

    // 이전 실행 잔여 struct 정의 정리
    clearStructDefs();

    // 전역 struct 정의 사전 처리 (함수 바깥의 struct 정의를 스캔)
    this.preprocessGlobalStructs(sourceLines);

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

    // 1. 전처리기(#include 등) 스텝 생성
    const preprocessorSteps = this.createPreprocessorSteps(sourceLines);

    // 2. main() 함수 진입 스텝 생성 (프레임 설정 포함)
    const mainEntryStep = this.createFunctionEntryStep(mainFunc);

    // 3. 함수 본문 실행 (프레임은 이미 설정됨)
    const execSteps = this.executeFunction(mainFunc, sourceLines, [], { skipPush: true });

    // 전체 스텝 합치기
    const allSteps = [...preprocessorSteps, mainEntryStep, ...execSteps];

    return {
      success: true,
      steps: allSteps,
      source_lines: sourceLines,
      message: '',
    };
  }

  /**
   * 전처리기 지시문 스텝 생성 (#include, #define 등)
   */
  private createPreprocessorSteps(sourceLines: string[]): Step[] {
    const steps: Step[] = [];
    const includes: { line: number; header: string; isStd: boolean }[] = [];

    // #include 라인 수집
    for (let i = 0; i < sourceLines.length; i++) {
      const line = sourceLines[i].trim();
      if (line.startsWith('#include')) {
        const stdMatch = line.match(/#include\s*<([^>]+)>/);
        const localMatch = line.match(/#include\s*"([^"]+)"/);

        if (stdMatch) {
          includes.push({ line: i + 1, header: stdMatch[1], isStd: true });
        } else if (localMatch) {
          includes.push({ line: i + 1, header: localMatch[1], isStd: false });
        }
      }
    }

    // #include가 있으면 설명 스텝 생성
    if (includes.length > 0) {
      const firstInclude = includes[0];
      const includeList = includes
        .map(inc => `   • ${inc.isStd ? '<' + inc.header + '>' : '"' + inc.header + '"'}`)
        .join('\n');

      const headerExplanations = includes.map(inc => {
        if (inc.header === 'stdio.h') {
          return '   - stdio.h: printf, scanf 등 입출력 함수';
        } else if (inc.header === 'stdlib.h') {
          return '   - stdlib.h: malloc, free 등 메모리/유틸리티 함수';
        } else if (inc.header === 'string.h') {
          return '   - string.h: strcpy, strlen 등 문자열 함수';
        } else if (inc.header === 'math.h') {
          return '   - math.h: sqrt, pow 등 수학 함수';
        } else {
          return `   - ${inc.header}: 사용자/외부 헤더 파일`;
        }
      }).join('\n');

      steps.push({
        line: firstInclude.line,
        code: sourceLines[firstInclude.line - 1].trim(),
        stack: [],
        heap: [],
        explanation: `📚 전처리기 지시문 (Preprocessor Directive)

#include는 컴파일 전에 헤더 파일의 내용을 포함시킵니다.

📦 포함된 헤더 파일:
${includeList}

💡 각 헤더의 역할:
${headerExplanations}

⚙️ 이 단계는 컴파일 전에 처리되며, 실행 시간에는 영향을 주지 않습니다.`,
        rsp: this.toHex(this.stackBase),
        rbp: this.toHex(this.stackBase),
        functionName: '(global)',
        callDepth: 0,
      });
    }

    return steps;
  }

  /**
   * 전역 struct 정의 사전 처리
   * 함수 바깥의 struct 정의를 찾아 StructHandler에 위임
   * 멀티라인 struct도 한 줄로 병합하여 처리
   */
  private preprocessGlobalStructs(sourceLines: string[]): void {
    // 함수 영역을 파악 (함수 본문 내부인지 판별용)
    const functionRanges: Array<{ start: number; end: number }> = [];
    if (this.parseResult) {
      for (const [, func] of this.parseResult.functions) {
        // bodyStart/bodyEnd는 1-indexed
        functionRanges.push({ start: func.bodyStart, end: func.bodyEnd });
      }
    }

    const isInsideFunction = (lineIdx: number): boolean => {
      const lineNum = lineIdx + 1; // 1-indexed
      return functionRanges.some((r) => lineNum >= r.start && lineNum <= r.end);
    };

    let i = 0;
    while (i < sourceLines.length) {
      if (isInsideFunction(i)) {
        i++;
        continue;
      }

      const line = sourceLines[i].trim();

      // struct 키워드로 시작하고 멤버 정의를 포함하는 패턴 감지
      if (/^struct\s+\w+\s*\{/.test(line)) {
        // 한 줄에 완결되는 경우: struct Point { int x; int y; };
        if (/\}/.test(line)) {
          const cleanCode = line.replace(/;$/, '').trim();
          this.analyzeLine(i + 1, cleanCode);
          i++;
          continue;
        }

        // 멀티라인 struct: 닫는 }까지 병합
        let merged = line;
        let j = i + 1;
        while (j < sourceLines.length) {
          const nextLine = sourceLines[j].trim();
          merged += ' ' + nextLine;
          if (nextLine.includes('}')) {
            break;
          }
          j++;
        }

        // 병합된 한 줄을 정리하고 analyzeLine에 전달
        const cleanMerged = merged.replace(/\s+/g, ' ').replace(/;$/, '').trim();
        this.analyzeLine(i + 1, cleanMerged);
        i = j + 1;
        continue;
      }

      i++;
    }
  }

  /**
   * 함수 진입 스텝 생성
   */
  private createFunctionEntryStep(func: FunctionDef): Step {
    const paramsDesc = func.params.length > 0
      ? func.params.map(p => `${p.type} ${p.name}`).join(', ')
      : 'void';

    const explanation = func.name === 'main'
      ? `🚀 프로그램 시작: main() 함수 진입

C 프로그램의 실행은 항상 main() 함수에서 시작됩니다.

📌 함수 시그니처: ${func.returnType} ${func.name}(${paramsDesc})

💡 main 함수의 역할:
   • 프로그램의 진입점 (Entry Point)
   • 운영체제가 프로그램을 실행할 때 호출
   • 반환값 0: 정상 종료
   • 반환값 0 이외: 오류 발생

📍 스택 프레임이 생성되고 지역 변수들이 여기에 저장됩니다.`
      : `📞 함수 진입: ${func.name}()

${func.returnType} ${func.name}(${paramsDesc})

💡 새로운 스택 프레임이 생성됩니다.`;

    // main 함수 시작 시 프레임 설정 (setupFunctionFrame 대신 여기서 처리)
    const setupEvents = this.setupFunctionFrame(func, []);
    setupEvents.forEach(e => this.addEvent(e));

    // 이벤트 캡처 후 초기화
    const events = [...this.handlerEvents];
    this.handlerEvents = [];

    return {
      line: func.bodyStart,
      code: `${func.returnType} ${func.name}(${paramsDesc}) {`,
      stack: [{
        name: func.name,
        address: this.frameManager.getRbp(),
        type: 'frame',
        size: 0,
        bytes: [],
        value: 'frame',
        points_to: null,
        explanation: `${func.name}() 스택 프레임`,
      }],
      heap: [],
      explanation,
      rsp: this.frameManager.getRsp(),
      rbp: this.frameManager.getRbp(),
      functionName: func.name,
      callDepth: this.frameManager.getDepth(),
      events,
    };
  }

  /**
   * 호출된 함수의 진입 스텝 생성 (main이 아닌 사용자 정의 함수용)
   * 프레임 설정 후 호출해야 함 (이미 새 프레임 컨텍스트에서)
   */
  private createCalleeEntryStep(func: FunctionDef, argExprs: string[]): Step {
    const paramsDesc = func.params.length > 0
      ? func.params.map(p => `${p.type} ${p.name}`).join(', ')
      : 'void';

    // 파라미터 전달 설명
    const paramDetails = func.params.map((p, i) => {
      const argExpr = argExprs[i] || '?';
      const variable = this.variables.get(p.name);
      const value = variable?.value || '?';
      return `   • ${p.name} = ${value} (from ${argExpr})`;
    }).join('\n');

    const explanation = `📥 함수 진입: ${func.name}()

${func.returnType} ${func.name}(${paramsDesc})

💡 새로운 스택 프레임이 생성되었습니다.
   콜 스택 깊이: ${this.callStack.depth()}

${func.params.length > 0 ? `📋 전달받은 파라미터:\n${paramDetails}` : '📋 파라미터 없음'}`;

    // 이벤트 캡처 후 초기화
    const events = [...this.handlerEvents];
    this.handlerEvents = [];

    return {
      line: func.bodyStart,
      code: `${func.returnType} ${func.name}(${paramsDesc}) {`,
      stack: this.buildStackSnapshot(),
      heap: this.buildHeapSnapshot(),
      explanation,
      rsp: this.frameManager.getRsp(),
      rbp: this.frameManager.getRbp(),
      functionName: func.name,
      callDepth: this.frameManager.getDepth(),
      events,
    };
  }

  /**
   * 현재 스택 상태 스냅샷 생성
   */
  private buildStackSnapshot(): MemoryBlock[] {
    const allVariables = this.frameManager.getAllVariables();
    return allVariables.map(([name, v]) => ({
      name,
      address: v.address,
      type: v.type,
      size: v.size,
      bytes: v.bytes,
      value: v.value,
      points_to: v.points_to || null,
      explanation: '',
    }));
  }

  /**
   * 현재 힙 상태 스냅샷 생성
   */
  private buildHeapSnapshot(): MemoryBlock[] {
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
    return heap;
  }

  /**
   * 함수 프레임 설정 (FrameManager + ParameterSetup 사용)
   */
  private setupFunctionFrame(
    func: FunctionDef,
    argExprs: string[] = []
  ): VisualizationEvent[] {
    // 1. 프레임 생성
    const frameResult = this.frameManager.enter(func.name, -1, func.bodyStart);
    this.variables = frameResult.scopeVariables;

    // Evaluator 컨텍스트 업데이트
    this.evaluator.updateContext(this);

    const allEvents: VisualizationEvent[] = [...frameResult.events];

    // 2. 파라미터 설정
    for (let i = 0; i < func.params.length && i < argExprs.length; i++) {
      const param = func.params[i];
      const argExpr = argExprs[i];

      try {
        const paramResult = this.parameterSetup.setup(param, argExpr);

        // 변수 맵에 추가
        this.variables.set(param.name, paramResult.variable);

        // 이벤트 수집
        allEvents.push(...paramResult.events);
      } catch (e) {
        console.error(`[setupFunctionFrame] Error setting param ${param.name}:`, e);
      }
    }

    return allEvents;
  }

  /**
   * 함수 실행
   */
  private executeFunction(
    func: FunctionDef,
    sourceLines: string[],
    argExprs: string[] = [],
    options: { skipPush?: boolean } = {}
  ): Step[] {
    const steps: Step[] = [];

    // 프레임 설정
    if (!options.skipPush) {
      const setupEvents = this.setupFunctionFrame(func, argExprs);
      // 이벤트는 첫 번째 스텝에서 사용됨
      setupEvents.forEach(e => this.addEvent(e));
    }

    // 함수 본문 실행
    // func.bodyStart는 함수 선언 라인 (예: "int main() {")
    // func.lines[0]은 본문 첫 줄이므로 실제 라인 번호는 bodyStart + 1 + i
    for (let i = 0; i < func.lines.length; i++) {
      const line = func.lines[i];
      const lineNum = func.bodyStart + 1 + i;

      const stripped = line.trim();
      if (!stripped || stripped === '{' || stripped === '}') continue;
      if (stripped.startsWith('//')) continue;

      // return 처리
      if (stripped.startsWith('return')) {
        if (func.name === 'main' && this.heapBlocks.size > 0) {
          const leakedBlocks = Array.from(this.heapBlocks.entries());
          steps.push(this.createMemoryLeakWarning(lineNum, leakedBlocks));
        }

        steps.push(this.createStep(lineNum, stripped, '함수 종료 및 값 반환'));

        // 프레임 정리
        if (this.callStack.depth() > 1) {
          const exitResult = this.frameManager.exit();
          this.variables = this.frameManager.getParentVariables() || new Map();
          this.evaluator.updateContext(this);
          exitResult.events.forEach(e => this.addEvent(e));
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
          // 인자 표현식 파싱 (값이 아닌 표현식 문자열)
          const argExprs = this.parseArgumentExpressions(argsString);
          const argsExplanation = this.buildArgsExplanation(calledFunc.params, argExprs);

          // 1. 호출 스텝 생성 (프레임 변경 전, 호출자 컨텍스트에서)
          //    함수 호출은 한 번만 설명하고, 바로 내부 실행으로 진입
          steps.push(
            this.createStep(
              lineNum,
              stripped,
              `📞 함수 호출: ${varType} ${varName} = ${calledFuncName}(${argsString})\n\n` +
                `💡 ${calledFuncName} 함수를 호출하고 반환값을 ${varName}에 저장합니다.${argsExplanation}`
            )
          );

          // 2. 프레임 설정
          const setupEvents = this.setupFunctionFrame(calledFunc, argExprs);
          setupEvents.forEach(e => this.addEvent(e));

          // 3. 함수 본문 실행 (진입 스텝 없이 바로 실행)
          const { steps: innerSteps, returnValue } = this.executeFunctionWithReturn(
            calledFunc, sourceLines, argExprs, { skipPush: true }
          );
          steps.push(...innerSteps);

          // 4. 반환값 할당 (스텝 생성 없이 내부 처리만)
          const size = this.getTypeSize(varType);
          const addr = this.allocateStack(size);
          this.variables.set(varName, {
            address: this.toHex(addr),
            type: varType,
            size,
            bytes: this.intToBytes(returnValue, size),
            value: String(returnValue),
          });

          continue;
        }
      }

      // 단순 함수 호출: func(args);
      const funcCallMatch = stripped.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\);?$/);
      if (funcCallMatch) {
        const calledFuncName = funcCallMatch[1];
        const argsString = funcCallMatch[2].trim();
        const calledFunc = this.parseResult?.functions.get(calledFuncName);

        if (calledFunc && !['printf', 'scanf', 'malloc', 'free'].includes(calledFuncName)) {
          const argExprs = this.parseArgumentExpressions(argsString);
          const argsExplanation = this.buildArgsExplanation(calledFunc.params, argExprs);

          // 1. 호출 스텝 생성 (프레임 변경 전, 호출자 컨텍스트에서)
          //    함수 호출은 한 번만 설명하고, 바로 내부 실행으로 진입
          steps.push(
            this.createStep(
              lineNum,
              stripped,
              `📞 함수 호출: ${calledFuncName}(${argsString})\n\n` +
                `💡 ${calledFuncName} 함수를 호출합니다.${argsExplanation}`
            )
          );

          // 2. 프레임 설정
          const setupEvents = this.setupFunctionFrame(calledFunc, argExprs);
          setupEvents.forEach(e => this.addEvent(e));

          // 3. 함수 본문 실행 (진입 스텝 없이 바로 실행)
          const innerSteps = this.executeFunction(calledFunc, sourceLines, argExprs, { skipPush: true });
          steps.push(...innerSteps);

          // 4. void 함수 프레임 정리 (return 문 없이 종료된 경우)
          if (this.frameManager.getCurrentFrame() === calledFuncName) {
            const exitResult = this.frameManager.exit();
            this.variables = this.frameManager.getParentVariables() || new Map();
            this.evaluator.updateContext(this);
            exitResult.events.forEach(e => this.addEvent(e));
          }
          // 복귀 스텝 없이 바로 다음 줄로 진행

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
   * 함수 실행 (반환값 포함)
   */
  private executeFunctionWithReturn(
    func: FunctionDef,
    sourceLines: string[],
    argExprs: string[] = [],
    options: { skipPush?: boolean } = {}
  ): { steps: Step[]; returnValue: number } {
    const steps: Step[] = [];
    let returnValue = 0;

    if (!options.skipPush) {
      const setupEvents = this.setupFunctionFrame(func, argExprs);
      setupEvents.forEach(e => this.addEvent(e));
    }

    // func.bodyStart는 함수 선언 라인, 본문은 그 다음 줄부터
    for (let i = 0; i < func.lines.length; i++) {
      const line = func.lines[i];
      const lineNum = func.bodyStart + 1 + i;

      const stripped = line.trim();
      if (!stripped || stripped === '{' || stripped === '}') continue;
      if (stripped.startsWith('//')) continue;

      if (stripped.startsWith('return')) {
        const returnMatch = stripped.match(/^return\s+(.+?)\s*;?$/);
        if (returnMatch) {
          try {
            const evalResult = this.evaluator.evaluate(returnMatch[1]);
            returnValue = typeof evalResult.value === 'number'
              ? evalResult.value
              : parseFloat(String(evalResult.value)) || 0;
          } catch {
            returnValue = 0;
          }
        }

        steps.push(
          this.createStep(
            lineNum,
            stripped,
            `↩️ 함수 종료: return ${returnValue}\n\n` +
              `💡 ${func.name} 함수가 ${returnValue}을(를) 반환하고 종료합니다.`
          )
        );

        // 프레임 정리
        if (this.callStack.depth() > 1) {
          const exitResult = this.frameManager.exit();
          this.variables = this.frameManager.getParentVariables() || new Map();
          this.evaluator.updateContext(this);
          exitResult.events.forEach(e => this.addEvent(e));
        }
        break;
      }

      const cleanCode = stripped.replace(/;$/, '').trim();
      const step = this.analyzeLine(lineNum, cleanCode);
      if (step) steps.push(step);
    }

    return { steps, returnValue };
  }

  /**
   * 인자 표현식 문자열 파싱 (값이 아닌 표현식 유지)
   * "x, &y, 10" → ["x", "&y", "10"]
   */
  private parseArgumentExpressions(argsString: string): string[] {
    if (!argsString.trim()) return [];
    return argsString.split(',').map(s => s.trim());
  }

  /**
   * 인자 전달 설명 생성
   */
  private buildArgsExplanation(
    params: { name: string; type: string }[],
    argExprs: string[]
  ): string {
    if (argExprs.length === 0) return '';

    const explanations: string[] = [];
    for (let i = 0; i < params.length && i < argExprs.length; i++) {
      const param = params[i];
      const argExpr = argExprs[i];

      if (param.type.includes('*')) {
        // 포인터 파라미터
        explanations.push(`${param.name} ← ${argExpr} (주소 전달)`);
      } else {
        // 값 타입 파라미터
        try {
          const evalResult = this.evaluator.evaluate(argExpr);
          explanations.push(`${param.name}=${evalResult.value} (값 복사)`);
        } catch {
          explanations.push(`${param.name} ← ${argExpr}`);
        }
      }
    }

    return explanations.length > 0 ? `\n   인자 전달: ${explanations.join(', ')}` : '';
  }

  /**
   * 한 줄 분석 - 핸들러에 위임
   */
  private analyzeLine(lineNum: number, code: string): Step | null {
    const handler = registry.findHandlerWithFallback(code, { variables: this.variables });
    if (handler) {
      return handler.handle(this, lineNum, code);
    }
    return null;
  }

  // === SimContext & EvalContext 인터페이스 구현 ===

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
    return this.frameManager.allocateStack(size);
  }

  allocateHeap(size: number): number {
    const addr = this.heapBase + this.heapOffset;
    this.heapOffset += size;
    return addr;
  }

  getTypeSize(typeName: string): number {
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
    if (typeName.includes('*')) return 8;
    return typeMap[typeName] || 4;
  }

  appendStdout(text: string): void {
    this.stdoutBuffer += text;
  }

  addEvent(event: VisualizationEvent): void {
    this.handlerEvents.push(event);
  }

  getCurrentFrame(): string {
    return this.frameManager.getCurrentFrame();
  }

  findVariableByAddress(address: string): {
    frameName: string;
    variableName: string;
    variable: Variable;
  } | null {
    return this.frameManager.findVariableByAddress(address);
  }

  /**
   * 이름으로 변수 찾기 (크로스 프레임 지원)
   * 모든 프레임에서 변수명으로 검색
   * 용도: &x 평가 시 호출자 프레임의 변수 참조
   */
  findVariableByName(name: string): {
    frameName: string;
    variableName: string;
    variable: Variable;
  } | null {
    // 모든 프레임의 변수 검색
    const allVars = this.frameManager.getAllVariables();
    for (const [fullName, variable] of allVars) {
      // fullName: "main.x", "swap.temp"
      const parts = fullName.split('.');
      const varName = parts[parts.length - 1];
      const frameName = parts.slice(0, -1).join('.');

      if (varName === name) {
        return {
          frameName,
          variableName: varName,
          variable,
        };
      }
    }
    return null;
  }

  getHeapBlock(address: string): HeapBlock | null {
    for (const [, block] of this.heapBlocks) {
      if (block.address === address) {
        return block;
      }
    }
    return null;
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
   • 할당된 포인터를 추적하는 변수 관리 필요`;

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
      rsp: this.frameManager.getRsp(),
      rbp: this.frameManager.getRbp(),
      functionName: 'main',
      callDepth: 1,
    };
  }

  createStep(lineNum: number, code: string, explanation: string): Step {
    const allVariables = this.frameManager.getAllVariables();

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

    // 이번 스텝에서 새로 추가된 출력 (이벤트용)
    const newStdout = this.stdoutBuffer.length > this.lastStdoutLength
      ? this.stdoutBuffer.slice(this.lastStdoutLength)
      : undefined;
    this.lastStdoutLength = this.stdoutBuffer.length;

    // Event-Driven
    let events: VisualizationEvent[];
    if (this.handlerEvents.length > 0) {
      events = [...this.handlerEvents];
      this.handlerEvents = [];

      if (newStdout && !events.some(e => e.type === 'output')) {
        events.push({
          type: 'output',
          stream: 'stdout',
          text: newStdout,
        });
      }
    } else {
      events = this.generateEvents(allVariables, heap, newStdout);
    }

    this.updateSnapshot(allVariables, heap);

    return {
      line: lineNum,
      code,
      stack,
      heap,
      explanation,
      rsp: this.frameManager.getRsp(),
      rbp: this.frameManager.getRbp(),
      functionName: this.frameManager.getCurrentFrame(),
      callDepth: this.frameManager.getDepth(),
      // 누적된 전체 stdout 반환 (Step 타입 정의에 맞춤)
      stdout: this.stdoutBuffer || undefined,
      events,
    };
  }

  private generateEvents(
    allVariables: Array<[string, Variable]>,
    heap: MemoryBlock[],
    newStdout: string | undefined
  ): VisualizationEvent[] {
    const events: VisualizationEvent[] = [];

    // 1. 프레임 변경 감지
    const currentFrames = this.getActiveFrameNames();
    const prevFrames = this.previousSnapshot.frames;

    for (const frame of currentFrames) {
      if (!prevFrames.includes(frame)) {
        events.push({ type: 'frame', action: 'push', name: frame });
      }
    }

    for (const frame of prevFrames) {
      if (!currentFrames.includes(frame)) {
        events.push({ type: 'frame', action: 'pop', name: frame });
      }
    }

    // 2. 변수 변경 감지
    const currentVariables = new Map<string, Variable>();
    for (const [name, variable] of allVariables) {
      currentVariables.set(name, variable);
    }

    for (const [name, variable] of currentVariables) {
      const prevValue = this.previousSnapshot.variables.get(name);
      const [frameName, varName] = name.split('.');

      if (prevValue === undefined) {
        events.push({
          type: 'variable',
          action: 'declare',
          frame: frameName,
          name: varName,
          varType: variable.type,
          value: this.parseValue(variable.value),
          address: variable.address,
          size: variable.size,
          isArray: variable.is_array,
          arraySize: variable.array_size,
          elementType: variable.element_type,
        });
      } else if (prevValue !== variable.value) {
        events.push({
          type: 'variable',
          action: 'assign',
          frame: frameName,
          name: varName,
          value: this.parseValue(variable.value),
        });
      }

      if (variable.points_to) {
        events.push({
          type: 'pointer',
          action: 'assign',
          pointer: name,
          targetAddress: variable.points_to,
        });
      }
    }

    for (const [name] of this.previousSnapshot.variables) {
      if (!currentVariables.has(name)) {
        const [frameName, varName] = name.split('.');
        events.push({
          type: 'variable',
          action: 'destroy',
          frame: frameName,
          name: varName,
        });
      }
    }

    // 3. 힙 변경 감지
    const currentHeapAddrs = new Set(heap.map((h) => h.address));

    for (const block of heap) {
      const prevValue = this.previousSnapshot.heapBlocks.get(block.address);
      if (prevValue === undefined) {
        events.push({
          type: 'heap',
          action: 'allocate',
          address: block.address,
          size: block.size,
          name: block.name.replace(/^\*/, ''),
          heapType: block.type,
          value: this.parseValue(block.value),
        });
      } else if (prevValue !== block.value) {
        events.push({
          type: 'heap',
          action: 'write',
          address: block.address,
          value: this.parseValue(block.value),
          name: block.name.replace(/^\*/, ''),
        });
      }
    }

    for (const [addr, name] of this.previousSnapshot.heapBlocks) {
      if (!currentHeapAddrs.has(addr)) {
        events.push({
          type: 'heap',
          action: 'free',
          address: addr,
          name,
        });
      }
    }

    // 4. stdout
    if (newStdout) {
      events.push({
        type: 'output',
        stream: 'stdout',
        text: newStdout,
      });
    }

    return events;
  }

  private updateSnapshot(
    allVariables: Array<[string, Variable]>,
    heap: MemoryBlock[]
  ): void {
    this.previousSnapshot.frames = this.getActiveFrameNames();

    this.previousSnapshot.variables.clear();
    for (const [name, variable] of allVariables) {
      this.previousSnapshot.variables.set(name, variable.value);
    }

    this.previousSnapshot.heapBlocks.clear();
    for (const block of heap) {
      const name = block.name.replace(/^\*/, '');
      this.previousSnapshot.heapBlocks.set(block.address, name);
    }

    this.previousSnapshot.stdout = this.stdoutBuffer;
  }

  private getActiveFrameNames(): string[] {
    const frames: string[] = [];
    const allVars = this.frameManager.getAllVariables();
    const seen = new Set<string>();

    for (const [name] of allVars) {
      const frame = name.split('.')[0];
      if (!seen.has(frame)) {
        seen.add(frame);
        frames.push(frame);
      }
    }

    const currentFrame = this.frameManager.getCurrentFrame();
    if (!seen.has(currentFrame)) {
      frames.push(currentFrame);
    }

    return frames;
  }

  private parseValue(value: string): string | number | boolean | null {
    if (value === 'null' || value === 'NULL') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) return num;
    return value;
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
