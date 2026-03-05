/**
 * C File Manager — delegates to shared file manager
 *
 * Configures SharedFileManager with C defaults:
 *   - Source file: main.c
 *   - Default includes: stdio.h, stdlib.h, string.h
 *   - Stdio header: <stdio.h>
 *   - stdin support: freopen("input.txt", "r", stdin)
 */

import { SharedFileManager } from '../../shared/gdb';

export class CFileManager {
  private shared = new SharedFileManager({
    language: 'c',
    sourceFileName: 'main.c',
    defaultIncludes: ['<stdio.h>', '<stdlib.h>', '<string.h>'],
    stdioHeader: '<stdio.h>',
  });

  async createProject(
    code: string,
    stdin?: string,
  ): Promise<{ projectPath: string; lineOffset: number; redirectLineCount: number }> {
    return this.shared.createProject(code, stdin);
  }

  async cleanup(projectPath: string): Promise<void> {
    return this.shared.cleanup(projectPath);
  }
}
