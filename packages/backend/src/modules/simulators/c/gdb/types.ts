/**
 * GDB/MI 기반 C 시뮬레이터 타입 정의
 *
 * GDB Machine Interface 프로토콜의 응답을 구조화된 TypeScript 타입으로 표현
 */

// ============================================
// GDB/MI 프로토콜 타입
// ============================================

/** MI 응답의 result class */
export type MiResultClass = 'done' | 'running' | 'connected' | 'error' | 'exit';

/** MI async record class */
export type MiAsyncClass = 'stopped' | 'running' | 'thread-group-added' | 'thread-group-started'
  | 'thread-group-exited' | 'thread-created' | 'thread-exited'
  | 'breakpoint-modified' | 'library-loaded' | 'library-unloaded';

/** MI 응답 레코드 */
export interface MiRecord {
  /** 레코드 타입: result(^), exec(*), notify(=), console(~), target(@), log(&) */
  type: 'result' | 'exec' | 'notify' | 'console' | 'target' | 'log';
  class?: string;
  data: Record<string, MiValue>;
  raw: string;
}

/** MI 값 타입 (재귀적 — interface로 선언하여 순환 참조 허용) */
export type MiValue = string | MiValue[] | MiTuple;
export interface MiTuple { [key: string]: MiValue; }

// ============================================
// GDB 변수/프레임 타입
// ============================================

/** GDB에서 가져온 변수 정보 */
export interface GdbVariable {
  name: string;
  type: string;
  value: string;
}

/** 주소/바이트 정보가 추가된 변수 */
export interface EnrichedVariable extends GdbVariable {
  address: string;
  size: number;
  bytes: number[];
  pointsTo?: string;
}

/** GDB 스택 프레임 */
export interface GdbFrame {
  level: number;
  func: string;
  file?: string;
  fullname?: string;
  line?: number;
  addr: string;
}

/** GDB 브레이크포인트 */
export interface GdbBreakpoint {
  number: string;
  type: string;
  disp: string;
  enabled: string;
  addr: string;
  func?: string;
  file?: string;
  line?: number;
}

// ============================================
// 스텝 실행 결과
// ============================================

/** 프로그램 정지 이유 */
export type StopReason =
  | 'breakpoint-hit'
  | 'end-stepping-range'    // step/next 완료
  | 'function-finished'     // finish 완료
  | 'exited-normally'       // 정상 종료
  | 'exited'                // exit code와 함께 종료
  | 'exited-signalled'      // 시그널로 종료 (SIGSEGV 등)
  | 'signal-received'       // 시그널 수신
  | 'watchpoint-trigger'
  | 'solib-event';

/** 스텝 실행 결과 */
export interface StepResult {
  reason: StopReason;
  frame?: GdbFrame;
  signal?: {
    name: string;       // e.g., "SIGSEGV"
    meaning: string;    // e.g., "Segmentation fault"
  };
  exitCode?: number;
}

// ============================================
// 힙 트래킹 타입
// ============================================

/** 추적 중인 힙 블록 */
export interface TrackedHeapBlock {
  address: string;
  size: number;
  allocLine?: number;
  freed: boolean;
  freeLine?: number;
  type?: string;
}

// ============================================
// 트레이서 결과 타입 (기존 인터페이스와 호환)
// ============================================

export interface TraceResult {
  success: boolean;
  steps: import('../runtime/types').Step[];
  source_lines: string[];
  message?: string;
  error?: string;
  details?: string[];
  warnings?: string[];
}

// ============================================
// GDB 세션 옵션
// ============================================

export interface GdbSessionOptions {
  /** GDB 실행 경로 (기본: 'gdb') */
  gdbPath?: string;
  /** 최대 스텝 수 (무한루프 방지, 기본: 1000) */
  maxSteps?: number;
  /** 전체 타임아웃 ms (기본: 30000) */
  timeout?: number;
  /** 디버그 로깅 활성화 */
  debug?: boolean;
}
