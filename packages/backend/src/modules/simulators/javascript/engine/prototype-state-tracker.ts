import type {
  DebuggerPausedEvent,
  InspectorPrototypeReader,
  InspectorRemoteObject,
} from './inspector-client';

interface PrototypeObjectEntry {
  name: string;
  props: string[];
  proto?: string;
}

interface PrototypeState {
  objects: PrototypeObjectEntry[];
}

const MAX_CHAIN_DEPTH = 8;

export class JavaScriptPrototypeStateTracker {
  async build(
    paused: DebuggerPausedEvent,
    reader: InspectorPrototypeReader
  ): Promise<PrototypeState | null> {
    const topFrame = paused.params.callFrames[0];
    const thisObject = topFrame?.this;
    if (!thisObject?.objectId || thisObject.type !== 'object') return null;

    const entries: PrototypeObjectEntry[] = [];
    const visited = new Set<string>();
    let current: InspectorRemoteObject | undefined = thisObject;
    let depth = 0;

    while (current?.objectId && depth < MAX_CHAIN_DEPTH) {
      if (visited.has(current.objectId)) break;
      visited.add(current.objectId);

      const name = resolveName(current, depth);
      const props = await this.readProps(current.objectId, reader);
      const next = await reader.getObjectPrototype(current.objectId);
      const nextName = next && next.type === 'object' ? resolveName(next, depth + 1) : undefined;

      entries.push({
        name,
        props,
        proto: nextName,
      });

      if (!next || next.type !== 'object' || !next.objectId) break;
      current = next;
      depth += 1;
    }

    if (entries.length === 0) return null;
    return { objects: dedupeNames(entries) };
  }

  private async readProps(objectId: string, reader: InspectorPrototypeReader): Promise<string[]> {
    const props = await reader.getProperties(objectId, {
      ownProperties: true,
      accessorPropertiesOnly: false,
      generatePreview: true,
    });

    return props
      .map((prop) => prop.name)
      .filter((name) => !!name && name !== '__proto__' && !name.startsWith('__'))
      .slice(0, 12);
  }
}

function resolveName(remote: InspectorRemoteObject, depth: number): string {
  if (remote.className && remote.className !== 'Object') {
    return remote.className;
  }
  if (remote.description) {
    if (remote.description === 'Object') return depth === 0 ? 'Object' : 'Object.prototype';
    return remote.description;
  }
  return depth === 0 ? 'Object' : `Prototype#${depth}`;
}

function dedupeNames(entries: PrototypeObjectEntry[]): PrototypeObjectEntry[] {
  const seen = new Set<string>();
  return entries.map((entry, idx) => {
    if (!seen.has(entry.name)) {
      seen.add(entry.name);
      return entry;
    }
    const renamed = `${entry.name}#${idx}`;
    return { ...entry, name: renamed };
  });
}
