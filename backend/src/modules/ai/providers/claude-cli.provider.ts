/**
 * Claude Code CLI Provider
 * 로컬 Claude Code CLI를 통해 AI 응답 생성
 */

import { spawn, execSync } from 'child_process';
import { IAIProvider, ChatRequest, ChatResponse, ProviderType } from './types';

// Claude CLI 경로 (동적으로 찾기)
function getClaudePath(): string {
  try {
    return execSync('which claude', { encoding: 'utf8' }).trim();
  } catch {
    return 'claude'; // fallback
  }
}

const CLAUDE_PATH = getClaudePath();

export class ClaudeCliProvider implements IAIProvider {
  readonly type: ProviderType = 'claude-cli';
  readonly name = 'Claude Code (CLI)';

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn(CLAUDE_PATH, ['--version'], {
        shell: false,
      });

      proc.on('close', (code) => {
        resolve(code === 0);
      });

      proc.on('error', () => {
        resolve(false);
      });
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const prompt = this.buildPrompt(request);

    return new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';

      // 전체 경로 사용
      const proc = spawn(CLAUDE_PATH, [
        '-p', prompt,
        '--output-format', 'text',
      ], {
        shell: false,
        env: {
          ...process.env,
          NO_COLOR: '1',
          FORCE_COLOR: '0',
        },
      });

      // 타임아웃 설정 (2분)
      const timeout = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('Claude CLI timeout (2min)'));
      }, 120000);

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timeout);

        if (code !== 0 && code !== null) {
          reject(new Error(`Claude CLI exited with code ${code}: ${errorOutput}`));
          return;
        }

        // 출력 정리 (ANSI 코드 제거)
        const cleanOutput = this.cleanOutput(output);

        resolve({
          content: cleanOutput || 'No response',
          provider: this.type,
          model: 'claude-code-cli',
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Claude CLI error: ${err.message}`));
      });
    });
  }

  private buildPrompt(request: ChatRequest): string {
    const parts: string[] = [];

    // 시스템 프롬프트
    if (request.systemPrompt) {
      parts.push(`[System]\n${request.systemPrompt}\n`);
    }

    // 대화 히스토리 (최근 4개만)
    const history = (request.history || []).slice(-4);
    for (const msg of history) {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      parts.push(`[${role}]\n${msg.content}\n`);
    }

    // 현재 메시지
    parts.push(`[User]\n${request.message}\n`);
    parts.push(`[Assistant]\n`);

    return parts.join('\n');
  }

  private cleanOutput(output: string): string {
    return output
      // ANSI escape codes 제거
      .replace(/\x1b\[[0-9;]*m/g, '')
      // 기타 제어 문자 제거
      .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
      // 앞뒤 공백 정리
      .trim();
  }
}
