/**
 * C++ 스냅샷 정규화
 *
 * GDB 스냅샷을 SimulatorEvent[]로 변환
 * 연속 스냅샷을 diff하여 이벤트 생성
 */

import type { CppSnapshot, CppStackFrame, CppVariable } from '../engine/gdb-client';

interface NormalizedEvent {
  type: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * 단일 스냅샷에서 이벤트 생성 (이전 스냅샷과 비교)
 */
export function normalizeSnapshot(
  current: CppSnapshot,
  previous: CppSnapshot | null,
): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];

  // 1. 프레임 이벤트 (push/pop)
  const prevFuncs = previous?.stack.map(f => f.functionName) || [];
  const currFuncs = current.stack.map(f => f.functionName);

  // 새로 추가된 프레임 (현재에 있고 이전에 없는)
  for (const func of currFuncs) {
    if (!prevFuncs.includes(func)) {
      events.push({ type: 'frame', action: 'push', name: func });
    }
  }

  // 제거된 프레임 (이전에 있고 현재에 없는)
  for (const func of prevFuncs) {
    if (!currFuncs.includes(func)) {
      events.push({ type: 'frame', action: 'pop', name: func });
    }
  }

  // 2. 변수 이벤트
  for (const frame of current.stack) {
    const prevFrame = previous?.stack.find(f => f.functionName === frame.functionName);

    for (const variable of frame.variables) {
      const prevVar = prevFrame?.variables.find(v => v.name === variable.name);

      if (!prevVar) {
        // 새 변수 선언
        events.push({
          type: 'variable',
          action: 'declare',
          frame: frame.functionName,
          name: variable.name,
          varType: variable.type,
          value: variable.value,
          address: variable.address,
        });
      } else if (prevVar.value !== variable.value) {
        // 변수 값 변경
        events.push({
          type: 'variable',
          action: 'assign',
          frame: frame.functionName,
          name: variable.name,
          value: variable.value,
          previousValue: prevVar.value,
        });
      }
    }

    // 소멸된 변수 (이전 프레임에 있었지만 현재 없는)
    if (prevFrame) {
      for (const prevVar of prevFrame.variables) {
        const stillExists = frame.variables.find(v => v.name === prevVar.name);
        if (!stillExists) {
          events.push({
            type: 'variable',
            action: 'destroy',
            frame: frame.functionName,
            name: prevVar.name,
          });
        }
      }
    }
  }

  // 3. 출력 이벤트
  const prevStdout = previous?.stdout || '';
  if (current.stdout && current.stdout.length > prevStdout.length) {
    const newOutput = current.stdout.slice(prevStdout.length);
    events.push({
      type: 'output',
      stream: 'stdout',
      text: newOutput,
    });
  }

  return events;
}

/**
 * 전체 스냅샷 배열에 이벤트 추가
 */
export function normalizeAllSnapshots(snapshots: CppSnapshot[]): CppSnapshot[] {
  return snapshots.map((snapshot, index) => {
    const previous = index > 0 ? snapshots[index - 1] : null;
    return {
      ...snapshot,
      events: normalizeSnapshot(snapshot, previous),
    };
  });
}
