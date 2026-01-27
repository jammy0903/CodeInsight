import { JavaScriptFileManager } from './engine/file-manager';
import {
  JavaScriptDebuggerClient,
  JavaScriptSnapshot,
} from './engine/debugger-client';

// ============================================
// 에러 코드 정의
// ============================================

export enum SimulationErrorCode {
  CODE_TOO_LONG = 'CODE_TOO_LONG',
  DANGEROUS_CODE = 'DANGEROUS_CODE',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  TIMEOUT = 'TIMEOUT',
  MAX_STEPS_EXCEEDED = 'MAX_STEPS_EXCEEDED',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
}

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

// ============================================
// 타입 정의
// ============================================

export interface JavaScriptSimulationResult {
  success: boolean;
  steps?: JavaScriptSnapshot[];
  error?: {
    code: SimulationErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: SimulationErrorCode;
}

// ============================================
// 상수
// ============================================

const MAX_CODE_LENGTH = 10000;
const MAX_LINES = 500;

// 위험한 패턴 (정규식)
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // 파일 시스템
  { pattern: /\brequire\s*\(\s*['"]fs['"]\s*\)/, reason: '파일 시스템 접근' },
  { pattern: /\brequire\s*\(\s*['"]path['"]\s*\)/, reason: '파일 경로 접근' },

  // 프로세스/자식 프로세스
  { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, reason: '프로세스 실행' },
  { pattern: /\bprocess\.exit\s*\(/, reason: '프로세스 종료' },
  { pattern: /\bprocess\.env\b/, reason: '환경 변수 접근' },
  { pattern: /\bprocess\.kill\s*\(/, reason: '프로세스 종료' },

  // 네트워크
  { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/, reason: '네트워크 접근' },
  { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/, reason: 'HTTP 접근' },
  { pattern: /\brequire\s*\(\s*['"]https['"]\s*\)/, reason: 'HTTPS 접근' },
  { pattern: /\brequire\s*\(\s*['"]dgram['"]\s*\)/, reason: 'UDP 접근' },
  { pattern: /\bfetch\s*\(/, reason: '네트워크 요청' },

  // 동적 코드 실행
  { pattern: /\beval\s*\(/, reason: '동적 코드 실행' },
  { pattern: /\bnew\s+Function\s*\(/, reason: '동적 함수 생성' },
  { pattern: /\bimport\s*\(/, reason: '동적 임포트' },

  // 글로벌/내부 변수
  { pattern: /\bglobal\b/, reason: '글로벌 객체 접근' },
  { pattern: /\b__dirname\b/, reason: '디렉토리 경로 접근' },
  { pattern: /\b__filename\b/, reason: '파일 경로 접근' },

  // 위험한 require
  { pattern: /\brequire\s*\(\s*[^'"]+\)/, reason: '동적 require' },

  // VM 탈출 시도
  { pattern: /\bthis\.constructor\b/, reason: 'VM 탈출 시도' },
  { pattern: /\bObject\.getPrototypeOf\s*\(/, reason: '프로토타입 접근' },
];

// ============================================
// 서비스 클래스
// ============================================

export class JavaScriptSimulationService {
  private fileManager: JavaScriptFileManager;
  private debuggerClient: JavaScriptDebuggerClient;

  constructor() {
    this.fileManager = new JavaScriptFileManager();
    this.debuggerClient = new JavaScriptDebuggerClient();
  }

  /**
   * JavaScript 코드 시뮬레이션 실행
   *
   * 4단계 파이프라인:
   * 1. validateCode - 보안 검증
   * 2. createProject - 임시 파일 생성
   * 3. runDebugger - 디버거 실행
   * 4. processSnapshots - 스냅샷 후처리
   */
  public async simulate(sourceCode: string): Promise<JavaScriptSimulationResult> {
    let projectPath: string | null = null;

    try {
      // 1. 코드 검증 (보안 + 구문)
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

      // 2. 임시 프로젝트 생성
      projectPath = await this.fileManager.createProject(sourceCode);

      // 3. 디버거 실행 및 스냅샷 수집
      const snapshots = await this.debuggerClient.run(projectPath);

      // 4. 스냅샷 후처리 (유효성 검증 + 코드 추가)
      const processedSnapshots = this.processSnapshots(snapshots, sourceCode);

      return {
        success: true,
        steps: processedSnapshots,
      };

    } catch (error: unknown) {
      const err = error as Error;

      // 타임아웃 에러 감지
      if (err.message?.includes('Time Limit') || err.message?.includes('timeout')) {
        return {
          success: false,
          error: {
            code: SimulationErrorCode.TIMEOUT,
            message: '실행 시간이 초과되었습니다. 무한 루프가 있는지 확인해주세요.',
          },
        };
      }

      // 구문 에러 감지
      if (err.message?.includes('Syntax') || err.message?.includes('parse')) {
        return {
          success: false,
          error: {
            code: SimulationErrorCode.SYNTAX_ERROR,
            message: err.message,
          },
        };
      }

      // 런타임 에러
      return {
        success: false,
        error: {
          code: SimulationErrorCode.RUNTIME_ERROR,
          message: err.message || '알 수 없는 오류가 발생했습니다.',
        },
      };

    } finally {
      // 5. 정리 (임시 파일 삭제)
      if (projectPath) {
        await this.fileManager.cleanup(projectPath);
      }
    }
  }

  /**
   * 코드 검증 (보안 + 구문 + 길이)
   */
  private validateCode(code: string): ValidationResult {
    // 1. 기본 타입 검증
    if (!code || typeof code !== 'string') {
      return {
        valid: false,
        error: '유효하지 않은 코드입니다.',
        code: SimulationErrorCode.DANGEROUS_CODE,
      };
    }

    // 2. 코드 길이 검증
    if (code.length > MAX_CODE_LENGTH) {
      return {
        valid: false,
        error: `코드가 너무 깁니다. 최대 ${MAX_CODE_LENGTH}자까지 허용됩니다.`,
        code: SimulationErrorCode.CODE_TOO_LONG,
      };
    }

    // 3. 라인 수 검증
    const lineCount = code.split('\n').length;
    if (lineCount > MAX_LINES) {
      return {
        valid: false,
        error: `코드가 너무 깁니다. 최대 ${MAX_LINES}줄까지 허용됩니다.`,
        code: SimulationErrorCode.CODE_TOO_LONG,
      };
    }

    // 4. 위험 패턴 검증
    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        return {
          valid: false,
          error: `보안상 허용되지 않는 코드입니다: ${reason}`,
          code: SimulationErrorCode.DANGEROUS_CODE,
        };
      }
    }

    // 5. 구문 검증 (파싱 가능한지)
    try {
      // new Function으로 구문만 검증 (실행하지 않음)
      new Function(code);
    } catch (e: unknown) {
      const err = e as Error;
      return {
        valid: false,
        error: `구문 오류: ${err.message}`,
        code: SimulationErrorCode.SYNTAX_ERROR,
      };
    }

    return { valid: true };
  }

  /**
   * 스냅샷 후처리
   * - 유효하지 않은 라인 번호 필터링
   * - 소스 코드 라인 추가
   * - Python/Java 호환 포맷 보장
   */
  private processSnapshots(
    snapshots: JavaScriptSnapshot[],
    sourceCode: string
  ): JavaScriptSnapshot[] {
    const lines = sourceCode.split('\n');
    const maxLine = lines.length;

    return snapshots
      .filter((snapshot) => {
        // 유효하지 않은 라인 번호 필터링
        if (snapshot.line < 1 || snapshot.line > maxLine) {
          return false;
        }
        // ERROR 이벤트 제외 (이미 에러 처리됨)
        if (snapshot.event === 'ERROR') {
          return false;
        }
        return true;
      })
      .map((snapshot, index) => {
        // methodName 정규화 (Python/Java와 동일하게)
        const normalizedStack = snapshot.stack.map((frame) => ({
          ...frame,
          methodName: frame.methodName === 'main' ? '__main__' : frame.methodName,
        }));

        return {
          ...snapshot,
          stack: normalizedStack,
          // 소스 코드 라인 추가
          code: lines[snapshot.line - 1]?.trim() || '',
        };
      });
  }
}
