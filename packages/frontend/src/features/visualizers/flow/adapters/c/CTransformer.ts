/**
 * CTransformer - C Language Transformer
 *
 * LessonStep (C) → FlowStep 변환
 * - stack/heap MemoryBlock[] → FlowVariable[]
 * - 포인터 관계 유지
 * - 함수 프레임 파싱
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';
import type { IFlowTransformer } from '../base/types';

/**
 * 값을 FlowValue로 파싱
 *
 * 주의: hex 주소(0x...)는 문자열로 유지해야 함
 * 그렇지 않으면 0x7fffffffde00 → 140737488346624로 변환됨
 */
function parseValue(value: string | undefined | null): string | number | boolean | null {
  // 방어적 코드: undefined, null, 빈 문자열 처리
  if (value === undefined || value === null) {
    return 0; // 기본값
  }

  const strValue = String(value); // 타입 안전성 보장

  if (strValue === '' || strValue === 'null' || strValue === 'NULL') return null;
  if (strValue === 'true') return true;
  if (strValue === 'false') return false;

  // hex 주소는 문자열로 유지 (0x로 시작하는 값)
  if (strValue.startsWith('0x') || strValue.startsWith('0X')) {
    return strValue;
  }

  // 숫자 시도 (10진수만)
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
 * 변수명에서 함수 프레임 추출
 * 예: "main.x" → { frame: "main", name: "x" }
 * 예: "foo.local" → { frame: "foo", name: "local" }
 */
/**
 * 변수명에서 함수 프레임 추출
 * 예: "main.x" → { frame: "main", name: "x" }
 * 예: "x" → { frame: "main", name: "x" } (기본값)
 */
function parseVariableName(fullName: string): { frame: string; name: string } {
  // 방어적 코드: 빈 문자열 처리
  if (!fullName) {
    return { frame: 'main', name: 'unknown' };
  }

  const dotIndex = fullName.indexOf('.');

  // 점(.)이 없는 경우: 기본적으로 'main' 프레임으로 간주
  // 단, 'global'이나 'heap' 등 특수 키워드가 이름에 포함된 경우(예비)는 고려하지 않음 (이름 자체로 식별)
  if (dotIndex === -1) {
    return { frame: 'main', name: fullName };
  }

  return {
    frame: fullName.slice(0, dotIndex),
    name: fullName.slice(dotIndex + 1),
  };
}

/**
 * 코드에서 특정 라인 추출
 */
function getCodeAtLine(fullCode: string, line: number): string {
  const lines = fullCode.split('\n');
  return lines[line - 1]?.trim() || '';
}

export class CTransformer implements IFlowTransformer {
  /**
   * LessonStep → FlowStep 변환
   */
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];
    const framesMap = new Map<string, string[]>(); // frame name → variable IDs

    // 1. Stack 변수 처리
    if (step.stack) {
      step.stack.forEach((block) => {
        const { frame, name } = parseVariableName(block.name);
        const variable = this.toVariable(
          {
            name,
            value: block.value,
            type: block.type,
            address: block.address,
            points_to: block.points_to,
            segment: 'stack',
          },
          frame
        );
        variables.push(variable);

        // 프레임에 변수 추가
        const frameVars = framesMap.get(frame) || [];
        frameVars.push(variable.id);
        framesMap.set(frame, frameVars);
      });
    }

    // 2. Heap 변수 처리
    if (step.heap) {
      step.heap.forEach((block) => {
        const variable = this.toVariable(
          {
            name: block.name || `[${block.address}]`,
            value: block.value,
            type: block.type,
            address: block.address,
            points_to: block.points_to,
            segment: 'heap',
          },
          'heap'
        );
        variables.push(variable);

        // heap 프레임에 추가
        const heapVars = framesMap.get('heap') || [];
        heapVars.push(variable.id);
        framesMap.set('heap', heapVars);
      });
    }

    // 3. Data 섹션 처리 (전역 변수)
    if (step.data) {
      step.data.forEach((block) => {
        const variable = this.toVariable(
          {
            name: block.name,
            value: block.value,
            type: block.type,
            address: block.address,
            segment: 'data',
          },
          'global'
        );
        variables.push(variable);

        const globalVars = framesMap.get('global') || [];
        globalVars.push(variable.id);
        framesMap.set('global', globalVars);
      });
    }

    // 4. 프레임 배열 생성 (main이 없으면 추가)
    if (!framesMap.has('main')) {
      framesMap.set('main', []);
    }

    const frames: FlowFrame[] = [];

    // global → main → 기타 함수 → heap 순서
    if (framesMap.has('global')) {
      frames.push({ name: 'global', variableIds: framesMap.get('global')! });
    }
    if (framesMap.has('main')) {
      frames.push({ name: 'main', variableIds: framesMap.get('main')! });
    }
    framesMap.forEach((varIds, frameName) => {
      if (frameName !== 'main' && frameName !== 'global' && frameName !== 'heap') {
        frames.push({ name: frameName, variableIds: varIds });
      }
    });
    if (framesMap.has('heap')) {
      frames.push({ name: 'heap', variableIds: framesMap.get('heap')! });
    }

    // 5. 코드 추출
    const code = step.code || (fullCode ? getCodeAtLine(fullCode, step.line) : '');

    // 6. 터미널 출력
    const terminalOutput = step.stdout || step.output
      ? { text: step.stdout || step.output || '' }
      : undefined;

    return {
      id: `step-${step.line}`,
      line: step.line,
      code,
      variables,
      animations: [], // Animator가 채움
      frames,
      terminalOutput,
    };
  }

  /**
   * MemoryBlock 유사 객체 → FlowVariable 변환
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
    const isPointer = block.type?.includes('*') || false;
    const parsedValue = parseValue(block.value);

    return {
      id: `${scope}-${block.name}-${block.address || 'no-addr'}`,
      name: block.name,
      value: parsedValue ?? block.value,
      type: block.type || 'unknown',
      state: 'idle',
      scope,
      isPointer,
      pointsTo: block.points_to || undefined,
      address: block.address,
    };
  }
}

// 싱글톤 인스턴스
export const cTransformer = new CTransformer();
