/**
 * AI Provider Interface & Types
 */

export type ProviderType = 'deepseek' | 'ollama' | 'claude-cli';

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

export interface IAIProvider {
  readonly type: ProviderType;
  readonly name: string;
  readonly isAvailable: () => Promise<boolean>;
  chat(request: ChatRequest): Promise<ChatResponse>;
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
    'claude-cli': {
      enabled: boolean;
    };
  };
}
