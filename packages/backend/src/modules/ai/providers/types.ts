/**
 * AI Provider Interface & Types
 */

export type ProviderType = 'deepseek' | 'ollama';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  provider: ProviderType;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 스트리밍 청크
 */
export interface StreamChunk {
  content: string;
  done: boolean;
}

/**
 * 스트리밍 콜백
 */
export type StreamCallback = (chunk: StreamChunk) => void;

export interface IAIProvider {
  readonly type: ProviderType;
  readonly name: string;
  readonly isAvailable: () => Promise<boolean>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  /**
   * 스트리밍 채팅 (optional)
   * 지원하지 않는 provider는 undefined
   */
  streamChat?(request: ChatRequest, onChunk: StreamCallback): Promise<void>;
}

export interface ProviderConfig {
  currentProvider: ProviderType;
  providers: {
    deepseek: {
      enabled: boolean;
      apiKey?: string;
    };
    ollama: {
      enabled: boolean;
      url: string;
      model: string;
    };
  };
}
