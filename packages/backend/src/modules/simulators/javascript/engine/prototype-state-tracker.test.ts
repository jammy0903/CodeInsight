import { describe, expect, it } from 'vitest';
import { JavaScriptPrototypeStateTracker } from './prototype-state-tracker';
import type { DebuggerPausedEvent } from './inspector-client';

describe('JavaScriptPrototypeStateTracker', () => {
  it('builds prototype chain from top-frame this object', async () => {
    const tracker = new JavaScriptPrototypeStateTracker();
    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: '1',
            functionName: 'run',
            location: { scriptId: '1', lineNumber: 0, columnNumber: 0 },
            scopeChain: [],
            this: { type: 'object', className: 'Box', description: 'Box', objectId: 'box-1' },
          },
        ],
      },
    };

    const propsById: Record<string, string[]> = {
      'box-1': ['value', 'getValue'],
      'box-proto': ['constructor', 'getValue'],
      'obj-proto': ['toString', 'hasOwnProperty'],
    };

    const nextById: Record<string, any> = {
      'box-1': { type: 'object', description: 'Box', objectId: 'box-proto' },
      'box-proto': { type: 'object', description: 'Object', objectId: 'obj-proto' },
      'obj-proto': { type: 'object', description: 'Object', objectId: '' },
    };

    const state = await tracker.build(paused, {
      async getProperties(objectId: string) {
        return (propsById[objectId] || []).map((name) => ({ name }));
      },
      async getObjectPrototype(objectId: string) {
        return nextById[objectId];
      },
    });

    expect(state).toBeTruthy();
    expect(state?.objects[0].name).toBe('Box');
    expect(state?.objects[0].props).toContain('value');
    expect(state?.objects[1].name).toBe('Box#1');
    expect(state?.objects[2].name).toBe('Object.prototype');
  });
});
