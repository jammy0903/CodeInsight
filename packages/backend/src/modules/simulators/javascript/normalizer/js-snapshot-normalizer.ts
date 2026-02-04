/**
 * JS Snapshot-Diff Normalizer
 *
 * 연속 JavaScriptSnapshot 쌍을 diff하여 SimulatorEvent[] 생성
 *
 * Diff 전략:
 * 1. Frame diff — stack 배열 길이/이름 비교 → frame push/pop
 * 2. Scope diff — 같은 stack diff → scope enter/exit
 * 3. Variable diff — 각 frame의 variables 비교 → variable declare/assign/destroy
 * 4. Heap diff — heap 배열의 id 기반 비교 → object create/update/destroy
 * 5. 첫 스냅샷 — prev 없음, 모든 것이 create/enter/declare
 */

import type { SimulatorEvent } from '@codeinsight/shared';
import type { JavaScriptSnapshot } from '../engine/debugger-client';

export interface NormalizedJsStep {
  line: number;
  events: SimulatorEvent[];
  snapshot: JavaScriptSnapshot;
}

/**
 * Frame diff: stack 배열 비교 → frame push/pop + scope enter/exit
 */
function diffFrames(
  prev: JavaScriptSnapshot['stack'],
  curr: JavaScriptSnapshot['stack'],
): SimulatorEvent[] {
  const events: SimulatorEvent[] = [];

  // pop된 프레임 (prev에 있지만 curr에 없음)
  if (prev.length > curr.length) {
    for (let i = prev.length - 1; i >= curr.length; i--) {
      events.push({
        type: 'scope' as const,
        action: 'exit' as const,
        scopeType: 'function' as const,
        name: prev[i].methodName,
      });
      events.push({
        type: 'frame' as const,
        action: 'pop' as const,
        name: prev[i].methodName,
      });
    }
  }

  // push된 프레임 (curr에 있지만 prev에 없음)
  if (curr.length > prev.length) {
    for (let i = prev.length; i < curr.length; i++) {
      events.push({
        type: 'frame' as const,
        action: 'push' as const,
        name: curr[i].methodName,
      });
      events.push({
        type: 'scope' as const,
        action: 'enter' as const,
        scopeType: 'function' as const,
        name: curr[i].methodName,
      });
    }
  }

  return events;
}

/**
 * Variable diff: 각 frame의 variables Record 비교
 */
function diffVariables(
  prev: JavaScriptSnapshot['stack'],
  curr: JavaScriptSnapshot['stack'],
): SimulatorEvent[] {
  const events: SimulatorEvent[] = [];

  for (const frame of curr) {
    const prevFrame = prev.find((f) => f.methodName === frame.methodName);
    const prevVars = prevFrame?.variables ?? {};
    const currVars = frame.variables;

    // 새로 생긴 변수 or 값 변경
    for (const [name, value] of Object.entries(currVars)) {
      if (!(name in prevVars)) {
        events.push({
          type: 'variable' as const,
          action: 'declare' as const,
          frame: frame.methodName,
          name,
          value: serializeValue(value),
        });
      } else if (!shallowEqual(prevVars[name], value)) {
        events.push({
          type: 'variable' as const,
          action: 'assign' as const,
          frame: frame.methodName,
          name,
          value: serializeValue(value),
          previousValue: serializeValue(prevVars[name]),
        });
      }
    }

    // 제거된 변수
    if (prevFrame) {
      for (const name of Object.keys(prevVars)) {
        if (!(name in currVars)) {
          events.push({
            type: 'variable' as const,
            action: 'destroy' as const,
            frame: frame.methodName,
            name,
          });
        }
      }
    }
  }

  return events;
}

/**
 * Heap diff: id 기반 비교 → object create/update/destroy
 */
function diffHeap(
  prev: JavaScriptSnapshot['heap'],
  curr: JavaScriptSnapshot['heap'],
): SimulatorEvent[] {
  const events: SimulatorEvent[] = [];
  const prevIds = new Set(prev.map((o) => o.id));
  const currIds = new Set(curr.map((o) => o.id));
  const prevMap = new Map(prev.map((o) => [o.id, o]));

  // 새로 생성된 객체
  for (const obj of curr) {
    if (!prevIds.has(obj.id)) {
      events.push({
        type: 'object' as const,
        action: 'create' as const,
        objectId: obj.id,
        className: obj.type,
      });
    } else {
      // 기존 객체의 content 변경 → update
      const prevObj = prevMap.get(obj.id);
      if (prevObj && prevObj.content !== obj.content) {
        events.push({
          type: 'object' as const,
          action: 'update' as const,
          objectId: obj.id,
          className: obj.type,
        });
      }
    }
  }

  // 제거된 객체
  for (const obj of prev) {
    if (!currIds.has(obj.id)) {
      events.push({
        type: 'object' as const,
        action: 'destroy' as const,
        objectId: obj.id,
      });
    }
  }

  return events;
}

/**
 * 값을 VisualizationValue로 직렬화
 */
function serializeValue(v: unknown): string | number | boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return v;
  }
  return String(v);
}

/**
 * 얕은 동등 비교
 */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object' && a !== null && b !== null) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/**
 * 첫 스냅샷: 모든 것이 새로 생성
 */
function initFromFirst(snapshot: JavaScriptSnapshot): SimulatorEvent[] {
  const events: SimulatorEvent[] = [];

  for (const frame of snapshot.stack) {
    events.push({
      type: 'frame' as const,
      action: 'push' as const,
      name: frame.methodName,
    });
    events.push({
      type: 'scope' as const,
      action: 'enter' as const,
      scopeType: 'function' as const,
      name: frame.methodName,
    });
    for (const [name, value] of Object.entries(frame.variables)) {
      events.push({
        type: 'variable' as const,
        action: 'declare' as const,
        frame: frame.methodName,
        name,
        value: serializeValue(value),
      });
    }
  }

  for (const obj of snapshot.heap) {
    events.push({
      type: 'object' as const,
      action: 'create' as const,
      objectId: obj.id,
      className: obj.type,
    });
  }

  return events;
}

/**
 * 연속 스냅샷 배열을 diff하여 NormalizedJsStep[] 생성
 */
export function normalizeJsSnapshots(
  snapshots: JavaScriptSnapshot[],
): NormalizedJsStep[] {
  if (snapshots.length === 0) return [];

  const result: NormalizedJsStep[] = [];

  for (let i = 0; i < snapshots.length; i++) {
    const curr = snapshots[i];
    let events: SimulatorEvent[];

    if (i === 0) {
      events = initFromFirst(curr);
    } else {
      const prev = snapshots[i - 1];
      events = [
        ...diffFrames(prev.stack, curr.stack),
        ...diffVariables(prev.stack, curr.stack),
        ...diffHeap(prev.heap, curr.heap),
      ];
    }

    result.push({
      line: curr.line,
      events,
      snapshot: curr,
    });
  }

  return result;
}
