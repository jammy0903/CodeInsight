/**
 * Shared Snapshot Normalizer
 *
 * Generates events by diffing consecutive GDB snapshots.
 * Used by both C and C++ simulators.
 *
 * Event types:
 *   - frame push/pop: function call entry/exit
 *   - variable declare/assign/destroy: variable lifecycle
 *   - output: new stdout content
 */

import type { GdbSnapshot } from './gdb-mi-parser';

interface NormalizedEvent {
  type: string;
  action?: string;
  [key: string]: unknown;
}

/** Generate events by comparing current snapshot to previous */
export function normalizeSnapshot(
  current: GdbSnapshot,
  previous: GdbSnapshot | null,
): NormalizedEvent[] {
  const events: NormalizedEvent[] = [];

  // 1. Frame events (push/pop)
  const prevFuncs = previous?.stack.map(f => f.functionName) || [];
  const currFuncs = current.stack.map(f => f.functionName);

  for (const func of currFuncs) {
    if (!prevFuncs.includes(func)) {
      events.push({ type: 'frame', action: 'push', name: func });
    }
  }

  for (const func of prevFuncs) {
    if (!currFuncs.includes(func)) {
      events.push({ type: 'frame', action: 'pop', name: func });
    }
  }

  // 2. Variable events
  for (const frame of current.stack) {
    const prevFrame = previous?.stack.find(f => f.functionName === frame.functionName);

    for (const variable of frame.variables) {
      const prevVar = prevFrame?.variables.find(v => v.name === variable.name);

      if (!prevVar) {
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

  // 3. Output events
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

/** Add normalized events to all snapshots */
export function normalizeAllSnapshots(snapshots: GdbSnapshot[]): GdbSnapshot[] {
  return snapshots.map((snapshot, index) => {
    const previous = index > 0 ? snapshots[index - 1] : null;
    return {
      ...snapshot,
      events: normalizeSnapshot(snapshot, previous),
    };
  });
}
