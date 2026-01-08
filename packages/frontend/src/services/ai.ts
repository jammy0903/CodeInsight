/**
 * AI 해설자 Service
 * 자동 해설 + Q&A 대화 API 클라이언트
 * axios 기반으로 리팩토링됨
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
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
 */
export async function askAI(
  message: string,
  history: ChatMessage[] = [],
  context?: ChatContext
): Promise<string> {
  try {
    const response = await api.post<ChatResponse>(
      config.api.endpoints.aiChat,
      {
        message,
        history,
        context,
      }
    );

    return response.data.content;
  } catch (err) {
    const error = handleError(err);

    // 네트워크 에러는 특별 처리
    if (error.code === 'NETWORK_ERROR') {
      return `백엔드 서버에 연결할 수 없습니다.

cd backend && npm run dev 명령어로 서버를 실행해주세요.`;
    }

    // API 크레딧 부족
    if (error.status === 402) {
      return 'AI 크레딧이 부족합니다. Provider를 전환하거나 크레딧을 충전해주세요.';
    }

    return `API 오류 (${error.status}): ${error.message}`;
  }
}

// === 타입 export ===
export type { ChatMessage, ChatContext, ChatResponse, ExplainResponse };
