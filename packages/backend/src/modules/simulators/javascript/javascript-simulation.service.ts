/**
 * 📚 교육용 JavaScript 메모리 시뮬레이터 v2
 *
 * 🏗️ 아키텍처 (Node.js vm + AST 기반):
 *   - JavaScriptFileManager: 임시 프로젝트 생성/삭제 (main.js)
 *   - JavaScriptDebuggerClient: Node.js vm 모듈 + AST 계측
 *   - 샌드박스 실행 (격리된 환경)
 *
 * 🔄 4단계 파이프라인:
 *   1️⃣ Validate → 보안 검증 + 구문 검증 (정규식 + new Function)
 *   2️⃣ Setup    → 임시 디렉토리에 main.js + tracer.js 생성
 *   3️⃣ Trace    → node main.js 실행 + AST 계측으로 스냅샷 수집
 *   4️⃣ Cleanup  → 임시 파일/디렉토리 삭제
 *
 * ⚡ 에러 처리 원칙:
 *   - 재시도 없이 즉시 에러 반환 (빠른 실패)
 *   - 세분화된 에러 코드 (CODE_TOO_LONG, DANGEROUS_CODE, TIMEOUT 등)
 *   - 프론트엔드가 Toast 알림으로 사용자 피드백 담당
 *
 * 🛡️ 보안 정책:
 *   - require() 차단 (fs, child_process, net, http 등)
 *   - 동적 코드 실행 차단 (eval, new Function, import())
 *   - VM 탈출 시도 차단 (this.constructor, Object.getPrototypeOf)
 *   - 코드 길이 제한 (10000자, 500줄)
 *
 * 📦 의존성:
 *   - Node.js 18+
 *   - agent/tracer.js (vm + AST 계측 구현체)
 */

import { JavaScriptFileManager } from './engine/file-manager';
import {
  JavaScriptDebuggerClient,
  JavaScriptSnapshot,
} from './engine/debugger-client';

// ═══════════════════════════════════════════════════════
// 에러 코드 정의
// ═══════════════════════════════════════════════════════
// 💡 세분화된 에러 코드로 프론트엔드가 적절한 메시지 표시

/**
 * 시뮬레이션 에러 코드 (Enum)
 */
export enum SimulationErrorCode {
  CODE_TOO_LONG = 'CODE_TOO_LONG',            // 코드 길이 초과 (10000자 or 500줄)
  DANGEROUS_CODE = 'DANGEROUS_CODE',          // 보안 정책 위반 (require, eval 등)
  SYNTAX_ERROR = 'SYNTAX_ERROR',              // 구문 오류 (파싱 실패)
  TIMEOUT = 'TIMEOUT',                        // 실행 시간 초과 (무한 루프)
  MAX_STEPS_EXCEEDED = 'MAX_STEPS_EXCEEDED',  // 최대 스텝 수 초과
  RUNTIME_ERROR = 'RUNTIME_ERROR',            // 런타임 에러 (예외 발생)
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',    // 파일 시스템 에러
}

/**
 * 시뮬레이션 에러 클래스
 *
 * 💡 표준 Error 확장 + 에러 코드 추가
 */
export class SimulationError extends Error {
  constructor(
    message: string,
    public code: SimulationErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SimulationError';
  }
}

// ═══════════════════════════════════════════════════════
// 타입 정의
// ═══════════════════════════════════════════════════════

/**
 * JavaScript 시뮬레이션 결과 타입
 */
export interface JavaScriptSimulationResult {
  success: boolean;
  steps?: JavaScriptSnapshot[];
  error?: {
    code: SimulationErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * 코드 검증 결과 타입 (내부용)
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: SimulationErrorCode;
}

// ═══════════════════════════════════════════════════════
// 상수
// ═══════════════════════════════════════════════════════

// 📏 코드 길이 제한 (서비스 거부 공격 방지)
const MAX_CODE_LENGTH = 10000;  // 최대 10000자
const MAX_LINES = 500;           // 최대 500줄

// 🚨 위험한 패턴 목록 (정규식 + 설명)
// 💡 보안상 차단해야 하는 JavaScript 코드 패턴
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // ──────────────────────────────────────
  // 📁 파일 시스템 접근
  // ──────────────────────────────────────
  { pattern: /\brequire\s*\(\s*['"]fs['"]\s*\)/, reason: '파일 시스템 접근' },
  { pattern: /\brequire\s*\(\s*['"]path['"]\s*\)/, reason: '파일 경로 접근' },

  // ──────────────────────────────────────
  // ⚙️ 프로세스 제어
  // ──────────────────────────────────────
  { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, reason: '프로세스 실행' },
  { pattern: /\bprocess\.exit\s*\(/, reason: '프로세스 종료' },
  { pattern: /\bprocess\.env\b/, reason: '환경 변수 접근' },
  { pattern: /\bprocess\.kill\s*\(/, reason: '프로세스 종료' },

  // ──────────────────────────────────────
  // 🌐 네트워크 접근
  // ──────────────────────────────────────
  { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/, reason: '네트워크 접근' },
  { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/, reason: 'HTTP 접근' },
  { pattern: /\brequire\s*\(\s*['"]https['"]\s*\)/, reason: 'HTTPS 접근' },
  { pattern: /\brequire\s*\(\s*['"]dgram['"]\s*\)/, reason: 'UDP 접근' },
  { pattern: /\bfetch\s*\(/, reason: '네트워크 요청' },

  // ──────────────────────────────────────
  // 💀 동적 코드 실행
  // ──────────────────────────────────────
  { pattern: /\beval\s*\(/, reason: '동적 코드 실행' },
  { pattern: /\bnew\s+Function\s*\(/, reason: '동적 함수 생성' },
  { pattern: /\bimport\s*\(/, reason: '동적 임포트' },

  // ──────────────────────────────────────
  // 🔓 글로벌/내부 변수 접근
  // ──────────────────────────────────────
  { pattern: /\bglobal\b/, reason: '글로벌 객체 접근' },
  { pattern: /\b__dirname\b/, reason: '디렉토리 경로 접근' },
  { pattern: /\b__filename\b/, reason: '파일 경로 접근' },

  // ──────────────────────────────────────
  // 🚪 VM 탈출 시도
  // ──────────────────────────────────────
  { pattern: /\brequire\s*\(\s*[^'"]+\)/, reason: '동적 require (문자열 조작)' },
  { pattern: /\bthis\.constructor\b/, reason: 'VM 탈출 시도' },
  { pattern: /\bObject\.getPrototypeOf\s*\(/, reason: '프로토타입 체인 조작' },
];

// ═══════════════════════════════════════════════════════
// 서비스 클래스
// ═══════════════════════════════════════════════════════

/**
 * JavaScript 시뮬레이션 서비스 메인 클래스
 *
 * 🎯 역할:
 *   - 사용자 코드 보안 검증 (정규식 + new Function)
 *   - Node.js vm 모듈 기반 샌드박스 실행
 *   - AST 계측으로 라인별 스냅샷 수집
 *   - 스냅샷 후처리 (Python/Java 호환 포맷)
 *
 * 💡 설계 의도:
 *   - Java/Python과 달리 구문 검증 포함 (new Function으로 파싱)
 *   - 세분화된 에러 코드 (8가지)
 *   - 각 요청마다 새 인스턴스 생성 (stateless)
 */
export class JavaScriptSimulationService {
  // 📁 파일 시스템 관리 (임시 프로젝트 생성/삭제)
  private fileManager: JavaScriptFileManager;

  // 🐛 디버거 클라이언트 (vm + AST 계측)
  private debuggerClient: JavaScriptDebuggerClient;

  /**
   * 생성자 - 의존성 초기화
   *
   * 💡 각 시뮬레이션 요청마다 새 인스턴스 생성됨
   */
  constructor() {
    this.fileManager = new JavaScriptFileManager();
    this.debuggerClient = new JavaScriptDebuggerClient();
  }

  /**
   * 🚀 JavaScript 코드 시뮬레이션 실행 (메인 엔트리포인트)
   *
   * 📝 동작 흐름:
   *   1. 코드 검증 (보안 + 구문 + 길이)
   *   2. 임시 프로젝트 디렉토리 생성 (/tmp/js-sim-XXXXXX)
   *   3. main.js + tracer.js 파일 생성
   *   4. node main.js 실행 + AST 계측으로 스냅샷 수집
   *   5. 스냅샷 후처리 (유효 라인 검증, methodName 정규화)
   *   6. 임시 파일 정리
   *
   * ⚠️ 주의사항:
   *   - require, eval, new Function 등 위험 코드 차단
   *   - 코드 길이 제한 (10000자, 500줄)
   *   - 타임아웃 30초 (무한 루프 방지)
   *   - ERROR 이벤트 스냅샷은 필터링 (에러는 catch에서 처리)
   *
   * 🔄 에러 처리:
   *   - TIMEOUT → "무한 루프가 있는지 확인해주세요"
   *   - SYNTAX_ERROR → 파싱 에러 메시지 그대로 반환
   *   - RUNTIME_ERROR → 기타 에러
   *
   * @param sourceCode 실행할 JavaScript 소스 코드
   * @returns 성공 여부 + 스냅샷 배열 또는 에러 객체
   *
   * @example
   * const result = await service.simulate('let x = 10;\nconsole.log(x);');
   * // → { success: true, steps: [...] }
   *
   * @example
   * const result = await service.simulate('require("fs")');
   * // → { success: false, error: { code: 'DANGEROUS_CODE', ... } }
   */
  public async simulate(sourceCode: string): Promise<JavaScriptSimulationResult> {
    // 📂 임시 프로젝트 경로 (cleanup용)
    let projectPath: string | null = null;

    try {
      // ═══════════════════════════════════════════════════════
      // 1️⃣ Validate: 코드 검증 (보안 + 구문 + 길이)
      // ═══════════════════════════════════════════════════════
      // 💡 3단계 검증:
      //    a) 기본 타입 (string인지)
      //    b) 길이 제한 (10000자, 500줄)
      //    c) 위험 패턴 (require, eval 등)
      //    d) 구문 검증 (new Function으로 파싱)
      const validation = this.validateCode(sourceCode);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: validation.code || SimulationErrorCode.DANGEROUS_CODE,
            message: validation.error || '코드 검증 실패',
          },
        };
      }

      // ═══════════════════════════════════════════════════════
      // 2️⃣ Setup: 임시 프로젝트 생성
      // ═══════════════════════════════════════════════════════
      // 💡 /tmp/js-sim-XXXXXX 디렉토리에 main.js 생성
      //    + tracer.js (vm + AST 계측 구현체) 복사
      projectPath = await this.fileManager.createProject(sourceCode);

      // ═══════════════════════════════════════════════════════
      // 3️⃣ Trace: 디버거 실행
      // ═══════════════════════════════════════════════════════
      // 💡 node main.js 실행
      //    각 라인마다 스냅샷 수집 (변수, 스택, 힙 상태)
      //    stdout을 통해 JSON 스냅샷 수신
      const snapshots = await this.debuggerClient.run(projectPath);

      // ═══════════════════════════════════════════════════════
      // 4️⃣ Post-process: 스냅샷 후처리
      // ═══════════════════════════════════════════════════════
      // 💡 - 유효하지 않은 라인 번호 필터링 (line < 1 또는 > maxLine)
      //    - ERROR 이벤트 스냅샷 제거 (이미 catch에서 처리)
      //    - methodName 정규화 (main → __main__)
      //    - 소스 코드 라인 추가 (code 필드)
      const processedSnapshots = this.processSnapshots(snapshots, sourceCode);

      // 🎉 성공 반환
      return {
        success: true,
        steps: processedSnapshots,
      };

    } catch (error: unknown) {
      const err = error as Error;

      // ═══════════════════════════════════════════════════════
      // 🚨 에러 분류 및 처리
      // ═══════════════════════════════════════════════════════

      // ⏱️ 타임아웃 에러 (무한 루프)
      if (err.message?.includes('Time Limit') || err.message?.includes('timeout')) {
        return {
          success: false,
          error: {
            code: SimulationErrorCode.TIMEOUT,
            message: '실행 시간이 초과되었습니다. 무한 루프가 있는지 확인해주세요.',
          },
        };
      }

      // 📝 구문 에러 (파싱 실패)
      if (err.message?.includes('Syntax') || err.message?.includes('parse')) {
        return {
          success: false,
          error: {
            code: SimulationErrorCode.SYNTAX_ERROR,
            message: err.message,
          },
        };
      }

      // 💥 런타임 에러 (기타 에러)
      return {
        success: false,
        error: {
          code: SimulationErrorCode.RUNTIME_ERROR,
          message: err.message || '알 수 없는 오류가 발생했습니다.',
        },
      };

    } finally {
      // ═══════════════════════════════════════════════════════
      // 5️⃣ Cleanup: 임시 파일 정리
      // ═══════════════════════════════════════════════════════
      // 💡 성공/실패 관계없이 항상 실행
      //    디스크 공간 누수 방지
      if (projectPath) {
        await this.fileManager.cleanup(projectPath);
      }
    }
  }

  /**
   * 🛡️ 코드 검증 (보안 + 구문 + 길이)
   *
   * 📝 검증 단계:
   *   1️⃣ 기본 타입 검증 (string인지)
   *   2️⃣ 길이 제한 (10000자, 500줄)
   *   3️⃣ 위험 패턴 검사 (DANGEROUS_PATTERNS)
   *   4️⃣ 구문 검증 (new Function으로 파싱)
   *
   * ⚠️ 차단되는 패턴:
   *   - require('fs') / require('child_process') 등
   *   - eval() / new Function() / import()
   *   - process.exit() / global / __dirname
   *   - this.constructor (VM 탈출 시도)
   *
   * @param code 검증할 JavaScript 코드
   * @returns 검증 결과 (valid: boolean, error?: string, code?: ErrorCode)
   */
  private validateCode(code: string): ValidationResult {
    // ──────────────────────────────────────
    // 1️⃣ 기본 타입 검증
    // ──────────────────────────────────────
    // ✅ 코드가 문자열인지 확인
    if (!code || typeof code !== 'string') {
      return {
        valid: false,
        error: '유효하지 않은 코드입니다.',
        code: SimulationErrorCode.DANGEROUS_CODE,
      };
    }

    // ──────────────────────────────────────
    // 2️⃣ 코드 길이 검증 (문자 수)
    // ──────────────────────────────────────
    // 💡 서비스 거부 공격 방지 (10000자 제한)
    if (code.length > MAX_CODE_LENGTH) {
      return {
        valid: false,
        error: `코드가 너무 깁니다. 최대 ${MAX_CODE_LENGTH}자까지 허용됩니다.`,
        code: SimulationErrorCode.CODE_TOO_LONG,
      };
    }

    // ──────────────────────────────────────
    // 3️⃣ 라인 수 검증
    // ──────────────────────────────────────
    // 💡 서비스 거부 공격 방지 (500줄 제한)
    const lineCount = code.split('\n').length;
    if (lineCount > MAX_LINES) {
      return {
        valid: false,
        error: `코드가 너무 깁니다. 최대 ${MAX_LINES}줄까지 허용됩니다.`,
        code: SimulationErrorCode.CODE_TOO_LONG,
      };
    }

    // ──────────────────────────────────────
    // 4️⃣ 위험 패턴 검증
    // ──────────────────────────────────────
    // 🔍 DANGEROUS_PATTERNS 배열의 모든 패턴 검사
    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        return {
          valid: false,
          error: `보안상 허용되지 않는 코드입니다: ${reason}`,
          code: SimulationErrorCode.DANGEROUS_CODE,
        };
      }
    }

    // ──────────────────────────────────────
    // 5️⃣ 구문 검증 (파싱 가능한지)
    // ──────────────────────────────────────
    // 💡 new Function()으로 구문만 검증 (실행하지 않음)
    //    파싱 실패 시 SyntaxError throw → catch
    try {
      new Function(code);
    } catch (e: unknown) {
      const err = e as Error;
      return {
        valid: false,
        error: `구문 오류: ${err.message}`,
        code: SimulationErrorCode.SYNTAX_ERROR,
      };
    }

    // ✅ 모든 검증 통과
    return { valid: true };
  }

  /**
   * 🔄 스냅샷 후처리 (유효성 검증 + 포맷 정규화)
   *
   * 📝 처리 내용:
   *   1️⃣ 유효하지 않은 라인 번호 필터링
   *      - line < 1 → 제거 (실행 전 상태)
   *      - line > maxLine → 제거 (범위 초과)
   *   2️⃣ ERROR 이벤트 스냅샷 제거
   *      - 에러는 catch 블록에서 이미 처리됨
   *   3️⃣ methodName 정규화
   *      - main → __main__ (Python/Java 호환)
   *   4️⃣ 소스 코드 라인 추가
   *      - code 필드 = sourceCode.split('\n')[line - 1]
   *
   * 💡 목적:
   *   - Python/Java 시뮬레이터와 동일한 포맷
   *   - 프론트엔드가 일관된 방식으로 처리 가능
   *
   * @param snapshots 디버거에서 수집한 원본 스냅샷
   * @param sourceCode 사용자가 입력한 원본 코드
   * @returns 처리된 스냅샷 배열 (정규화됨)
   */
  private processSnapshots(
    snapshots: JavaScriptSnapshot[],
    sourceCode: string
  ): JavaScriptSnapshot[] {
    // 📝 소스 코드를 라인별로 분리
    const lines = sourceCode.split('\n');
    const maxLine = lines.length;

    return snapshots
      // ❌ 유효하지 않은 스냅샷 제거
      .filter((snapshot) => {
        // 라인 번호 범위 검증
        // - line < 1: 실행 전 상태 (초기화)
        // - line > maxLine: 범위 초과 (에러 상태)
        if (snapshot.line < 1 || snapshot.line > maxLine) {
          return false;
        }

        // ERROR 이벤트 제거
        // 💡 에러는 catch 블록에서 이미 처리되므로 중복 제거
        if (snapshot.event === 'ERROR') {
          return false;
        }

        return true;
      })
      // ✅ 스냅샷 정규화 및 코드 추가
      .map((snapshot, index) => {
        // 🔄 methodName 정규화 (Python/Java 호환)
        // 💡 main → __main__ (통일된 최상위 함수명)
        const normalizedStack = snapshot.stack.map((frame) => ({
          ...frame,
          methodName: frame.methodName === 'main' ? '__main__' : frame.methodName,
        }));

        return {
          ...snapshot,
          stack: normalizedStack,
          // 💡 프론트엔드가 line 번호만으로 코드 표시 가능
          //    trim()으로 앞뒤 공백 제거
          code: lines[snapshot.line - 1]?.trim() || '',
        };
      });
  }
}
