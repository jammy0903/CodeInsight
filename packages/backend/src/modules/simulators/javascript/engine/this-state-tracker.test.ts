import { describe, expect, it } from 'vitest';
import { JavaScriptThisStateTracker } from './this-state-tracker';
import type { DebuggerPausedEvent } from './inspector-client';

describe('JavaScriptThisStateTracker', () => {
  it('builds thisState from top call frame and object properties', async () => {
    const tracker = new JavaScriptThisStateTracker();
    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: '1',
            functionName: 'greet',
            location: { scriptId: '1', lineNumber: 0, columnNumber: 0 },
            scopeChain: [],
            this: {
              type: 'object',
              className: 'User',
              description: 'User',
              objectId: 'obj-1',
            },
          },
        ],
      },
    };

    const state = await tracker.build(paused, {
      async getProperties() {
        return [
          { name: 'name', value: { type: 'string', value: 'Kim' } },
          { name: 'age', value: { type: 'number', value: 20 } },
        ];
      },
    });

    expect(state).toBeTruthy();
    expect(state?.context).toBe('method call');
    expect(state?.thisValue).toBe('User');
    expect(state?.binding?.method).toBe('greet');
    expect(state?.objects?.[0]?.properties).toEqual([
      { key: 'name', value: 'Kim' },
      { key: 'age', value: '20' },
    ]);
  });
});
