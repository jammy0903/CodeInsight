/**
 * C++ 컴파일러 래퍼
 *
 * g++ -std=c++20 -g -O0 -fno-omit-frame-pointer 로 디버그 빌드
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { cSafeEnv } from '../../safe-env';

const execAsync = promisify(exec);

export interface CompileResult {
  success: boolean;
  outputPath: string;
  errors?: string;
}

export class CppCompiler {
  /**
   * main.cpp를 컴파일하여 실행 파일 생성
   */
  async compile(projectPath: string): Promise<CompileResult> {
    const sourceFile = path.join(projectPath, 'main.cpp');
    const outputFile = path.join(projectPath, 'a.out');

    // -g: 디버그 심볼 포함 (GDB가 변수명/타입 접근용)
    // -O0: 최적화 끄기 (변수가 제거되지 않도록)
    // -fno-omit-frame-pointer: 스택 추적 정확성
    // -std=c++20: C++20 지원
    const command = `g++ -std=c++20 -g -O0 -fno-omit-frame-pointer -o "${outputFile}" "${sourceFile}" 2>&1`;

    try {
      await execAsync(command, { timeout: 30_000, env: cSafeEnv() });
      return { success: true, outputPath: outputFile };
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || error.message;
      throw new Error(`Compilation Error:\n${errorOutput}`);
    }
  }
}
