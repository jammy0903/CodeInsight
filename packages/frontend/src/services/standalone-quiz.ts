/**
 * Standalone Quiz Service
 * 독립형 퀴즈 시스템 API 클라이언트
 *
 * WHY: 레슨과 독립적인 퀴즈 시스템 제공
 * - 챕터별 통계 조회
 * - 퀴즈 목록 조회 (필터링)
 * - 퀴즈 시도 기록
 * - 취약 개념 분석
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// === 타입 정의 ===

export interface ChapterStatistics {
  chapterId: string;
  chapterTitle: string;
  totalQuizzes: number;
  attemptedQuizzes: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  lastAttemptedAt: string | null;
}

export interface StandaloneQuiz {
  id: string;
  language: string;
  quizType: 'ox' | 'multiple-choice' | 'fill-blank';
  chapterId: string;
  chapterTitle: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  concepts: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  orderNum: number;
  lastAttempt: {
    isCorrect: boolean;
    attemptNumber: number;
    createdAt: string;
  } | null;
}

export interface QuizAttemptRequest {
  quizId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number; // milliseconds
}

export interface QuizAttemptResponse {
  id: string;
  attemptNumber: number;
  createdAt: string;
}

export interface WeakConcept {
  concept: string;
  totalAttempts: number;
  wrongAttempts: number;
  errorRate: number;
  uniqueQuizzes: number;
  relatedQuizzes: {
    quizId: string;
    question: string;
    lastAttempt: {
      isCorrect: boolean;
      createdAt: string;
    };
  }[];
}

// === API Functions ===

/**
 * 챕터별 통계 조회
 * @param language 프로그래밍 언어
 * @param quizType 퀴즈 타입 (선택)
 * @returns 챕터별 통계 배열
 */
export async function getChapterStatistics(
  language: string,
  quizType?: string
): Promise<ChapterStatistics[]> {
  try {
    const params: any = { language };
    if (quizType) params.quizType = quizType;

    const response = await api.get<{ chapters: ChapterStatistics[] }>(
      config.api.endpoints.standaloneQuizChapters,
      { params }
    );
    return response.data.chapters;
  } catch (err) {
    logger.error('Failed to get chapter statistics:', err);
    throw handleError(err);
  }
}

/**
 * 퀴즈 목록 조회
 * @param params 필터 파라미터
 * @returns 퀴즈 배열
 */
export async function getQuizzes(params: {
  language: string;
  quizType?: string;
  chapterId?: string;
  difficulty?: string;
}): Promise<StandaloneQuiz[]> {
  try {
    const response = await api.get<{ quizzes: StandaloneQuiz[] }>(
      config.api.endpoints.standaloneQuizzes,
      { params }
    );
    return response.data.quizzes;
  } catch (err) {
    logger.error('Failed to get quizzes:', err);
    throw handleError(err);
  }
}

/**
 * 퀴즈 시도 기록
 * @param request 시도 정보
 * @returns 시도 응답 (attemptNumber 포함)
 */
export async function recordQuizAttempt(
  request: QuizAttemptRequest
): Promise<QuizAttemptResponse> {
  try {
    const response = await api.post<QuizAttemptResponse>(
      config.api.endpoints.standaloneQuizAttempt,
      request
    );
    return response.data;
  } catch (err) {
    logger.error('Failed to record quiz attempt:', err);
    throw handleError(err);
  }
}

/**
 * 취약 개념 분석
 * @param language 프로그래밍 언어
 * @param limit 결과 개수 (기본: 10)
 * @returns 취약 개념 배열
 */
export async function getWeakConcepts(
  language: string,
  limit = 10
): Promise<WeakConcept[]> {
  try {
    const response = await api.get<{ weakConcepts: WeakConcept[] }>(
      config.api.endpoints.standaloneQuizWeakConcepts,
      { params: { language, limit } }
    );
    return response.data.weakConcepts;
  } catch (err) {
    logger.error('Failed to get weak concepts:', err);
    throw handleError(err);
  }
}
