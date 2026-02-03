/**
 * 📚 교육용 Rust 시뮬레이터 v1
 *
 * 🏗️ 아키텍처:
 *   - RustFileManager: 임시 Cargo 프로젝트 생성/삭제
 *   - RustExecutor: cargo run으로 컴파일 및 실행
 *
 * 🔄 3단계 파이프라인:
 *   1️⃣ Validate → 위험 코드 검증
 *   2️⃣ Setup    → 임시 디렉토리에 Cargo 프로젝트 생성
 *   3️⃣ Execute  → cargo run 실행 + stdout 캡처
 *   4️⃣ Cleanup  → 임시 파일/디렉토리 삭제
 *
 * ⚡ 에러 처리 원칙:
 *   - 재시도 없이 즉시 에러 반환 (빠른 실패)
 *   - 컴파일 에러도 사용자에게 반환
 *   - 실행 타임아웃: 30초
 *
 * 🛡️ 보안 정책:
 *   - std::process, std::fs::write 차단
 *   - unsafe 코드 차단 (선택)
 *
 * 📦 의존성:
 *   - Rust 1.70+ (rustc, cargo)
 */

import { RustFileManager } from './engine/file-manager';
import { RustExecutor } from './engine/executor';

/**
 * Rust 시뮬레이션 결과 타입
 */
export interface RustSimulationResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
}

/**
 * Rust 시뮬레이션 서비스 메인 클래스
 *
 * 🎯 역할:
 *   - 사용자 코드 보안 검증
 *   - Rust 코드 컴파일 및 실행
 *   - stdout/stderr 캡처
 *
 * 💡 설계 의도:
 *   - Python과 달리 컴파일 언어 (cargo build 필요)
 *   - 각 요청마다 새 인스턴스 생성 (stateless)
 *   - 멀티 유저 동시 시뮬레이션 안전
 */
export class RustSimulationService {
  private fileManager: RustFileManager;
  private executor: RustExecutor;

  constructor() {
    this.fileManager = new RustFileManager();
    this.executor = new RustExecutor();
  }

  /**
   * 🚀 Rust 코드 시뮬레이션 실행 (메인 엔트리포인트)
   *
   * @param sourceCode 실행할 Rust 소스 코드
   * @returns 성공 여부 + stdout/stderr 또는 에러 메시지
   */
  public async simulate(sourceCode: string): Promise<RustSimulationResult> {
    let projectPath: string | null = null;

    try {
      // ═══════════════════════════════════════════════════════
      // 1️⃣ Validate: 보안 검증
      // ═══════════════════════════════════════════════════════
      this.validateCode(sourceCode);

      // ═══════════════════════════════════════════════════════
      // 2️⃣ Setup: 임시 Cargo 프로젝트 생성
      // ═══════════════════════════════════════════════════════
      projectPath = await this.fileManager.createProject(sourceCode);

      // ═══════════════════════════════════════════════════════
      // 3️⃣ Execute: cargo run 실행
      // ═══════════════════════════════════════════════════════
      const result = await this.executor.execute(projectPath);

      if (!result.success) {
        // 컴파일 에러 또는 런타임 에러
        return {
          success: false,
          stderr: result.stderr,
          error: result.stderr || 'Compilation or runtime error',
        };
      }

      // 🎉 성공 반환
      return {
        success: true,
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } catch (error: any) {
      // 🚨 에러 처리
      return {
        success: false,
        error: error.message,
      };
    } finally {
      // ═══════════════════════════════════════════════════════
      // 4️⃣ Cleanup: 임시 파일 정리
      // ═══════════════════════════════════════════════════════
      if (projectPath) {
        await this.fileManager.cleanup(projectPath);
      }
    }
  }

  /**
   * 🛡️ 코드 보안 검증
   *
   * 📝 검증 항목:
   *   - 위험한 std::process 차단
   *   - 파일 쓰기 차단 (std::fs::write)
   *   - unsafe 코드 차단 (선택)
   *
   * @param code 검증할 Rust 코드
   * @throws Error 위험 패턴 발견 시
   */
  private validateCode(code: string): void {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid source code');
    }

    // 위험 패턴 목록
    const dangerousPatterns = [
      /std::process::Command/,           // 프로세스 실행
      /std::fs::write/,                  // 파일 쓰기
      /std::fs::remove/,                 // 파일 삭제
      /std::fs::create_dir/,             // 디렉토리 생성
      // unsafe 차단은 선택적 (소유권 교육 시 필요할 수 있음)
      // /unsafe\s*\{/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(
          'Code contains potentially dangerous operations that are not allowed'
        );
      }
    }
  }
}
