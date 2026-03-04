import { describe, expect, it } from 'vitest';
import { JavaScriptScopeStateTracker } from './scope-state-tracker';
import type {
  DebuggerPausedEvent,
  InspectorPropertyDescriptor,
  InspectorPropertyReader,
} from './inspector-client';

class FakeReader implements InspectorPropertyReader {
  constructor(private readonly table: Record<string, InspectorPropertyDescriptor[]>) {}

  async getProperties(objectId: string): Promise<InspectorPropertyDescriptor[]> {
    return this.table[objectId] ?? [];
  }
}

describe('JavaScriptScopeStateTracker', () => {
  it('builds nested scope entries from top frame scope chain', async () => {
    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: 'f1',
            functionName: 'addAndWrap',
            location: { scriptId: '1', lineNumber: 10, columnNumber: 0 },
            scopeChain: [
              { type: 'local', object: { type: 'object', objectId: 'local-1' } },
              { type: 'script', object: { type: 'object', objectId: 'script-1' } },
            ],
          },
        ],
      },
    };

    const reader = new FakeReader({
      'local-1': [
        { name: 'x', enumerable: true, value: { type: 'number', value: 3 } },
        { name: 'sum', enumerable: true, value: { type: 'number', value: 7 } },
      ],
      'script-1': [
        { name: 'name', enumerable: true, value: { type: 'string', value: 'CodeInsight' } },
      ],
    });

    const tracker = new JavaScriptScopeStateTracker();
    const state = await tracker.build(paused, reader);
    expect(state?.scopes.length).toBe(1);
    expect(state?.scopes[0].name).toBe('__main__');
    expect(state?.scopes[0].children?.[0].name).toBe('addAndWrap');
    expect(state?.scopes[0].children?.[0].variables.map((v) => v.name)).toContain('x');
  });
});
