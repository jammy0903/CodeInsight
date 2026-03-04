import type { DebuggerPausedEvent } from './inspector-client';

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

interface WebApiItem {
  id: string;
  name: string;
  delay?: number;
}

interface EventLoopState {
  callStack: string[];
  webApis: Array<{ name: string; delay?: number }>;
  taskQueue: string[];
  microtaskQueue: string[];
}

const MAX_QUEUE_ITEMS = 100;

export class JavaScriptEventLoopStateTracker {
  private callStack: string[] = [];
  private webApis: WebApiItem[] = [];
  private taskQueue: string[] = [];
  private microtaskQueue: string[] = [];

  applyMarkers(markers: RuntimeMarkerEvent[]): void {
    for (const marker of markers) {
      switch (marker.kind) {
        case 'webapi_add': {
          const id = marker.id || '';
          if (!id || this.webApis.some((item) => item.id === id)) break;
          this.webApis.push({
            id,
            name: marker.label || marker.api || 'setTimeout',
            delay: marker.delay,
          });
          this.trim();
          break;
        }
        case 'webapi_fire': {
          const id = marker.id || '';
          if (!id) break;
          this.webApis = this.webApis.filter((item) => item.id !== id);
          break;
        }
        case 'task_enqueue': {
          const label = marker.label || 'callback';
          this.taskQueue.push(label);
          this.trim();
          break;
        }
        case 'task_dequeue': {
          this.dequeueByLabel(this.taskQueue, marker.label);
          break;
        }
        case 'microtask_enqueue': {
          const label = marker.label || 'microtask';
          this.microtaskQueue.push(label);
          this.trim();
          break;
        }
        case 'microtask_dequeue': {
          this.dequeueByLabel(this.microtaskQueue, marker.label);
          break;
        }
      }
    }
  }

  onPause(paused: DebuggerPausedEvent): void {
    this.callStack = paused.params.callFrames
      .map((frame) => frame.functionName || '__anonymous__')
      .filter((name) => name.length > 0);
  }

  getState(): EventLoopState {
    return {
      callStack: [...this.callStack],
      webApis: this.webApis.map((item) => ({
        name: item.name,
        ...(item.delay != null ? { delay: item.delay } : {}),
      })),
      taskQueue: [...this.taskQueue],
      microtaskQueue: [...this.microtaskQueue],
    };
  }

  private dequeueByLabel(queue: string[], label?: string): void {
    if (queue.length === 0) return;
    if (!label) {
      queue.shift();
      return;
    }
    const index = queue.indexOf(label);
    if (index >= 0) {
      queue.splice(index, 1);
      return;
    }
    queue.shift();
  }

  private trim(): void {
    if (this.taskQueue.length > MAX_QUEUE_ITEMS) {
      this.taskQueue = this.taskQueue.slice(-MAX_QUEUE_ITEMS);
    }
    if (this.microtaskQueue.length > MAX_QUEUE_ITEMS) {
      this.microtaskQueue = this.microtaskQueue.slice(-MAX_QUEUE_ITEMS);
    }
    if (this.webApis.length > MAX_QUEUE_ITEMS) {
      this.webApis = this.webApis.slice(-MAX_QUEUE_ITEMS);
    }
  }
}
