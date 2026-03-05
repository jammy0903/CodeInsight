/**
 * C Simulation Service — GDB-based
 *
 * 6-step pipeline:
 *   1. Security  → checkCodeSecurity (forbidden patterns)
 *   2. Setup     → tmp dir + main.c + stdout/stdin redirect
 *   3. Compile   → gcc -std=c11 -g -O0
 *   4. Debug     → GDB/MI step-by-step snapshot collection
 *   5. Normalize → event generation (frame/variable/output diffs)
 *   6. Cleanup   → rm -rf tmp dir
 *
 * Replaces the regex-based simulator for /trace endpoint.
 * /simulate and /judge endpoints remain unchanged (use cExecutor).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { CFileManager } from './engine/c-file-manager';
import { CCompiler } from './engine/c-compiler';
import { CGdbClient } from './engine/c-gdb-client';
import { checkCodeSecurity } from './executor/security';
import { normalizeAllSnapshots } from '../shared/gdb';

export class CSimulationService {
  private fileManager = new CFileManager();
  private compiler = new CCompiler();
  private gdbClient = new CGdbClient();

  async simulate(sourceCode: string, stdin?: string) {
    let projectPath: string | null = null;

    try {
      // 1. Security: forbidden pattern check
      const security = checkCodeSecurity(sourceCode);
      if (!security.safe) {
        return {
          success: false,
          error: `Security Error: ${security.reason}`,
        };
      }

      // 2. Setup: create temp project with source + redirect injection
      const project = await this.fileManager.createProject(sourceCode, stdin);
      projectPath = project.projectPath;
      const lineOffset = project.lineOffset;
      const redirectLineCount = project.redirectLineCount;

      // 3. Compile: gcc
      await this.compiler.compile(projectPath);

      // 4. Debug: GDB/MI step-by-step
      const sourceFile = path.join(projectPath, 'main.c');
      const compiledSource = await fs.readFile(sourceFile, 'utf-8');
      const compiledLines = compiledSource.split('\n');

      const snapshots = await this.gdbClient.run(projectPath, compiledLines, redirectLineCount);

      // 5. Post-process: adjust line numbers + filter empty lines
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

      // 6. Normalize: generate events
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
      if (projectPath) {
        await this.fileManager.cleanup(projectPath);
      }
    }
  }
}
