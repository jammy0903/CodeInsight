/**
 * CTransformer - C Language Transformer
 *
 * LessonStep (C) → FlowStep 변환
 * - stack/heap MemoryBlock[] → FlowVariable[]
 * - 포인터 관계 유지 (pointsTo → 변수 ID 해석)
 * - 함수 프레임 파싱 (dot-format + frame 필드 모두 지원)
 * - 배열/구조체 복합 타입 값 처리
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';
import type { IFlowTransformer } from '../../shared/adapters/types';

interface CStepBlock {
  type?: string;
  func?: string;
  frame?: string;
  name?: string;
  value?: unknown;
  address?: string;
  points_to?: string | null;
  pointsTo?: string | null;
  highlight?: boolean;
  structMembers?: Array<{ key: string; value: string }>;
  charElements?: Array<{ value: string; highlight?: boolean }>;
  dangling?: boolean;
}

/**
 * 문자열 값을 FlowValue로 파싱
 *
 * 주의: hex 주소(0x...)는 문자열로 유지해야 함
 * 그렇지 않으면 0x7fffffffde00 → 140737488346624로 변환됨
 */
function parseValue(value: string | undefined | null): string | number | boolean | null {
  if (value === undefined || value === null) {
    return 0;
  }

  const strValue = String(value);

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
 * 복합 타입 값 처리 (배열, 구조체 포함)
 *
 * - string → parseValue() 위임
 * - string[] (배열) → "[10, 20, 30]" 문자열
 * - {key, value}[] (구조체) → "{x: 10, y: 20}" 문자열
 */
function parseComplexValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'string') return parseValue(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';

    // 구조체 형식: [{key: "x", value: "10"}, ...]
    if (typeof value[0] === 'object' && value[0] !== null && 'key' in value[0]) {
      const members = value.map(
        (m: { key: string; value: string }) => `${m.key}: ${m.value}`
      );
      return `{${members.join(', ')}}`;
    }

    // 배열 형식: ["10", "20", "30"] 또는 [{value: "10", address?: "0x100"}, ...]
    const elements = value.map((el: unknown) => {
      if (typeof el === 'object' && el !== null && 'value' in el) {
        return String((el as { value: string }).value);
      }
      return String(el);
    });
    return `[${elements.join(', ')}]`;
  }

  return String(value);
}

/**
 * 변수명에서 함수 프레임 추출 (Simulator dot-format)
 * 예: "main.x" → { frame: "main", name: "x" }
 * 예: "x" → { frame: "main", name: "x" } (기본값)
 */
function parseVariableName(fullName: string): { frame: string; name: string } {
  if (!fullName) {
    return { frame: 'main', name: 'unknown' };
  }

  const dotIndex = fullName.indexOf('.');

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
    let varIdx = 0; // ID 충돌 방지용 카운터

    // 1. Stack 변수 처리
    let currentFrame = 'main'; // 위치 기반 프레임 추적

    if (step.stack) {
      (step.stack as CStepBlock[]).forEach((block) => {
        // 프레임 마커 감지 (두 가지 포맷):
        // 1) 새 포맷: {type: "frame", func: "main", value: "frame"}
        // 2) 기존 포맷: {name: "main", value: "main"} (frame/func는 Zod strip)
        //    → type 없음 + 유효 address 없음 + value===name 으로 감지
        const noRealAddress = !block.address || block.address === '???';
        const isFrameMarker =
          block.type === 'frame' ||
          (!block.type && noRealAddress && block.name != null && String(block.value) === block.name);

        if (isFrameMarker) {
          const frameName = block.func || block.frame || block.name;
          if (frameName) {
            currentFrame = frameName;
            if (!framesMap.has(frameName)) {
              framesMap.set(frameName, []);
            }
          }
          return;
        }

        // 프레임 결정: block.frame 우선 → 위치 기반 currentFrame → dot-format 파싱
        const dotParsed = parseVariableName(block.name ?? '');
        const frame = block.frame || currentFrame || dotParsed.frame;
        const name = dotParsed.name;

        const variable = this.toVariable(
          {
            name,
            value: block.value,
            type: block.type,
            address: block.address,
            points_to: block.points_to || block.pointsTo,
            highlight: block.highlight,
            segment: 'stack',
            structMembers: block.structMembers,
            charElements: block.charElements,
            dangling: block.dangling,
          },
          frame,
          varIdx++,
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
      (step.heap as CStepBlock[]).forEach((block) => {
        if (block.type === 'frame') return;

        const variable = this.toVariable(
          {
            name: block.name || `[${block.address ?? '?'}]`,
            value: block.value,
            type: block.type,
            address: block.address,
            points_to: block.points_to || block.pointsTo,
            highlight: block.highlight,
            segment: 'heap',
            structMembers: block.structMembers,
            charElements: block.charElements,
            dangling: block.dangling,
          },
          'heap',
          varIdx++,
        );
        variables.push(variable);

        const heapVars = framesMap.get('heap') || [];
        heapVars.push(variable.id);
        framesMap.set('heap', heapVars);
      });
    }

    // 3. Data 섹션 처리 (전역 변수)
    if (step.data) {
      (step.data as CStepBlock[]).forEach((block) => {
        if (block.type === 'frame') return;

        const variable = this.toVariable(
          {
            name: block.name || '?',
            value: block.value,
            type: block.type,
            address: block.address,
            highlight: block.highlight,
            segment: 'data',
          },
          'global',
          varIdx++,
        );
        variables.push(variable);

        const globalVars = framesMap.get('global') || [];
        globalVars.push(variable.id);
        framesMap.set('global', globalVars);
      });
    }

    // 4. pointsTo 해석: raw 값(hex 주소 또는 변수 이름)을 변수 ID로 매핑
    this.resolvePointsTo(variables);

    // 5. 프레임 배열 생성 (main이 없으면 추가)
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

    // 6. 코드 추출
    const code = step.code || (fullCode ? getCodeAtLine(fullCode, step.line) : '');

    // 7. 터미널 출력
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
   * pointsTo 값을 변수 ID로 해석
   *
   * 세 가지 경우 처리:
   * 1. hex 주소 (Simulator): "0x7fff..." → address 매칭 → 변수 ID
   * 2. 변수 이름 (Lesson JSON points_to): "a" → name 매칭 → 변수 ID
   * 3. 이미 변수 ID 형태면 그대로 유지
   */
  private resolvePointsTo(variables: FlowVariable[]): void {
    variables.forEach((v) => {
      if (!v.pointsTo) return;

      // 이미 변수 ID 형태 ("main-a-0x1000")면 스킵
      if (v.pointsTo.includes('-') && !v.pointsTo.startsWith('0x')) return;

      // hex 주소 → address로 매칭 (Simulator 경로)
      if (v.pointsTo.startsWith('0x')) {
        const target = variables.find((t) => t.address === v.pointsTo && t.id !== v.id);
        if (target) {
          v.pointsTo = target.id;
          return;
        }
      }

      // 변수 이름으로 매칭 (Lesson JSON points_to: "a")
      // 다른 스코프(프레임) 우선: 포인터는 보통 다른 프레임의 변수를 가리킴
      const candidates = variables.filter((t) => t.name === v.pointsTo && t.id !== v.id);
      if (candidates.length > 0) {
        const crossFrame = candidates.find((t) => t.scope !== v.scope);
        v.pointsTo = (crossFrame || candidates[0]).id;
        return;
      }

      // 매칭 실패 시 pointsTo 제거 (깨진 화살표 방지)
      v.pointsTo = undefined;
    });
  }

  /**
   * MemoryBlock 유사 객체 → FlowVariable 변환
   */
  toVariable(
    block: {
      name: string;
      value: unknown;
      type?: string;
      address?: string;
      points_to?: string | null;
      highlight?: boolean;
      segment?: string;
      structMembers?: Array<{ key: string; value: string }>;
      charElements?: Array<{ value: string; highlight?: boolean }>;
      dangling?: boolean;
    },
    scope: string,
    idx: number = 0,
  ): FlowVariable {
    const isPointer = block.type?.includes('*') || false;
    const parsedValue = parseComplexValue(block.value);
    const addr = block.address || `auto-${idx}`;

    const metadata: Record<string, unknown> = {};
    if (block.structMembers?.length) {
      metadata.structMembers = block.structMembers;
    }
    if (block.charElements?.length) {
      metadata.charElements = block.charElements;
    }
    if (block.dangling) {
      metadata.dangling = true;
    }

    return {
      id: `${scope}-${block.name}-${addr}`,
      name: block.name,
      value: parsedValue ?? 0,
      type: block.type || 'unknown',
      state: block.highlight ? 'updating' : 'idle',
      scope,
      isPointer,
      pointsTo: block.points_to || undefined,
      address: block.address,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
  }
}

// 싱글톤 인스턴스
export const cTransformer = new CTransformer();
