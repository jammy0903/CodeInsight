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
    if (stackData && Array.isArray(stackData)) {
      stackData.forEach((item: any) => {
        // 형태 1: 단순 형태 {name, value, type?} - 레슨 JSON
        if (item.name && (item.value !== undefined || item.value === null)) {
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
            // ArrowLayer는 variable.id로 매칭하므로 heap-${address} 형식 필요
            pointsTo: pointsTo ? `heap-${pointsTo}` : undefined,
          };

          variables.push(variable);
          mainFrameVars.push(variable.id);

          if (import.meta.env.DEV) {
            console.log('[JavaTransformer] stack variable (simple):', variable);
          }
        }
        // 형태 2: 복잡한 형태 {methodName, variables: {...}} - 시뮬레이터
        else if (item.methodName || item.variables) {
          const frameName = item.methodName || 'main';

          if (item.variables && typeof item.variables === 'object') {
            Object.entries(item.variables).forEach(([varName, val]: [string, any]) => {
              let value: string | number | boolean | null = null;
              let type = 'unknown';
              let pointsToAddr: string | undefined = undefined;

              if (val && typeof val === 'object') {
                if ('value' in val) {
                  value = parseValue(val.value);
                  type = val.type || typeof val.value;
                } else if (val.type === 'Reference' || val.type === 'Array' || val.id) {
                  // 참조 타입: displayValue가 있으면 표시, 없으면 주소
                  if (val.displayValue !== undefined) {
                    value = val.displayValue;
                  } else {
                    value = val.id ? `-> ${val.id}` : null;
                  }
                  type = val.class || val.type || 'Reference';
                  pointsToAddr = val.id;
                } else {
                  value = JSON.stringify(val);
                  type = 'object';
                }
              } else {
                value = parseValue(val);
                type = typeof val;
              }

              const variable: FlowVariable = {
                id: `${frameName}-${varName}`,
                name: varName,
                value,
                type,
                state: 'idle',
                scope: frameName,
                isPointer: !!pointsToAddr,
                pointsTo: pointsToAddr ? `heap-${pointsToAddr}` : undefined,
              };

              variables.push(variable);
              mainFrameVars.push(variable.id);

              if (import.meta.env.DEV) {
                console.log('[JavaTransformer] stack variable (complex):', variable);
              }
            });
          }
        }
      });
    }

    // 2. Heap 변수 처리
    // step.memoryState?.heap (원본) 또는 step.heap (enriched) 둘 다 체크
    const heapData = step.memoryState?.heap || (step.heap as any);
    if (heapData && Array.isArray(heapData)) {
      heapData.forEach((item: any) => {
        const address = item.address || item.id || 'unknown';
        const variable: FlowVariable = {
          id: `heap-${address}`,
          name: address,
          value: parseValue(item.content || item.value),
          type: item.type || 'Object',
          state: 'idle',
          scope: 'heap',
          address: address,
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

    // 5. 터미널 출력 (stdout 또는 memoryState.output)
    let terminalOutput: { text: string } | undefined = undefined;

    // 시뮬레이터: step.stdout 직접 전달
    if ((step as any).stdout) {
      terminalOutput = { text: String((step as any).stdout) };
    }
    // 레슨 JSON: step.memoryState.output
    else if (step.memoryState?.output) {
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

  /**
   * MemoryBlock → FlowVariable 변환
   * (Java 어댑터에서는 transform에서 통합 처리하므로, 여기는 기본 구현)
   */
  toVariable(
    block: {
      name: string;
      value: string;
      type?: string;
      address?: string;
      points_to?: string | null;
      segment?: string;
    },
    scope: string
  ): FlowVariable {
    const isReference = !!block.points_to;
    return {
      id: `${scope}-${block.name}`,
      name: block.name,
      value: parseValue(block.value),
      type: block.type || 'unknown',
      state: 'idle',
      scope,
      isPointer: isReference,
      pointsTo: block.points_to ? `heap-${block.points_to}` : undefined,
      address: block.address,
    };
  }
}

// 싱글톤 인스턴스
export const javaTransformer = new JavaTransformer();
