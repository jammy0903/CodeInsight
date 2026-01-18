/**
 * IO Handler
 * 입출력 함수 처리 (scanf, printf)
 *
 * 처리하는 패턴:
 * - scanf("%d", &x);
 * - scanf("%d %d", &a, &b);
 * - printf("Hello");
 * - printf("%d", x);
 */

import type { CodeHandler, SimContext, Step } from './types';

// 패턴 정의
const PATTERNS = {
  // scanf("%d", &x);
  SCANF: /scanf\s*\(\s*"([^"]+)"\s*,\s*(.+)\s*\)/,
  // printf("...");
  PRINTF: /printf\s*\(/,
  PRINTF_FULL: /printf\s*\(\s*"([^"]+)"(?:\s*,\s*(.+))?\s*\)/,
};

export const IOHandler: CodeHandler = {
  name: 'io',
  priority: 15,

  canHandle(code: string): boolean {
    return PATTERNS.SCANF.test(code) || PATTERNS.PRINTF.test(code);
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // scanf
    const scanfMatch = code.match(PATTERNS.SCANF);
    if (scanfMatch) {
      return handleScanf(ctx, lineNum, code, scanfMatch[1], scanfMatch[2]);
    }

    // printf
    if (PATTERNS.PRINTF.test(code)) {
      return handlePrintf(ctx, lineNum, code);
    }

    return null;
  },
};

// scanf 처리
function handleScanf(
  ctx: SimContext,
  lineNum: number,
  code: string,
  format: string,
  argsStr: string
): Step {
  // 변수 이름들 추출 (&a, &b 형태에서 a, b 추출)
  const args = argsStr.split(',').map((arg) => {
    const trimmed = arg.trim();
    if (trimmed.startsWith('&')) {
      return trimmed.slice(1);
    }
    return trimmed;
  });

  // %d 개수 확인
  const formatCount = (format.match(/%d/g) || []).length;
  const readValues: { name: string; value: number }[] = [];

  for (let i = 0; i < Math.min(formatCount, args.length); i++) {
    const varName = args[i];
    const v = ctx.variables.get(varName);

    if (v && ctx.stdinIndex < ctx.stdinBuffer.length) {
      const inputValue = parseInt(ctx.stdinBuffer[ctx.stdinIndex], 10) || 0;
      ctx.stdinIndex++;

      // 변수 값 업데이트
      v.value = String(inputValue);
      v.bytes = ctx.intToBytes(inputValue, 4);
      readValues.push({ name: varName, value: inputValue });
    } else if (v) {
      // stdin 부족 - 0으로 처리
      readValues.push({ name: varName, value: 0 });
    }
  }

  const inputInfo =
    readValues.length > 0
      ? readValues.map((r) => `${r.name} = ${r.value}`).join(', ')
      : '(입력 없음)';

  // Phase 4: scanf 이벤트 (변수 값 변경)
  if (ctx.addEvent && ctx.getCurrentFrame) {
    for (const r of readValues) {
      const v = ctx.variables.get(r.name);
      ctx.addEvent({
        type: 'variable',
        action: 'assign',
        frame: ctx.getCurrentFrame(),
        name: r.name,
        varType: v?.type || 'int',
        value: r.value,
        address: v?.address,
      });
    }
  }

  const explanation = `📥 scanf: 키보드 입력 받기

• 형식: "${format}"
• 읽은 값: ${inputInfo}

💡 scanf는 stdin(표준입력)에서 값을 읽어 변수에 저장
   &${args[0]}는 '${args[0]}'의 주소를 전달 (값을 저장할 위치)

${ctx.stdinIndex > readValues.length ? '⚠️ 입력값이 부족합니다!' : '✓ 입력 완료'}`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 인자 표현식 평가
 * - &변수 → 변수의 주소
 * - sizeof(변수) → 변수의 크기
 * - 변수명 → 변수의 값
 */
function evaluateArg(arg: string, ctx: SimContext): { value: string; isAddress: boolean; size?: number } {
  const trimmed = arg.trim();

  // &변수 → 변수의 주소
  if (trimmed.startsWith('&')) {
    const varName = trimmed.slice(1).trim();
    const v = ctx.variables.get(varName);
    if (v) {
      return { value: v.address || '0x0', isAddress: true };
    }
    return { value: '0x0', isAddress: true };
  }

  // sizeof(변수) → 변수의 크기
  const sizeofMatch = trimmed.match(/^sizeof\s*\(\s*(\w+)\s*\)$/);
  if (sizeofMatch) {
    const varName = sizeofMatch[1];
    const v = ctx.variables.get(varName);
    if (v) {
      return { value: String(v.size || 4), isAddress: false, size: v.size };
    }
    // 타입 기본 크기
    return { value: '4', isAddress: false, size: 4 };
  }

  // 일반 변수
  const v = ctx.variables.get(trimmed);
  if (v) {
    return { value: v.value, isAddress: false, size: v.size };
  }

  return { value: trimmed, isAddress: false };
}

/**
 * printf 포맷 문자열 파싱하여 실제 출력 생성
 * 지원: %d (정수), %s (문자열), %c (문자), %f (실수), %x (16진수),
 *       %p (포인터), %lu/%ld (long), %% (% 리터럴)
 */
function formatPrintfOutput(format: string, args: string[], ctx: SimContext): string {
  let output = '';
  let argIndex = 0;
  let i = 0;

  while (i < format.length) {
    if (format[i] === '%' && i + 1 < format.length) {
      // %lu, %ld 같은 long 형식 먼저 확인
      const longMatch = format.slice(i).match(/^%l([dux])/i);
      if (longMatch) {
        const arg = args[argIndex++];
        const evalResult = evaluateArg(arg || '', ctx);
        output += evalResult.value;
        i += 3; // %lX
        continue;
      }

      const nextChar = format[i + 1];

      switch (nextChar) {
        case 'd':
        case 'i': {
          // 정수
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          output += evalResult.value;
          i += 2;
          break;
        }
        case 'u': {
          // unsigned 정수
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          output += evalResult.value;
          i += 2;
          break;
        }
        case 's': {
          // 문자열
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          output += evalResult.value.replace(/^"|"$/g, '');
          i += 2;
          break;
        }
        case 'c': {
          // 문자
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          const charCode = parseInt(evalResult.value, 10);
          output += isNaN(charCode) ? evalResult.value : String.fromCharCode(charCode);
          i += 2;
          break;
        }
        case 'f': {
          // 실수
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          output += parseFloat(evalResult.value).toFixed(6) || '0.000000';
          i += 2;
          break;
        }
        case 'p': {
          // 포인터 (주소)
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          // 주소 형식으로 출력 (0x 접두사 확인)
          const addr = evalResult.value;
          output += addr.startsWith('0x') ? addr : `0x${addr}`;
          i += 2;
          break;
        }
        case 'x': {
          // 16진수 (소문자)
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          output += parseInt(evalResult.value, 10).toString(16) || '0';
          i += 2;
          break;
        }
        case 'X': {
          // 16진수 (대문자)
          const arg = args[argIndex++];
          const evalResult = evaluateArg(arg || '', ctx);
          output += parseInt(evalResult.value, 10).toString(16).toUpperCase() || '0';
          i += 2;
          break;
        }
        case '%': {
          // %% → %
          output += '%';
          i += 2;
          break;
        }
        default:
          // 지원하지 않는 포맷 → 그대로 출력
          output += format[i];
          i++;
      }
    } else if (format[i] === '\\' && i + 1 < format.length) {
      // 이스케이프 시퀀스 처리
      const nextChar = format[i + 1];
      switch (nextChar) {
        case 'n':
          output += '\n';
          break;
        case 't':
          output += '\t';
          break;
        case '\\':
          output += '\\';
          break;
        case '"':
          output += '"';
          break;
        default:
          output += format[i] + nextChar;
      }
      i += 2;
    } else {
      output += format[i];
      i++;
    }
  }

  return output;
}

// printf 처리
function handlePrintf(ctx: SimContext, lineNum: number, code: string): Step {
  const printfMatch = code.match(PATTERNS.PRINTF_FULL);
  let explanation = 'printf: 화면에 출력';
  let actualOutput = '';

  if (printfMatch) {
    const format = printfMatch[1];
    const argsStr = printfMatch[2];
    const args = argsStr ? argsStr.split(',').map((a) => a.trim()) : [];

    // 실제 출력값 계산
    actualOutput = formatPrintfOutput(format, args, ctx);
    ctx.appendStdout(actualOutput);

    // Phase 4: printf 출력 이벤트
    if (ctx.addEvent && actualOutput) {
      ctx.addEvent({
        type: 'output',
        stream: 'stdout',
        text: actualOutput,
      });
    }

    if (argsStr) {
      const values = args.map((arg) => {
        const v = ctx.variables.get(arg);
        return v ? `${arg}=${v.value}` : arg;
      });

      explanation = `📤 printf: 화면에 출력

• 형식: "${format}"
• 변수: ${values.join(', ')}
• 출력: "${actualOutput.replace(/\n/g, '↵')}"

💡 printf는 stdout(표준출력)에 값을 출력
   %d는 정수, %s는 문자열, \\n은 줄바꿈`;
    } else {
      explanation = `📤 printf: "${format.replace(/\\n/g, '↵')}" 출력

• 출력: "${actualOutput.replace(/\n/g, '↵')}"`;
    }
  }

  return ctx.createStep(lineNum, code, explanation);
}

export default IOHandler;
