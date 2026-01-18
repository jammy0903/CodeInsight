/**
 * JavaTransformer - Java Language Transformer
 *
 * LessonStep (Java) → FlowStep 변환
 * - stack/heap memoryState → FlowVariable[]
 * - 참조 관계 유지 ("-> 0x001")
 * - 모든 변수는 main 프레임에
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';
import type { IFlowTransformer } from '../base/types';

/**
 * 값을 FlowValue로 파싱
 *
 * Java 특징:
 * - "-> 0x001" 형태의 참조
 * - "\"hello\"" 형태의 문자열
 */
function parseValue(value: string | undefined | null): string | number | boolean | null {
  if (value === undefined || value === null) {
    return null;
  }

  const strValue = String(value);

  if (strValue === '' || strValue === 'null' || strValue === 'NULL') return null;
  if (strValue === 'true') return true;
  if (strValue === 'false') return false;

  // 참조 파싱: "-> 0x001" → 참조로 표시하되, 값은 주소
  if (strValue.startsWith('->')) {
    return strValue.trim();
  }

  // hex 주소는 문자열로 유지
  if (strValue.startsWith('0x') || strValue.startsWith('0X')) {
    return strValue;
  }

  // 숫자 시도
  const num = Number(strValue);
  if (!isNaN(num)) return num;

  // 문자열 (따옴표 제거)
  if (strValue.startsWith('"') && strValue.endsWith('"')) {
    return strValue.slice(1, -1);
  }
  if (strValue.startsWith("'") && strValue.endsWith("'")) {
    return strValue.slice(1, -1);
  }

  return strValue;
}

/**
 * 참조에서 주소 추출
 * "-> 0x001" → "0x001"
 */
function extractPointsTo(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const strValue = String(value);
  if (strValue.startsWith('->')) {
    return strValue.replace('->', '').trim();
  }
  return undefined;
}

/**
 * 코드에서 특정 라인 추출
 */
function getCodeAtLine(fullCode: string, line: number): string {
  const lines = fullCode.split('\n');
  return lines[line - 1]?.trim() || '';
}

export class JavaTransformer implements IFlowTransformer {
  /**
   * LessonStep → FlowStep 변환
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];
    const mainFrameVars: string[] = [];
    const heapFrameVars: string[] = [];

    // DEBUG
    if (import.meta.env.DEV) {
      console.log('[JavaTransformer] step.line:', step.line);
      console.log('[JavaTransformer] step.memoryState:', step.memoryState);
      console.log('[JavaTransformer] step.stack:', step.stack);
    }

    // 1. Stack 변수 처리 (main 프레임)
    // step.memoryState?.stack (원본) 또는 step.stack (enriched) 둘 다 체크
    const stackData = step.memoryState?.stack || (step.stack as any);
    if (stackData) {
      stackData.forEach((item: any) => {
        const pointsTo = extractPointsTo(item.value);
        const isReference = !!pointsTo;

        const variable: FlowVariable = {
          id: `main-${item.name}`,
          name: item.name,
          value: parseValue(item.value),
          type: item.type || 'unknown',
          state: 'idle',
          scope: 'main',
          isPointer: isReference,
          pointsTo,
        };

        variables.push(variable);
        mainFrameVars.push(variable.id);

        // DEBUG
        if (import.meta.env.DEV) {
          console.log('[JavaTransformer] stack variable:', variable);
        }
      });
    }

    // 2. Heap 변수 처리
    // step.memoryState?.heap (원본) 또는 step.heap (enriched) 둘 다 체크
    const heapData = step.memoryState?.heap || (step.heap as any);
    if (heapData) {
      heapData.forEach((item: any) => {
        const variable: FlowVariable = {
          id: `heap-${item.address}`,
          name: item.address || 'unknown',
          value: parseValue(item.content || item.value),
          type: 'Object',
          state: 'idle',
          scope: 'heap',
          address: item.address,
          isPointer: false,
        };

        variables.push(variable);
        heapFrameVars.push(variable.id);

        // DEBUG
        if (import.meta.env.DEV) {
          console.log('[JavaTransformer] heap variable:', variable);
        }
      });
    }

    // 3. 프레임 생성
    const frames: FlowFrame[] = [
      { name: 'main', variableIds: mainFrameVars },
    ];

    if (heapFrameVars.length > 0) {
      frames.push({ name: 'heap', variableIds: heapFrameVars });
    }

    // 4. 코드 추출
    const code = step.code || (fullCode ? getCodeAtLine(fullCode, step.line) : '');

    // 5. 터미널 출력 (comparison, output 처리)
    let terminalOutput: { text: string } | undefined = undefined;
    if (step.memoryState?.output) {
      terminalOutput = {
        text: Array.isArray(step.memoryState.output)
          ? step.memoryState.output.join('\n')
          : String(step.memoryState.output),
      };
    }

    return {
      id: `step-${step.line}`,
      line: step.line,
      code,
      variables,
      animations: [],
      frames,
      terminalOutput,
    };
  }
}

// 싱글톤 인스턴스
export const javaTransformer = new JavaTransformer();
