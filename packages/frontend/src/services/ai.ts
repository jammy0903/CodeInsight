/**
 * AI 해설자 Service
 * 자동 해설 + Q&A 대화 API 클라이언트
 * axios 기반으로 리팩토링됨
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';
import { notifyAI, notifyNetwork } from '@/components/common/Toast';

// === 타입 정의 ===

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatContext {
  courseDay?: number;
  topic?: string;
  code?: string;
  currentLine?: number;
  quizQuestion?: string;
}

// 분석 리포트용 추가 옵션
interface ChatOptions {
  lessonId?: string;           // 어떤 레슨에서 질문했는지
  contextType?: 'lesson' | 'playground' | 'general'; // 질문 맥락
}

interface ChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

interface ExplainResponse {
  line: number;
  explanation: string;
}

interface MemoryBlock {
  name: string;
  type: string;
  value: string;
  address: string;
}

interface MemoryChange {
  target: string;
  from?: string;
  to: string;
}

interface ExplainStepRequest {
  language: 'c' | 'javascript' | 'python';
  line: number;
  code: string;
  fullCode: string;
  stack?: MemoryBlock[];
  heap?: MemoryBlock[];
  changes?: MemoryChange[];
  // JavaScript용 필드
  jsStack?: Array<{ functionName: string; variables: Record<string, any> }>;
  jsHeap?: Array<{ id: string; type: 'Object' | 'Array' | 'Function'; value: any }>;
  // Python용 필드
  pyNames?: Array<{ name: string; pointsTo: string }>;
  pyObjects?: Array<{ id: string; type: string; value: any }>;
}

interface ExplainStepResponse {
  line: number;
  explanation: string;
  provider: string;
}

// === 자동 해설 API ===

/**
 * 특정 줄에 대한 자동 해설 요청
 * @param line 설명할 줄 번호 (1부터 시작)
 * @param code 전체 코드
 * @param topic 현재 학습 주제 (optional)
 */
export async function getExplanation(
  line: number,
  code: string,
  topic?: string
): Promise<string> {
  try {
    const response = await api.get<ExplainResponse>(
      config.api.endpoints.aiExplain,
      {
        params: {
          line,
          code,
          ...(topic && { topic }),
        },
      }
    );

    return response.data.explanation;
  } catch (err) {
    const error = handleError(err);

    // 네트워크 에러는 특별 처리
    if (error.code === 'NETWORK_ERROR') {
      notifyAI.backendDisconnected();
      return '백엔드 서버에 연결할 수 없습니다.';
    }

    return `해설을 불러올 수 없습니다. (${error.status}: ${error.message})`;
  }
}


// === Q&A 대화 API ===

/**
 * AI에게 질문하기 (Q&A 대화)
 * @param message 사용자 메시지
 * @param history 대화 기록
 * @param context 코스 컨텍스트 (optional)
 * @param options 분석 리포트용 옵션 (lessonId, contextType)
 */
export async function askAI(
  message: string,
  history: ChatMessage[] = [],
  context?: ChatContext,
  options?: ChatOptions
): Promise<string> {
  try {
    const response = await api.post<ChatResponse>(
      config.api.endpoints.aiChat,
      {
        message,
        history,
        context,
        // 분석 리포트용 필드 (로그인 시 ChatHistory 저장에 사용)
        lessonId: options?.lessonId,
        contextType: options?.contextType,
      }
    );

    return response.data.content;
  } catch (err) {
    const error = handleError(err);

    // 네트워크 에러는 특별 처리
    if (error.code === 'NETWORK_ERROR') {
      notifyAI.backendDisconnected();
      return `백엔드 서버에 연결할 수 없습니다.

cd backend && npm run dev 명령어로 서버를 실행해주세요.`;
    }

    // API 크레딧 부족
    if (error.status === 402) {
      notifyAI.creditExhausted();
      return 'AI 크레딧이 부족합니다. Provider를 전환하거나 크레딧을 충전해주세요.';
    }

    return `API 오류 (${error.status}): ${error.message}`;
  }
}

// === 스트리밍 Q&A 대화 API ===

/**
 * 스트리밍 청크 타입
 */
interface StreamChunk {
  content: string;
  done: boolean;
  error?: string;
}

/**
 * AI에게 질문하기 (스트리밍)
 * @param message 사용자 메시지
 * @param history 대화 기록
 * @param context 코스 컨텍스트 (optional)
 * @param onChunk 청크 수신 콜백
 * @param options 분석 리포트용 옵션 (lessonId, contextType)
 */
export async function askAIStream(
  message: string,
  history: ChatMessage[] = [],
  context?: ChatContext,
  onChunk?: (content: string) => void,
  options?: ChatOptions
): Promise<string> {
  const url = `${config.api.baseUrl}${config.api.endpoints.aiChatStream}`;

  // 타임아웃 설정 (90초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        message,
        history,
        context,
        // 분석 리포트용 필드 (로그인 시 ChatHistory 저장에 사용)
        lessonId: options?.lessonId,
        contextType: options?.contextType,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 파싱
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const chunk: StreamChunk = JSON.parse(trimmed.slice(6));

            if (chunk.error) {
              throw new Error(chunk.error);
            }

            if (chunk.content) {
              fullContent += chunk.content;
              onChunk?.(chunk.content);
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  } catch (err) {
    // 타임아웃 에러 처리
    if (err instanceof Error && err.name === 'AbortError') {
      return '⏱️ AI 응답 시간이 초과되었습니다. 다시 시도해주세요.';
    }

    // 네트워크 에러 처리
    if (err instanceof TypeError && err.message.includes('fetch')) {
      notifyAI.backendDisconnected();
      return `백엔드 서버에 연결할 수 없습니다.

cd backend && npm run dev 명령어로 서버를 실행해주세요.`;
    }

    return `스트리밍 오류: ${err instanceof Error ? err.message : 'Unknown error'}`;
  } finally {
    clearTimeout(timeoutId);
  }
}

// === 스트리밍 스텝 설명 API ===

/**
 * 시뮬레이션 스텝에 대한 AI 설명 요청 (스트리밍)
 * @param request 스텝 정보
 * @param onChunk 청크 수신 콜백
 */
export async function getStepExplanationStream(
  request: ExplainStepRequest,
  onChunk?: (content: string) => void
): Promise<string> {
  const url = `${config.api.baseUrl}${config.api.endpoints.aiExplainStep}`;

  // 타임아웃 설정 (60초 - 스텝 설명은 짧으므로)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 파싱
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const chunk: StreamChunk = JSON.parse(trimmed.slice(6));

            if (chunk.error) {
              throw new Error(chunk.error);
            }

            if (chunk.content) {
              fullContent += chunk.content;
              onChunk?.(chunk.content);
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  } catch (err) {
    // 타임아웃 에러 처리
    if (err instanceof Error && err.name === 'AbortError') {
      return '⏱️ AI 응답 시간이 초과되었습니다.';
    }

    if (err instanceof TypeError && err.message.includes('fetch')) {
      notifyAI.backendDisconnected();
      return '🔌 AI 서버에 연결할 수 없습니다.';
    }

    return `⚠️ 스트리밍 오류: ${err instanceof Error ? err.message : 'Unknown error'}`;
  } finally {
    clearTimeout(timeoutId);
  }
}

// === 타입 export ===
export type {
  ChatMessage,
  ChatContext,
  ChatOptions,
  ChatResponse,
  ExplainResponse,
  ExplainStepRequest,
  ExplainStepResponse,
  StreamChunk,
};
