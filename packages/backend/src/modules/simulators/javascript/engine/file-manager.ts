import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class JavaScriptFileManager {
  private readonly BASE_DIR = path.resolve(process.cwd(), 'tmp', 'javascript');

  constructor() {
    fs.mkdir(this.BASE_DIR, { recursive: true }).catch(() => {});
  }

  /**
   * Creates a unique temporary project directory and writes the JavaScript source file.
   * @param code User JavaScript code
   * @returns The absolute path to the project directory
   */
  async createProject(code: string): Promise<string> {
    const projectId = crypto.randomUUID();
    const projectPath = path.join(this.BASE_DIR, projectId);

    // 1. Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // 2. Write main.js file
    await fs.writeFile(path.join(projectPath, 'main.js'), code, 'utf-8');
    await fs.writeFile(path.join(projectPath, 'ci-runtime-hook.js'), RUNTIME_HOOK_SOURCE, 'utf-8');

    return projectPath;
  }

  /**
   * Returns the path to the source file within a project.
   * @param projectPath The project directory path
   * @returns The absolute path to main.js
   */
  getSourcePath(projectPath: string): string {
    return path.join(projectPath, 'main.js');
  }

  /**
   * Cleans up the temporary project directory.
   * @param projectPath The project directory to delete
   */
  async cleanup(projectPath: string): Promise<void> {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.error(
        `Failed to cleanup JavaScript project ${projectPath}:`,
        error
      );
    }
  }
}

const RUNTIME_HOOK_SOURCE = `'use strict';

const MARK = '__CI_EVT__';
let timerSeq = 0;
let microSeq = 0;

function emit(event) {
  try {
    const payload = JSON.stringify(event);
    // Use debug channel and filter this marker on backend.
    console.debug(MARK + payload);
  } catch {}
}

function fnName(fn, fallback) {
  if (typeof fn === 'function' && fn.name) return fn.name;
  return fallback;
}

const originalSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = function wrappedSetTimeout(callback, delay, ...args) {
  const id = 't' + (++timerSeq);
  const label = fnName(callback, 'timeout');
  const ms = typeof delay === 'number' ? delay : Number(delay || 0);
  emit({ kind: 'webapi_add', id, api: 'setTimeout', label, delay: ms });

  const wrapped = function (...cbArgs) {
    emit({ kind: 'webapi_fire', id, api: 'setTimeout', label, delay: ms });
    emit({ kind: 'task_enqueue', id, label });
    emit({ kind: 'task_dequeue', id, label });
    return callback.apply(this, cbArgs);
  };
  return originalSetTimeout(wrapped, delay, ...args);
};

const originalQueueMicrotask = globalThis.queueMicrotask;
if (typeof originalQueueMicrotask === 'function') {
  globalThis.queueMicrotask = function wrappedQueueMicrotask(callback) {
    const id = 'm' + (++microSeq);
    const label = fnName(callback, 'microtask');
    emit({ kind: 'microtask_enqueue', id, label });
    return originalQueueMicrotask(function (...cbArgs) {
      emit({ kind: 'microtask_dequeue', id, label });
      return callback.apply(this, cbArgs);
    });
  };
}

const originalThen = Promise.prototype.then;
Promise.prototype.then = function wrappedThen(onFulfilled, onRejected) {
  const wrappedFulfilled = typeof onFulfilled === 'function'
    ? function (...args) {
        const id = 'm' + (++microSeq);
        const label = fnName(onFulfilled, 'promise.then');
        emit({ kind: 'microtask_enqueue', id, label });
        emit({ kind: 'microtask_dequeue', id, label });
        return onFulfilled.apply(this, args);
      }
    : onFulfilled;

  const wrappedRejected = typeof onRejected === 'function'
    ? function (...args) {
        const id = 'm' + (++microSeq);
        const label = fnName(onRejected, 'promise.catch');
        emit({ kind: 'microtask_enqueue', id, label });
        emit({ kind: 'microtask_dequeue', id, label });
        return onRejected.apply(this, args);
      }
    : onRejected;

  return originalThen.call(this, wrappedFulfilled, wrappedRejected);
};
`;
