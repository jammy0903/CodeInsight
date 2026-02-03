/**
 * Quiz Service — 퀴즈 시도 기록
 */

import { api } from '../api/axios';
import { handleError } from '../api/errors';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface QuizAttemptRequest {
  quizId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
}

export interface QuizAttemptResponse {
  id: string;
  createdAt: string;
}

export async function recordQuizAttempt(data: QuizAttemptRequest): Promise<void> {
  try {
    await api.post<QuizAttemptResponse>(
      config.api.endpoints.analyticsQuizAttempt,
      data
    );
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) return;
    logger.error('Failed to record quiz attempt:', err);
  }
}
