/**
 * Ollama Provider (Local LLM)
 * Qwen2.5-Coder 등 로컬 모델 사용
 */

import { IAIProvider, ChatRequest, ChatResponse, ProviderType } from './types';
import { env } from '../../../config/env';

export class OllamaProvider implements IAIProvider {
  readonly type: ProviderType = 'ollama';
  readonly name = 'Ollama (Local)';

  private readonly url: string;
  private readonly model: string;

  constructor() {
    this.url = env.OLLAMA_URL || 'http://localhost:11434';
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
    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      ...(request.history || []).slice(-6),
      { role: 'user', content: request.message },
    ];

    const response = await fetch(`${this.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1024,
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
}
