/**
 * Executor 모듈
 *
 * 모든 언어 실행기를 중앙에서 관리
 *
 * 사용:
 *   import { cExecutor } from '@/modules/executors';
 *   const result = await cExecutor.run(code, stdin);
 *
 * 추후 확장:
 *   import { pythonExecutor, javaExecutor } from '@/modules/executors';
 */

// Types
export type { ExecutionResult, IExecutor, JudgeResult } from './types';
export { Language } from './types';

// C Executor
export { CExecutor, cExecutor } from './c/index';
export { checkCodeSecurity as checkCCodeSecurity } from './c/index';

// TODO: Python Executor (Phase 2)
// export { PythonExecutor, pythonExecutor } from './python/index';

// TODO: Java Executor (Phase 2)
// export { JavaExecutor, javaExecutor } from './java/index';

// TODO: JavaScript Executor (Phase 2)
// export { JSExecutor, jsExecutor } from './javascript/index';
