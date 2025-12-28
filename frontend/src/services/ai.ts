/**
 * AI 해설자 Service
 * 자동 해설 + Q&A 대화 API 클라이언트
 */

import { config } from '@/config';

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
    const params = new URLSearchParams({
      line: line.toString(),
      code,
      ...(topic && { topic }),
    });

    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.aiExplain}?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      await response.json().catch(() => ({}));
      return `해설을 불러올 수 없습니다. (${response.status})`;
    }

    const data: ExplainResponse = await response.json();
    return data.explanation;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('fetch')) {
      return '백엔드 서버에 연결할 수 없습니다.';
    }
    return `오류: ${err instanceof Error ? err.message : 'Unknown'}`;
  }
}

// === Q&A 대화 API ===

/**
 * AI에게 질문하기 (Q&A 대화)
 * @param message 사용자 메시지
 * @param history 대화 기록
 * @param context 코스 컨텍스트 (optional)
 */
export async function askAI(
  message: string,
  history: ChatMessage[] = [],
  context?: ChatContext
): Promise<string> {
  try {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.aiChat}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
          context,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return `API 오류 (${response.status}): ${error.message || response.statusText}`;
    }

    const data: ChatResponse = await response.json();
    return data.content;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return `백엔드 서버에 연결할 수 없습니다.

cd backend && npm run dev 명령어로 서버를 실행해주세요.`;
    }
    return `네트워크 오류: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}

// === 타입 export ===
export type { ChatMessage, ChatContext, ChatResponse, ExplainResponse };
