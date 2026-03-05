/**
 * Java Event Normalizer
 *
 * JavaStep의 JavaEvent[] → SimulatorEvent[] 변환 (순수 함수)
 *
 * 매핑 테이블:
 * | JavaEvent.type    | action       | → SimulatorEvent.type | action   |
 * |-------------------|--------------|-----------------------|----------|
 * | FrameEvent        | push/pop     | frame                 | push/pop |
 * | VariableEvent     | declare/assign| variable             | declare/assign |
 * | ObjectEvent       | create       | object                | create   |
 * | ArrayEvent        | create/access| object                | create/access |
 * | FieldEvent        | assign       | object                | update   |
 * | FieldEvent        | access       | highlight             | accessed |
 * | OutputEvent       | *            | output                | stdout   |
 * | HighlightEvent    | *            | highlight             | changed  |
 */

import type { SimulatorEvent } from '@codeinsight/shared';
import type { JavaEvent, JavaValue, JavaStep } from '../runtime/types';

/**
 * JavaValue → VisualizationValue 변환
 */
function javaValueToVisualizationValue(
  v: JavaValue | undefined,
): string | number | boolean | null {
  if (!v) return null;
  if (v.isReference) {
    return v.objectId ?? null;
  }
  if (v.value === null || v.value === undefined) return null;
  return v.value;
}

/**
 * 현재 스텝의 최상위 프레임 이름 반환
 */
function getCurrentFrameName(step: JavaStep): string {
  const frames = step.stack?.frames;
  if (!frames || frames.length === 0) return 'main';
  return frames[frames.length - 1].methodName;
}

/**
 * 단일 JavaEvent → SimulatorEvent[] 변환
 */
function normalizeOneEvent(
  event: JavaEvent,
  step: JavaStep,
): SimulatorEvent[] {
  const frameName = getCurrentFrameName(step);

  switch (event.type) {
    case 'FrameEvent': {
      const action = event.action === 'push' ? 'push' : 'pop';
      return [
        {
          type: 'frame' as const,
          action,
          name: event.target || frameName,
        },
      ];
    }

    case 'VariableEvent': {
      const action = event.action === 'declare' ? 'declare' : 'assign';
      return [
        {
          type: 'variable' as const,
          action,
          frame: frameName,
          name: event.target || '',
          value: javaValueToVisualizationValue(event.value),
        },
      ];
    }

    case 'ObjectEvent': {
      return [
        {
          type: 'object' as const,
          action: 'create' as const,
          objectId: event.target || '',
          className: event.message,
        },
      ];
    }

    case 'ArrayEvent': {
      const action = event.action === 'create' ? 'create' : 'access';
      return [
        {
          type: 'object' as const,
          action: action as 'create' | 'access',
          objectId: event.target || '',
          className: event.message,
        },
      ];
    }

    case 'FieldEvent': {
      if (event.action === 'assign') {
        const properties: Record<string, unknown> = {};
        if (event.message && event.value) {
          properties[event.message] = javaValueToVisualizationValue(event.value);
        }
        return [
          {
            type: 'object' as const,
            action: 'update' as const,
            objectId: event.target || '',
            properties,
          },
        ];
      }
      // FieldEvent access → highlight accessed
      return [
        {
          type: 'highlight' as const,
          target: 'variable' as const,
          name: event.message || event.target || '',
          frame: frameName,
          style: 'accessed' as const,
        },
      ];
    }

    case 'OutputEvent': {
      return [
        {
          type: 'output' as const,
          stream: 'stdout' as const,
          text: event.message || '',
        },
      ];
    }

    case 'HighlightEvent': {
      return [
        {
          type: 'highlight' as const,
          target: 'variable' as const,
          name: event.target || '',
          frame: frameName,
          style: 'changed' as const,
        },
      ];
    }

    default:
      return [];
  }
}

/**
 * JavaStep의 전체 이벤트 배열을 SimulatorEvent[]로 정규화
 *
 * JDI 경로(Playground): step.events 없음, step.stdout으로 출력 전달
 * 핸들러 경로(레슨): step.events 배열로 이벤트 전달
 */
export function normalizeJavaEvents(step: JavaStep): SimulatorEvent[] {
  const result: SimulatorEvent[] = [];

  // JDI 스냅샷 경로: stdout 필드를 output 이벤트로 변환
  if ((step as any).stdout !== undefined && (step as any).stdout !== '') {
    result.push({
      type: 'output' as const,
      stream: 'stdout' as const,
      text: (step as any).stdout,
    });
  }

  if (!step.events || step.events.length === 0) return result;

  for (const event of step.events) {
    result.push(...normalizeOneEvent(event, step));
  }
  return result;
}
