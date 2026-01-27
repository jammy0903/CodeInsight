/**
 * Ollama Provider (Local LLM)
 * Qwen2.5-Coder 등 로컬 모델 사용
 * 스트리밍 지원
 */

import { IAIProvider, ChatRequest, ChatResponse, ProviderType, StreamCallback } from './types';
import { env } from '../../../config/env';

export class OllamaProvider implements IAIProvider {
  readonly type: ProviderType = 'ollama';
  readonly name = 'Ollama (Local)';

  private readonly url: string;
  private readonly model: string;

  constructor() {
    this.url = env.OLLAMA_URL || 'http://localhost:5044';
    this.model = env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 🐛 Workaround: Ollama Qwen 버그 - system prompt를 user message에 포함
    // https://github.com/ollama/ollama/issues/6873
    const systemPromptPrefix = request.systemPrompt
      ? `[규칙]\n${request.systemPrompt}\n\n[질문]\n`
      : '';

    const messages = [
      ...(request.history || []).slice(-6),
      { role: 'user', content: `${systemPromptPrefix}${request.message}` },
    ];

    const response = await fetch(`${this.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: 0.2,        // 더 낮춤
          num_predict: 80,         // 대폭 줄임: 3문장 = 60-80 토큰
          top_p: 0.85,
          stop: ['\n\n\n', '\n\n', '```', '---', '###', '\n4.', '\n4)'],  // 강력한 중단
          repeat_penalty: 1.3,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as {
      message?: { content?: string };
      model?: string;
      eval_count?: number;
      prompt_eval_count?: number;
    };

    return {
      content: data.message?.content || 'No response',
      provider: this.type,
      model: data.model || this.model,
      usage: data.eval_count ? {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count,
        totalTokens: (data.prompt_eval_count || 0) + data.eval_count,
      } : undefined,
    };
  }

  /**
   * 스트리밍 채팅
   * Ollama API는 기본적으로 stream: true 지원
   */
  async streamChat(request: ChatRequest, onChunk: StreamCallback): Promise<void> {
    // 🐛 Workaround: Ollama Qwen 버그 - system prompt를 user message에 포함
    const systemPromptPrefix = request.systemPrompt
      ? `[규칙]\n${request.systemPrompt}\n\n[질문]\n`
      : '';

    const messages = [
      ...(request.history || []).slice(-6),
      { role: 'user', content: `${systemPromptPrefix}${request.message}` },
    ];

    // 최대 2번 재시도
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const controller = new AbortController();
      // Ollama 모델 로딩 + 첫 응답까지 최대 90초 허용 (1.5B 모델 로딩 시간 고려)
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        const response = await fetch(`${this.url}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: this.model,
            messages,
            stream: true,
            options: {
              temperature: 0.2,        // 더 낮춤
              num_predict: 80,         // 대폭 줄임: 3문장 = 60-80 토큰
              top_p: 0.85,
              stop: ['\n\n\n', '\n\n', '```', '---', '###', '\n4.', '\n4)'],  // 강력한 중단
              repeat_penalty: 1.3,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Ollama error (${response.status}): ${await response.text()}`);
        }

        if (!response.body) {
          throw new Error('No response body for streaming');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              onChunk({ content: '', done: true });
              return;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              try {
                const json = JSON.parse(trimmed);
                const content = json.message?.content || '';
                if (content) {
                  onChunk({ content, done: false });
                }

                if (json.done) {
                  onChunk({ content: '', done: true });
                  return;
                }
              } catch {
                // JSON 파싱 실패 무시
              }
            }
          }
        } finally {
          reader.releaseLock();
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = error as Error;
        clearTimeout(timeoutId);

        // 마지막 시도에서 실패하면 gracefully 종료
        if (attempt === maxRetries - 1) {
          onChunk({
            content: '(AI 설명을 불러올 수 없습니다. Ollama 서버를 확인해주세요.)',
            done: true,
          });
          return;
        }

        // 재시도 전 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
}
