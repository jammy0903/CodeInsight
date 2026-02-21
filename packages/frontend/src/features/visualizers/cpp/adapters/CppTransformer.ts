/**
 * CppTransformer - C++ Language Transformer
 *
 * CTransformer를 기반으로 C++ 전용 기능 추가:
 * - isReference 감지: 타입에 '&' 포함
 * - isPointer 감지: 타입에 '*' 포함 (& 미포함)
 * - const 감지: 타입이 'const'로 시작
 * - metadata 전달 (containerInfo, smartPtrInfo)
 */

import type { LessonStep, FlowStep, FlowVariable, FlowFrame } from '@codeinsight/shared';
import type { IFlowTransformer } from '../../shared/adapters/types';

interface CppStepBlock {
  type?: string;
  func?: string;
  frame?: string;
  name?: string;
  value?: unknown;
  address?: string;
  points_to?: string | null;
  pointsTo?: string | null;
  highlight?: boolean;
  isReference?: boolean;
  metadata?: Record<string, unknown>;
}

function parseValue(value: string | undefined | null): string | number | boolean | null {
  if (value === undefined || value === null) return 0;
  const strValue = String(value);
  if (strValue === '' || strValue === 'null' || strValue === 'NULL' || strValue === 'nullptr') return null;
  if (strValue === 'true') return true;
  if (strValue === 'false') return false;
  if (strValue.startsWith('0x') || strValue.startsWith('0X')) return strValue;
  const num = Number(strValue);
  if (!isNaN(num)) return num;
  if (strValue.startsWith('"') && strValue.endsWith('"')) return strValue.slice(1, -1);
  if (strValue.startsWith("'") && strValue.endsWith("'")) return strValue.slice(1, -1);
  return strValue;
}

function parseComplexValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'string') return parseValue(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (typeof value[0] === 'object' && value[0] !== null && 'key' in value[0]) {
      const members = value.map(
        (m: { key: string; value: string }) => `${m.key}: ${m.value}`
      );
      return `{${members.join(', ')}}`;
    }
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

function parseVariableName(fullName: string): { frame: string; name: string } {
  if (!fullName) return { frame: 'main', name: 'unknown' };
  const dotIndex = fullName.indexOf('.');
  if (dotIndex === -1) return { frame: 'main', name: fullName };
  return { frame: fullName.slice(0, dotIndex), name: fullName.slice(dotIndex + 1) };
}

function getCodeAtLine(fullCode: string, line: number): string {
  const lines = fullCode.split('\n');
  return lines[line - 1]?.trim() || '';
}

export class CppTransformer implements IFlowTransformer {
  transform(step: LessonStep, prevStep?: LessonStep, fullCode?: string): FlowStep {
    const variables: FlowVariable[] = [];
    const framesMap = new Map<string, string[]>();
    let varIdx = 0;

    // 1. Stack 변수 처리
    if (step.stack) {
      (step.stack as CppStepBlock[]).forEach((block) => {
        if (block.type === 'frame') {
          const frameName = block.func || block.name;
          if (frameName && !framesMap.has(frameName)) {
            framesMap.set(frameName, []);
          }
          return;
        }

        const dotParsed = parseVariableName(block.name ?? '');
        const frame = block.frame || dotParsed.frame;
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
            isReference: block.isReference,
            metadata: block.metadata,
          },
          frame,
          varIdx++,
        );
        variables.push(variable);

        const frameVars = framesMap.get(frame) || [];
        frameVars.push(variable.id);
        framesMap.set(frame, frameVars);
      });
    }

    // 2. Heap 변수 처리
    if (step.heap) {
      (step.heap as CppStepBlock[]).forEach((block) => {
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
            metadata: block.metadata,
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
      (step.data as CppStepBlock[]).forEach((block) => {
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

    // 4. pointsTo 해석
    this.resolvePointsTo(variables);

    // 5. 프레임 배열 생성
    if (!framesMap.has('main')) {
      framesMap.set('main', []);
    }

    const frames: FlowFrame[] = [];
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

    const code = step.code || (fullCode ? getCodeAtLine(fullCode, step.line) : '');
    const terminalOutput = step.stdout || step.output
      ? { text: step.stdout || step.output || '' }
      : undefined;

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

  private resolvePointsTo(variables: FlowVariable[]): void {
    variables.forEach((v) => {
      if (!v.pointsTo) return;
      if (v.pointsTo.includes('-') && !v.pointsTo.startsWith('0x')) return;

      if (v.pointsTo.startsWith('0x')) {
        const target = variables.find((t) => t.address === v.pointsTo && t.id !== v.id);
        if (target) {
          v.pointsTo = target.id;
          return;
        }
      }

      const candidates = variables.filter((t) => t.name === v.pointsTo && t.id !== v.id);
      if (candidates.length > 0) {
        const crossFrame = candidates.find((t) => t.scope !== v.scope);
        v.pointsTo = (crossFrame || candidates[0]).id;
        return;
      }

      v.pointsTo = undefined;
    });
  }

  toVariable(
    block: {
      name: string;
      value: unknown;
      type?: string;
      address?: string;
      points_to?: string | null;
      highlight?: boolean;
      segment?: string;
      isReference?: boolean;
      metadata?: Record<string, unknown>;
    },
    scope: string,
    idx: number = 0,
  ): FlowVariable {
    const typeStr = block.type || 'unknown';
    const isReference = block.isReference || typeStr.includes('&');
    const isPointer = !isReference && typeStr.includes('*');
    const isConst = typeStr.startsWith('const ') || typeStr.includes(' const');
    const parsedValue = parseComplexValue(block.value);
    const addr = block.address || `auto-${idx}`;

    // Build metadata
    const metadata: Record<string, unknown> = {};
    if (isConst) metadata.isConst = true;
    if (block.metadata) {
      Object.assign(metadata, block.metadata);
    }

    return {
      id: `${scope}-${block.name}-${addr}`,
      name: block.name,
      value: parsedValue ?? 0,
      type: typeStr,
      state: block.highlight ? 'updating' : 'idle',
      scope,
      isPointer,
      isReference,
      pointsTo: block.points_to || undefined,
      address: block.address,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
  }
}

export const cppTransformer = new CppTransformer();
