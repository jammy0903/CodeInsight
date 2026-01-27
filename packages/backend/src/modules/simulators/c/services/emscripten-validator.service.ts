import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Emscripten 기반 C 코드 검증 서비스
 *
 * emcc -fsyntax-only를 사용하여 컴파일 없이 문법만 검증
 */
export class EmscriptenValidatorService {
  private readonly tempDir = '/tmp/c-simulator';
  private isEmscriptenAvailable: boolean | null = null;

  constructor() {
    this.ensureTempDir();
  }

  /**
   * 임시 디렉토리 생성
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Emscripten으로 C 코드 문법 검증
   * @param code C 소스 코드
   * @returns 검증 결과
   */
  async validate(code: string): Promise<ValidationResult> {
    // 1. 빈 코드 체크
    if (!code || code.trim().length === 0) {
      return {
        isValid: false,
        errors: ['코드가 비어있습니다. C 코드를 입력해주세요.'],
      };
    }

    // 2. Emscripten 설치 확인
    if (this.isEmscriptenAvailable === null) {
      this.isEmscriptenAvailable = await this.checkInstallation();
    }

    if (!this.isEmscriptenAvailable) {
      console.warn('Emscripten not available, skipping validation');
      return {
        isValid: true,
        warnings: ['Emscripten이 설치되지 않아 검증을 건너뜁니다.'],
      };
    }

    const sessionId = uuidv4();
    const tempFile = path.join(this.tempDir, `${sessionId}.c`);

    try {
      // 1. 임시 파일 작성
      await fs.writeFile(tempFile, code, 'utf-8');

      // 2. Emscripten 검증 (컴파일은 하지 않고 문법만)
      const { stdout, stderr } = await execAsync(
        `emcc -fsyntax-only -Wall -Wextra ${tempFile}`,
        {
          timeout: 5000, // 5초 타임아웃
          maxBuffer: 1024 * 1024, // 1MB
        }
      );

      // 3. 경고 파싱
      const warnings = this.parseWarnings(stderr);

      return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error: any) {
      // 4. 에러 파싱
      const errors = this.parseErrors(error.stderr || error.message);

      return {
        isValid: false,
        errors,
      };
    } finally {
      // 5. 임시 파일 정리
      try {
        await fs.unlink(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
    }
  }

  /**
   * Emscripten 에러 메시지 파싱
   *
   * 형식: "file.c:line:col: error: message"
   */
  private parseErrors(stderr: string): string[] {
    if (!stderr) return ['알 수 없는 에러가 발생했습니다.'];

    const errors: string[] = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      // 에러 메시지 형식: "file.c:line:col: error: message"
      const errorMatch = line.match(/:\d+:\d+:\s*error:\s*(.+)/);
      if (errorMatch) {
        errors.push(errorMatch[1].trim());
      }
    }

    // 에러가 파싱되지 않으면 전체 stderr 반환
    if (errors.length === 0) {
      // 첫 10줄만 반환 (너무 길면 자르기)
      const firstLines = lines.slice(0, 10).join('\n');
      return [firstLines || stderr];
    }

    return errors;
  }

  /**
   * Emscripten 경고 메시지 파싱
   *
   * 형식: "file.c:line:col: warning: message"
   */
  private parseWarnings(stderr: string): string[] {
    if (!stderr) return [];

    const warnings: string[] = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      const warningMatch = line.match(/:\d+:\d+:\s*warning:\s*(.+)/);
      if (warningMatch) {
        warnings.push(warningMatch[1].trim());
      }
    }

    return warnings;
  }

  /**
   * Emscripten 설치 확인
   */
  async checkInstallation(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('emcc --version', { timeout: 3000 });
      const version = stdout.split('\n')[0];
      console.log('Emscripten detected:', version);
      return true;
    } catch (error) {
      console.warn('Emscripten not found. Install with: ./scripts/install-emscripten.sh');
      return false;
    }
  }
}
