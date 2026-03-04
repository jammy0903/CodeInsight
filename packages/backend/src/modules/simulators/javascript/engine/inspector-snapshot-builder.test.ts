import { describe, expect, it } from 'vitest';
import { JavaScriptInspectorSnapshotBuilder } from './inspector-snapshot-builder';
import type {
  DebuggerPausedEvent,
  InspectorPropertyDescriptor,
  InspectorPropertyReader,
} from './inspector-client';

class FakeReader implements InspectorPropertyReader {
  private readonly table: Record<string, InspectorPropertyDescriptor[]>;

  constructor(table: Record<string, InspectorPropertyDescriptor[]>) {
    this.table = table;
  }

  async getProperties(objectId: string): Promise<InspectorPropertyDescriptor[]> {
    return this.table[objectId] ?? [];
  }
}

describe('JavaScriptInspectorSnapshotBuilder', () => {
  it('builds stack/heap snapshot from paused event', async () => {
    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: 'frame-1',
            functionName: 'main',
            location: {
              scriptId: '1',
              lineNumber: 2,
              columnNumber: 0,
            },
            scopeChain: [
              {
                type: 'local',
                object: {
                  type: 'object',
                  objectId: 'scope-1',
                },
              },
            ],
          },
        ],
      },
    };

    const reader = new FakeReader({
      'scope-1': [
        {
          name: 'x',
          enumerable: true,
          value: { type: 'number', value: 3 },
        },
        {
          name: 'obj',
          enumerable: true,
          value: {
            type: 'object',
            className: 'Object',
            objectId: 'obj-1',
            description: 'Object',
          },
        },
      ],
    });

    const builder = new JavaScriptInspectorSnapshotBuilder();
    const snapshot = await builder.build(paused, reader);

    expect(snapshot.line).toBe(3);
    expect(snapshot.event).toBe('STEP');
    expect(snapshot.stack).toHaveLength(1);
    expect(snapshot.stack[0].methodName).toBe('main');
    expect(snapshot.stack[0].variables.x).toBe(3);
    expect(snapshot.stack[0].variables.obj).toEqual({
      id: '@obj-1',
      class: 'Object',
    });
    expect(snapshot.heap).toContainEqual({
      id: 'obj-1',
      address: '@obj-1',
      type: 'Object',
      content: 'Object',
    });
  });

  it('separates active frame locals from root script/global variables', async () => {
    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: 'frame-1',
            functionName: 'addAndWrap',
            location: {
              scriptId: '1',
              lineNumber: 10,
              columnNumber: 0,
            },
            scopeChain: [
              {
                type: 'local',
                object: {
                  type: 'object',
                  objectId: 'scope-local',
                },
              },
              {
                type: 'script',
                object: {
                  type: 'object',
                  objectId: 'scope-script',
                },
              },
            ],
          },
          {
            callFrameId: 'frame-2',
            functionName: '',
            location: {
              scriptId: '1',
              lineNumber: 16,
              columnNumber: 0,
            },
            scopeChain: [
              {
                type: 'script',
                object: {
                  type: 'object',
                  objectId: 'scope-script',
                },
              },
            ],
          },
        ],
      },
    };

    const reader = new FakeReader({
      'scope-local': [
        {
          name: 'x',
          enumerable: true,
          value: { type: 'number', value: 3 },
        },
        {
          name: 'sum',
          enumerable: true,
          value: { type: 'number', value: 7 },
        },
      ],
      'scope-script': [
        {
          name: 'name',
          enumerable: true,
          value: { type: 'string', value: 'CodeInsight' },
        },
        {
          name: 'version',
          enumerable: true,
          value: { type: 'number', value: 1 },
        },
      ],
    });

    const builder = new JavaScriptInspectorSnapshotBuilder();
    const snapshot = await builder.build(paused, reader);

    expect(snapshot.stack).toHaveLength(2);
    expect(snapshot.stack[0].methodName).toBe('addAndWrap');
    expect(snapshot.stack[0].variables).toMatchObject({
      x: 3,
      sum: 7,
    });
    expect(snapshot.stack[0].variables.name).toBeUndefined();
    expect(snapshot.stack[1].methodName).toBe('__main__');
    expect(snapshot.stack[1].variables).toMatchObject({
      name: 'CodeInsight',
      version: 1,
    });
  });

  it('routes script scope found on active frame into __main__', async () => {
    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: 'frame-1',
            functionName: 'addAndWrap',
            location: { scriptId: '1', lineNumber: 14, columnNumber: 0 },
            scopeChain: [
              {
                type: 'local',
                object: { type: 'object', objectId: 'scope-local-2' },
              },
              {
                type: 'script',
                object: { type: 'object', objectId: 'scope-script-2' },
              },
            ],
          },
          {
            callFrameId: 'frame-2',
            functionName: '',
            location: { scriptId: '1', lineNumber: 16, columnNumber: 0 },
            scopeChain: [
              {
                type: 'local',
                object: { type: 'object', objectId: 'scope-root-empty' },
              },
            ],
          },
        ],
      },
    };

    const reader = new FakeReader({
      'scope-local-2': [
        { name: 'x', enumerable: true, value: { type: 'number', value: 3 } },
        { name: 'y', enumerable: true, value: { type: 'number', value: 4 } },
        { name: 'sum', enumerable: true, value: { type: 'number', value: 7 } },
      ],
      'scope-script-2': [
        { name: 'name', enumerable: true, value: { type: 'string', value: 'CodeInsight' } },
        { name: 'version', enumerable: true, value: { type: 'number', value: 1 } },
      ],
      'scope-root-empty': [],
    });

    const builder = new JavaScriptInspectorSnapshotBuilder();
    const snapshot = await builder.build(paused, reader);

    expect(snapshot.stack).toHaveLength(2);
    expect(snapshot.stack[0].methodName).toBe('addAndWrap');
    expect(snapshot.stack[0].variables).toMatchObject({ x: 3, y: 4, sum: 7 });
    expect(snapshot.stack[0].variables.name).toBeUndefined();
    expect(snapshot.stack[1].methodName).toBe('__main__');
    expect(snapshot.stack[1].variables).toMatchObject({ name: 'CodeInsight', version: 1 });
  });

  it('formats function values as compact labels instead of full source', async () => {
    const paused: DebuggerPausedEvent = {
      method: 'Debugger.paused',
      params: {
        reason: 'other',
        callFrames: [
          {
            callFrameId: 'frame-1',
            functionName: '',
            location: { scriptId: '1', lineNumber: 1, columnNumber: 0 },
            scopeChain: [
              {
                type: 'script',
                object: { type: 'object', objectId: 'scope-fn' },
              },
            ],
          },
        ],
      },
    };

    const reader = new FakeReader({
      'scope-fn': [
        {
          name: 'addAndWrap',
          enumerable: true,
          value: {
            type: 'function',
            objectId: 'fn-1',
            description: 'function addAndWrap(x, y) { const sum = x + y; return { sum }; }',
          },
        },
      ],
    });

    const builder = new JavaScriptInspectorSnapshotBuilder();
    const snapshot = await builder.build(paused, reader);

    expect(snapshot.stack[0].variables.addAndWrap).toEqual({
      id: '@fn-1',
      class: 'Function',
      displayValue: 'f addAndWrap()',
    });
    expect(snapshot.heap).toContainEqual({
      id: 'fn-1',
      address: '@fn-1',
      type: 'Function',
      content: 'f addAndWrap()',
    });
  });
});
