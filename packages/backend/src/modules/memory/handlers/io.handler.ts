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

  const explanation = `📥 scanf: 키보드 입력 받기

• 형식: "${format}"
• 읽은 값: ${inputInfo}

💡 scanf는 stdin(표준입력)에서 값을 읽어 변수에 저장
   &${args[0]}는 '${args[0]}'의 주소를 전달 (값을 저장할 위치)

${ctx.stdinIndex > readValues.length ? '⚠️ 입력값이 부족합니다!' : '✓ 입력 완료'}`;

  return ctx.createStep(lineNum, code, explanation);
}

// printf 처리
function handlePrintf(ctx: SimContext, lineNum: number, code: string): Step {
  const printfMatch = code.match(PATTERNS.PRINTF_FULL);
  let explanation = 'printf: 화면에 출력';

  if (printfMatch) {
    const format = printfMatch[1];
    const argsStr = printfMatch[2];

    if (argsStr) {
      const args = argsStr.split(',').map((a) => a.trim());
      const values = args.map((arg) => {
        const v = ctx.variables.get(arg);
        return v ? `${arg}=${v.value}` : arg;
      });

      explanation = `📤 printf: 화면에 출력

• 형식: "${format}"
• 변수: ${values.join(', ')}

💡 printf는 stdout(표준출력)에 값을 출력
   %d는 정수, %s는 문자열, \\n은 줄바꿈`;
    } else {
      explanation = `📤 printf: "${format.replace(/\\n/g, '↵')}" 출력`;
    }
  }

  return ctx.createStep(lineNum, code, explanation);
}

export default IOHandler;
