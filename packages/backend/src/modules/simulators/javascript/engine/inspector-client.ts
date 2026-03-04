import type { InspectorSession } from './inspector-runner';

type JsonMap = Record<string, unknown>;

type CdpRequest = {
  id: number;
  method: string;
  params?: JsonMap;
};

type CdpResponse = {
  id: number;
  result?: JsonMap;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

type CdpEvent = {
  method: string;
  params?: JsonMap;
};

type CdpEnvelope = CdpResponse | CdpEvent;

type PendingCommand = {
  resolve: (value: JsonMap) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
};

interface WsLike {
  onopen: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: ((event: unknown) => void) | null;
  onmessage: ((event: { data?: unknown }) => void) | null;
  send(data: string): void;
  close(code?: number): void;
}

interface WsCtorLike {
  new(url: string): WsLike;
}

export interface InspectorClientOptions {
  signal?: AbortSignal;
  commandTimeoutMs?: number;
}

export interface InspectorLocation {
  scriptId: string;
  lineNumber: number;
  columnNumber: number;
}

export interface InspectorRemoteObject {
  type: string;
  subtype?: string;
  className?: string;
  value?: unknown;
  unserializableValue?: string;
  description?: string;
  objectId?: string;
}

export interface InspectorScope {
  type: string;
  name?: string;
  object: InspectorRemoteObject;
}

export interface InspectorCallFrame {
  callFrameId: string;
  functionName: string;
  location: InspectorLocation;
  scopeChain: InspectorScope[];
  this?: InspectorRemoteObject;
}

export interface DebuggerPausedEvent {
  method: 'Debugger.paused';
  params: {
    reason: string;
    callFrames: InspectorCallFrame[];
  };
}

export interface InspectorPropertyDescriptor {
  name: string;
  value?: InspectorRemoteObject;
  enumerable?: boolean;
}

export interface InspectorStepResult {
  line: number;
  scriptId: string;
  scriptUrl: string;
  functionName: string;
  reason: string;
  callFrames: InspectorCallFrame[];
}

export interface InspectorPropertyReader {
  getProperties(
    objectId: string,
    options?: { ownProperties?: boolean; accessorPropertiesOnly?: boolean; generatePreview?: boolean }
  ): Promise<InspectorPropertyDescriptor[]>;
}

export interface InspectorPrototypeReader extends InspectorPropertyReader {
  getObjectPrototype(objectId: string): Promise<InspectorRemoteObject | undefined>;
}

export interface RuntimeMarkerEvent {
  kind:
    | 'webapi_add'
    | 'webapi_fire'
    | 'task_enqueue'
    | 'task_dequeue'
    | 'microtask_enqueue'
    | 'microtask_dequeue';
  id?: string;
  label?: string;
  api?: string;
  delay?: number;
}

export class JavaScriptInspectorClient implements InspectorPropertyReader {
  private session: InspectorSession | null = null;
  private ws: WsLike | null = null;
  private connected = false;
  private commandTimeoutMs = 10000;
  private requestId = 1;
  private pending = new Map<number, PendingCommand>();
  private pausedQueue: DebuggerPausedEvent[] = [];
  private pausedWaiters: Array<(event: DebuggerPausedEvent) => void> = [];
  private stdoutBuffer: string[] = [];
  private runtimeMarkerBuffer: RuntimeMarkerEvent[] = [];
  private scriptIdToUrl = new Map<string, string>();

  async connect(
    session: InspectorSession,
    options: InspectorClientOptions = {}
  ): Promise<void> {
    if (options.signal?.aborted) {
      throw new Error('Inspector connect aborted');
    }

    const WsCtor = (globalThis as { WebSocket?: WsCtorLike }).WebSocket;
    if (!WsCtor) {
      throw new Error('WebSocket is not available in this runtime');
    }

    this.session = session;
    this.commandTimeoutMs = options.commandTimeoutMs ?? this.commandTimeoutMs;

    this.ws = await this.openWebSocket(new WsCtor(session.wsUrl), options.signal);
    this.connected = true;
  }

  async enableDebugger(): Promise<void> {
    this.assertConnected();
    await this.sendCommand('Runtime.enable');
    await this.sendCommand('Debugger.enable');
    await this.sendCommand('Debugger.setBreakpointsActive', { active: true });
  }

  async setAsyncCallStackDepth(maxDepth = 32): Promise<void> {
    this.assertConnected();
    await this.sendCommand('Debugger.setAsyncCallStackDepth', { maxDepth });
  }

  async setBreakpointByUrl(lineNumber: number, url: string): Promise<void> {
    this.assertConnected();
    await this.sendCommand('Debugger.setBreakpointByUrl', {
      lineNumber,
      url,
    });
  }

  async setBlackboxPatterns(patterns: string[]): Promise<void> {
    this.assertConnected();
    await this.sendCommand('Debugger.setBlackboxPatterns', { patterns });
  }

  async runIfWaitingForDebugger(): Promise<void> {
    this.assertConnected();
    await this.sendCommand('Runtime.runIfWaitingForDebugger');
  }

  async resume(): Promise<void> {
    this.assertConnected();
    await this.sendCommand('Debugger.resume');
  }

  async stepOver(signal?: AbortSignal): Promise<InspectorStepResult | null> {
    this.assertConnected();
    await this.sendCommand('Debugger.stepOver');
    const paused = await this.waitForPaused({ signal });
    if (!paused) return null;

    const top = paused.params.callFrames[0];
    if (!top) return null;

    return {
      line: top.location.lineNumber + 1,
      scriptId: top.location.scriptId,
      scriptUrl: this.getScriptUrl(top.location.scriptId) || '',
      functionName: top.functionName || '__anonymous__',
      reason: paused.params.reason,
      callFrames: paused.params.callFrames,
    };
  }

  async stepInto(signal?: AbortSignal): Promise<InspectorStepResult | null> {
    this.assertConnected();
    await this.sendCommand('Debugger.stepInto');
    const paused = await this.waitForPaused({ signal });
    if (!paused) return null;

    const top = paused.params.callFrames[0];
    if (!top) return null;

    return {
      line: top.location.lineNumber + 1,
      scriptId: top.location.scriptId,
      scriptUrl: this.getScriptUrl(top.location.scriptId) || '',
      functionName: top.functionName || '__anonymous__',
      reason: paused.params.reason,
      callFrames: paused.params.callFrames,
    };
  }

  getScriptUrl(scriptId: string): string | undefined {
    return this.scriptIdToUrl.get(scriptId);
  }

  async getProperties(
    objectId: string,
    options?: { ownProperties?: boolean; accessorPropertiesOnly?: boolean; generatePreview?: boolean }
  ): Promise<InspectorPropertyDescriptor[]> {
    this.assertConnected();
    const result = await this.sendCommand('Runtime.getProperties', {
      objectId,
      ownProperties: options?.ownProperties ?? true,
      accessorPropertiesOnly: options?.accessorPropertiesOnly ?? false,
      generatePreview: options?.generatePreview ?? true,
    });

    const descriptors = result.result;
    if (!Array.isArray(descriptors)) return [];
    return descriptors as InspectorPropertyDescriptor[];
  }

  async getObjectPrototype(objectId: string): Promise<InspectorRemoteObject | undefined> {
    this.assertConnected();
    const result = await this.sendCommand('Runtime.callFunctionOn', {
      objectId,
      functionDeclaration: 'function(){ return Object.getPrototypeOf(this); }',
      returnByValue: false,
      silent: true,
    });

    const remote = result.result;
    if (!remote || typeof remote !== 'object') return undefined;
    return remote as InspectorRemoteObject;
  }

  async waitForPaused(options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<DebuggerPausedEvent | null> {
    this.assertConnected();
    if (this.pausedQueue.length > 0) {
      return this.pausedQueue.shift() ?? null;
    }

    const timeoutMs = options.timeoutMs ?? this.commandTimeoutMs;

    return new Promise<DebuggerPausedEvent | null>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Debugger.paused timeout (${timeoutMs}ms)`));
      }, timeoutMs);

      const onAbort = () => {
        cleanup();
        reject(new Error('waitForPaused aborted'));
      };

      const onPaused = (event: DebuggerPausedEvent) => {
        cleanup();
        resolve(event);
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.pausedWaiters = this.pausedWaiters.filter((w) => w !== onPaused);
        if (options.signal) {
          options.signal.removeEventListener('abort', onAbort);
        }
      };

      this.pausedWaiters.push(onPaused);

      if (options.signal) {
        if (options.signal.aborted) {
          onAbort();
          return;
        }
        options.signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  drainStdout(): string | undefined {
    if (this.stdoutBuffer.length === 0) return undefined;
    const output = this.stdoutBuffer.join('\n');
    this.stdoutBuffer = [];
    return output;
  }

  drainRuntimeMarkers(): RuntimeMarkerEvent[] {
    if (this.runtimeMarkerBuffer.length === 0) return [];
    const markers = [...this.runtimeMarkerBuffer];
    this.runtimeMarkerBuffer = [];
    return markers;
  }

  async disconnect(): Promise<void> {
    const ws = this.ws;
    this.connected = false;
    this.session = null;
    this.ws = null;
    this.clearPending(new Error('Inspector client disconnected'));
    this.pausedQueue = [];
    this.pausedWaiters = [];
    this.stdoutBuffer = [];
    this.runtimeMarkerBuffer = [];

    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close(1000);
    }
  }

  private async sendCommand(method: string, params?: JsonMap): Promise<JsonMap> {
    this.assertConnected();
    const ws = this.ws!;
    const id = this.requestId++;

    return new Promise<JsonMap>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, this.commandTimeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      const payload: CdpRequest = { id, method, params };
      ws.send(JSON.stringify(payload));
    });
  }

  private openWebSocket(ws: WsLike, signal?: AbortSignal): Promise<WsLike> {
    return new Promise<WsLike>((resolve, reject) => {
      let settled = false;

      const onAbort = () => {
        if (settled) return;
        settled = true;
        try {
          ws.close(1000);
        } finally {
          reject(new Error('Inspector socket connect aborted'));
        }
      };

      ws.onopen = () => {
        if (settled) return;
        settled = true;
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        ws.onmessage = (event) => this.handleMessage(event.data);
        ws.onerror = () => this.handleTransportError(new Error('Inspector socket error'));
        ws.onclose = () => this.handleTransportError(new Error('Inspector socket closed'));
        resolve(ws);
      };

      ws.onerror = () => {
        if (settled) return;
        settled = true;
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        reject(new Error('Inspector socket open failed'));
      };

      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  private handleMessage(rawData: unknown): void {
    const text = typeof rawData === 'string' ? rawData : String(rawData ?? '');
    if (!text) return;

    let message: CdpEnvelope;
    try {
      message = JSON.parse(text) as CdpEnvelope;
    } catch {
      return;
    }

    if ('id' in message && typeof message.id === 'number') {
      const pending = this.pending.get(message.id);
      if (!pending) return;

      this.pending.delete(message.id);
      clearTimeout(pending.timer);

      if (message.error) {
        pending.reject(new Error(`CDP ${message.error.code}: ${message.error.message}`));
      } else {
        pending.resolve(message.result ?? {});
      }
      return;
    }

    if ('method' in message && message.method === 'Debugger.paused') {
      const paused = message as DebuggerPausedEvent;
      const waiter = this.pausedWaiters.shift();
      if (waiter) {
        waiter(paused);
      } else {
        this.pausedQueue.push(paused);
      }
      return;
    }

    if ('method' in message && message.method === 'Runtime.consoleAPICalled') {
      const marker = parseRuntimeMarker(message.params);
      if (marker) {
        this.runtimeMarkerBuffer.push(marker);
        return;
      }
      const text = formatConsoleEvent(message.params);
      if (text) {
        this.stdoutBuffer.push(text);
      }
      return;
    }

    if ('method' in message && message.method === 'Debugger.scriptParsed') {
      const params = message.params;
      if (!params) return;
      const scriptId = typeof params.scriptId === 'string' ? params.scriptId : '';
      const url = typeof params.url === 'string' ? params.url : '';
      if (scriptId) {
        this.scriptIdToUrl.set(scriptId, url);
      }
    }
  }

  private handleTransportError(error: Error): void {
    if (!this.connected) return;
    this.connected = false;
    this.clearPending(error);
  }

  private clearPending(reason: Error): void {
    for (const [id, pending] of this.pending.entries()) {
      this.pending.delete(id);
      clearTimeout(pending.timer);
      pending.reject(reason);
    }
  }

  private assertConnected(): void {
    if (!this.connected || !this.session || !this.ws) {
      throw new Error('Inspector client is not connected');
    }
  }
}

function formatConsoleEvent(params: JsonMap | undefined): string | null {
  if (!params) return null;
  const args = params.args;
  if (!Array.isArray(args)) return null;
  const chunks = args.map(formatRemoteValue).filter((v) => v.length > 0);
  return chunks.join(' ');
}

function formatRemoteValue(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return '';
  const value = raw as Record<string, unknown>;

  if (typeof value.unserializableValue === 'string') {
    return value.unserializableValue;
  }
  if (value.value !== undefined && value.value !== null) {
    return String(value.value);
  }
  if (typeof value.description === 'string') {
    return value.description;
  }
  return '';
}

function parseRuntimeMarker(params: JsonMap | undefined): RuntimeMarkerEvent | null {
  if (!params) return null;
  const args = params.args;
  if (!Array.isArray(args) || args.length === 0) return null;
  const first = args[0];
  if (!first || typeof first !== 'object') return null;
  const firstRecord = first as Record<string, unknown>;
  if (typeof firstRecord.value !== 'string') return null;

  const markerPrefix = '__CI_EVT__';
  if (!firstRecord.value.startsWith(markerPrefix)) return null;

  const payload = firstRecord.value.slice(markerPrefix.length);
  try {
    const parsed = JSON.parse(payload) as RuntimeMarkerEvent;
    if (!parsed || typeof parsed.kind !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}
