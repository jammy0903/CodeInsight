import { describe, expect, it } from 'vitest';
import { JavaScriptEventLoopStateTracker } from './event-loop-state-tracker';
import type { DebuggerPausedEvent } from './inspector-client';

describe('JavaScriptEventLoopStateTracker', () => {
  it('tracks queues/webapis and call stack from markers + pause events', () => {
    const tracker = new JavaScriptEventLoopStateTracker();

    tracker.applyMarkers([
      { kind: 'webapi_add', id: 't1', label: 'timeoutCb', delay: 0 },
      { kind: 'microtask_enqueue', id: 'm1', label: 'promise.then' },
      { kind: 'task_enqueue', id: 'tq1', label: 'timeoutCb' },
      { kind: 'microtask_dequeue', id: 'm1', label: 'promise.then' },
      { kind: 'webapi_fire', id: 't1' },
    ]);

    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: 'f1',
            functionName: 'timeoutCb',
            location: { scriptId: '1', lineNumber: 3, columnNumber: 0 },
            scopeChain: [],
          },
          {
            callFrameId: 'f2',
            functionName: '',
            location: { scriptId: '1', lineNumber: 8, columnNumber: 0 },
            scopeChain: [],
          },
        ],
      },
    };
    tracker.onPause(paused);

    const state = tracker.getState();
    expect(state.webApis).toEqual([]);
    expect(state.taskQueue).toEqual(['timeoutCb']);
    expect(state.microtaskQueue).toEqual([]);
    expect(state.callStack[0]).toBe('timeoutCb');
  });
});
