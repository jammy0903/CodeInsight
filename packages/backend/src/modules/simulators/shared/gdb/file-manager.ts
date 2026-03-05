/**
 * Shared GDB File Manager
 *
 * Creates temporary project directories with stdout/stdin redirect injection
 * for GDB-based simulators. Used by both C and C++.
 *
 * stdout capture: freopen("_stdout.txt", "w", stdout) injected at main() start
 * stdin support: freopen("input.txt", "r", stdin) injected when stdin provided
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const STDOUT_REDIRECT = `freopen("_stdout.txt", "w", stdout); setbuf(stdout, 0);`;

// ============================================
// Configuration
// ============================================

export interface SharedFileManagerConfig {
  language: string;           // 'c' or 'cpp' — used for tmp directory name
  sourceFileName: string;     // 'main.c' or 'main.cpp'
  defaultIncludes: string[];  // includes added when wrapping code without main()
  stdioHeader: string;        // '<cstdio>' or '<stdio.h>' — for freopen support
}

// ============================================
// File Manager
// ============================================

export class SharedFileManager {
  private readonly baseDir: string;
  private readonly config: SharedFileManagerConfig;

  constructor(config: SharedFileManagerConfig) {
    this.config = config;
    this.baseDir = path.resolve(process.cwd(), 'tmp', config.language);
    fs.mkdir(this.baseDir, { recursive: true }).catch(() => {});
  }

  /**
   * Create a temporary project directory with source file and stdout redirect.
   *
   * @param code - User source code
   * @param stdin - Optional stdin content (writes input.txt + freopen redirect)
   * @returns projectPath and lineOffset for adjusting GDB line numbers
   */
  async createProject(
    code: string,
    stdin?: string,
  ): Promise<{ projectPath: string; lineOffset: number; redirectLineCount: number }> {
    const projectId = crypto.randomUUID();
    const projectPath = path.join(this.baseDir, projectId);
    await fs.mkdir(projectPath, { recursive: true });

    // Build redirect code (stdout + optional stdin)
    let redirectCode = STDOUT_REDIRECT;
    let redirectLineCount = 1;

    if (stdin) {
      await fs.writeFile(path.join(projectPath, 'input.txt'), stdin, 'utf-8');
      redirectCode += `\nfreopen("input.txt", "r", stdin);`;
      redirectLineCount = 2;
    }

    let finalCode: string;
    let lineOffset: number;

    const hasMain = /\b(int|void)\s+main\s*\(/.test(code);

    if (!hasMain) {
      // No main(): wrap user code with includes + main() + redirect
      const lines = code.split('\n');
      const includes = lines.filter(l => l.trim().startsWith('#include'));
      const bodyLines = lines.filter(l => !l.trim().startsWith('#include'));

      const defaultIncludesStr = this.config.defaultIncludes
        .map(h => `#include ${h}`)
        .join('\n');

      finalCode = `${includes.join('\n')}
${defaultIncludesStr}

int main() {
${redirectCode}
${bodyLines.join('\n')}
    return 0;
}
`;
      // includes + default includes + blank line + "int main() {" + redirect lines
      lineOffset = includes.length + this.config.defaultIncludes.length + 2 + redirectLineCount;
    } else {
      // main() exists: inject redirect after main() {
      // Ensure stdio header is included (needed for freopen)
      const headerEscaped = this.config.stdioHeader
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/</, '<\\s*')
        .replace(/>/, '\\s*>');
      const hasStdioInclude = new RegExp(`#\\s*include\\s*${headerEscaped}`).test(code);
      const stdioInclude = hasStdioInclude ? '' : `#include ${this.config.stdioHeader}\n`;
      const addedLines = hasStdioInclude ? 0 : 1;

      // Find main() { and inject redirect after the opening brace
      const mainMatch = code.match(/\b(int|void)\s+main\s*\([^)]*\)\s*\{/);
      if (mainMatch && mainMatch.index !== undefined) {
        const insertPos = mainMatch.index + mainMatch[0].length;
        finalCode = stdioInclude + code.slice(0, insertPos) + '\n' + redirectCode + '\n' + code.slice(insertPos);
        // addedLines (0 or 1) + redirect lines + 1 (extra \n before redirect)
        lineOffset = addedLines + redirectLineCount + 1;
      } else {
        // Fallback: couldn't find main() brace — just prepend stdio
        finalCode = stdioInclude + code;
        lineOffset = addedLines;
      }
    }

    await fs.writeFile(path.join(projectPath, this.config.sourceFileName), finalCode, 'utf-8');
    await fs.writeFile(path.join(projectPath, '_stdout.txt'), '', 'utf-8');

    return { projectPath, lineOffset, redirectLineCount };
  }

  async cleanup(projectPath: string): Promise<void> {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup ${this.config.language} project ${projectPath}:`, error);
    }
  }
}
