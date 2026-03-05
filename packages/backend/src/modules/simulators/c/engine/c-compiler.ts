/**
 * C Compiler
 *
 * gcc -std=c11 -g -O0 -fno-omit-frame-pointer for debug builds.
 * -lm included for math.h support.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { cSafeEnv } from '../../safe-env';

const execAsync = promisify(exec);

export class CCompiler {
  async compile(projectPath: string): Promise<void> {
    const sourceFile = path.join(projectPath, 'main.c');
    const outputFile = path.join(projectPath, 'a.out');

    const command = `gcc -std=c11 -g -O0 -fno-omit-frame-pointer -o "${outputFile}" "${sourceFile}" -lm 2>&1`;

    try {
      await execAsync(command, { timeout: 30_000, env: cSafeEnv() });
    } catch (error: any) {
      const errorOutput = error.stdout || error.stderr || error.message;
      throw new Error(`Compilation Error:\n${errorOutput}`);
    }
  }
}
