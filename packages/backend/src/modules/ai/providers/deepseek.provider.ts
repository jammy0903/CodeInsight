/**
 * DeepSeek Provider
 * 클라우드 API (유료)
 * 스트리밍 지원 (SSE)
 */

import { IAIProvider, ChatRequest, ChatResponse, ProviderType, StreamCallback } from './types';
import { env } from '../../../config/env';

export class DeepSeekProvider implements IAIProvider {
  readonly type: ProviderType = 'deepseek';
  readonly name = 'DeepSeek (Cloud)';

  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = env.DEEPSEEK_API_KEY;
    this.baseUrl = env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      ...(request.history || []).slice(-6),
      { role: 'user', content: request.message },
    ];

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${error}`);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    return {
      content: data.choices?.[0]?.message?.content || 'No response',
      provider: this.type,
      model: data.model || 'deepseek-chat',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  /**
   * 스트리밍 채팅
   * DeepSeek API는 OpenAI 호환이므로 stream: true 지원
   */
  async streamChat(request: ChatRequest, onChunk: StreamCallback): Promise<void> {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      ...(request.history || []).slice(-6),
      { role: 'user', content: request.message },
    ];

    // 타임아웃 설정 (90초)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,  // 스트리밍 활성화
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${error}`);
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
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // SSE 파싱: "data: {...}\n\n" 형식
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) {
                  onChunk({ content, done: false });
                }
              } catch {
                // JSON 파싱 실패 무시
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
