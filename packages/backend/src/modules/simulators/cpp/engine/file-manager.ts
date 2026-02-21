/**
 * C++ 시뮬레이터 파일 관리자
 *
 * 임시 디렉토리에 main.cpp 생성/삭제
 * Java FileManager 패턴을 따름
 *
 * stdout 캡처: main() 첫 줄에 freopen("_stdout.txt", "w", stdout) 주입
 * → GDB에서 프로그램 출력을 파일로 읽어 각 스냅샷에 포함
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// main() 시작에 주입할 stdout redirect 코드 (2줄)
const STDOUT_REDIRECT = `freopen("_stdout.txt", "w", stdout); setbuf(stdout, 0);`;
const REDIRECT_LINE_COUNT = 1; // 위 코드는 한 줄에 주입

export class CppFileManager {
  private readonly BASE_DIR = path.resolve(process.cwd(), 'tmp', 'cpp');

  constructor() {
    fs.mkdir(this.BASE_DIR, { recursive: true }).catch(() => {});
  }

  /**
   * 사용자 코드를 위한 임시 프로젝트 폴더 생성 + main.cpp 저장
   *
   * lineOffset: 주입된 코드 줄 수 (사용자 코드 라인 → 컴파일된 코드 라인 변환용)
   */
  async createProject(code: string): Promise<{ projectPath: string; lineOffset: number }> {
    const projectId = crypto.randomUUID();
    const projectPath = path.join(this.BASE_DIR, projectId);
    await fs.mkdir(projectPath, { recursive: true });

    let finalCode: string;
    let lineOffset: number;

    const hasMain = /\b(int|void)\s+main\s*\(/.test(code);

    if (!hasMain) {
      // main() 없는 경우: 래핑 + stdout redirect 주입
      const lines = code.split('\n');
      const includes = lines.filter(l => l.trim().startsWith('#include'));
      const bodyLines = lines.filter(l => !l.trim().startsWith('#include'));

      finalCode = `${includes.join('\n')}
#include <iostream>
#include <string>
#include <vector>
#include <memory>
#include <cstdio>

int main() {
${STDOUT_REDIRECT}
${bodyLines.join('\n')}
    return 0;
}
`;
      // includes + 6 header lines + 1 redirect line
      lineOffset = includes.length + 7 + REDIRECT_LINE_COUNT;
    } else {
      // main() 있는 경우: main() 의 { 바로 뒤에 redirect 주입
      // #include <cstdio> 추가 (freopen 용)
      const hasStdio = /#\s*include\s*<\s*cstdio\s*>/.test(code);
      const stdioInclude = hasStdio ? '' : '#include <cstdio>\n';
      const addedLines = hasStdio ? 0 : 1;

      // main() { 바로 뒤에 redirect 코드 삽입
      const mainMatch = code.match(/\b(int|void)\s+main\s*\([^)]*\)\s*\{/);
      if (mainMatch && mainMatch.index !== undefined) {
        const insertPos = mainMatch.index + mainMatch[0].length;
        finalCode = stdioInclude + code.slice(0, insertPos) + '\n' + STDOUT_REDIRECT + '\n' + code.slice(insertPos);
        // addedLines = #include <cstdio> (1 line)
        // REDIRECT_LINE_COUNT = freopen line (1 line)
        // +1 for the extra \n before REDIRECT
        lineOffset = addedLines + REDIRECT_LINE_COUNT + 1;
      } else {
        // Fallback: 찾지 못한 경우 그대로
        finalCode = stdioInclude + code;
        lineOffset = addedLines;
      }
    }

    await fs.writeFile(path.join(projectPath, 'main.cpp'), finalCode, 'utf-8');
    // Create stdout file
    await fs.writeFile(path.join(projectPath, '_stdout.txt'), '', 'utf-8');

    return { projectPath, lineOffset };
  }

  async cleanup(projectPath: string): Promise<void> {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup C++ project ${projectPath}:`, error);
    }
  }
}
