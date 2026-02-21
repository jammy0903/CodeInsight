/**
 * C++ 시뮬레이션 서비스
 *
 * 4단계 파이프라인:
 *   1. Security  → 보안 검증
 *   2. Setup     → 임시 디렉토리 + main.cpp 생성
 *   3. Compile   → g++ -std=c++20 -g -O0
 *   4. Debug     → GDB/MI step-by-step 스냅샷 수집
 *   5. Normalize → 이벤트 정규화
 *   6. Cleanup   → 임시 디렉토리 삭제
 *
 * Java SimulationService 패턴을 따름 (stateless per-request)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CppFileManager } from './engine/file-manager';
import { CppCompiler } from './engine/compiler';
import { GdbClient } from './engine/gdb-client';
import { checkCodeSecurity } from './engine/security';
import { normalizeAllSnapshots } from './normalizer/cpp-snapshot-normalizer';

export class CppSimulationService {
  private fileManager: CppFileManager;
  private compiler: CppCompiler;
  private gdbClient: GdbClient;

  constructor() {
    this.fileManager = new CppFileManager();
    this.compiler = new CppCompiler();
    this.gdbClient = new GdbClient();
  }

  async simulate(sourceCode: string) {
    let projectPath: string | null = null;

    try {
      // 1. Security: 보안 검증
      const security = checkCodeSecurity(sourceCode);
      if (!security.safe) {
        return {
          success: false,
          error: `Security Error: ${security.reason}`,
        };
      }

      // 2. Setup: 임시 프로젝트 생성
      const project = await this.fileManager.createProject(sourceCode);
      projectPath = project.projectPath;
      const lineOffset = project.lineOffset;

      // 3. Compile: g++ 컴파일
      await this.compiler.compile(projectPath);

      // 4. Debug: GDB/MI 디버깅
      // 소스 코드를 라인별로 분리 (스냅샷에 코드 텍스트 포함용)
      const sourceFile = path.join(projectPath, 'main.cpp');
      const compiledSource = await fs.readFile(sourceFile, 'utf-8');
      const compiledLines = compiledSource.split('\n');

      const snapshots = await this.gdbClient.run(projectPath, compiledLines);

      // 5. Post-process: 라인 번호 보정 + 빈 줄 필터
      const userSourceLines = sourceCode.split('\n');

      const adjustedSnapshots = snapshots
        .filter(snapshot => {
          const adjustedLine = snapshot.line - lineOffset;
          return adjustedLine >= 1;
        })
        .map(snapshot => ({
          ...snapshot,
          line: snapshot.line - lineOffset,
          code: userSourceLines[(snapshot.line - lineOffset) - 1]?.trim() || snapshot.code,
        }))
        .filter(snapshot => {
          const lineContent = userSourceLines[snapshot.line - 1] || '';
          return lineContent.trim() !== '';
        });

      // 6. Normalize: 이벤트 정규화
      const normalizedSnapshots = normalizeAllSnapshots(adjustedSnapshots);

      return {
        success: true,
        steps: normalizedSnapshots,
        source_lines: userSourceLines,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      // Cleanup
      if (projectPath) {
        await this.fileManager.cleanup(projectPath);
      }
    }
  }
}
