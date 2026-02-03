/**
 * Report Service — 분석 요약 + AI 리포트
 */

import { api } from '../api/axios';
import { handleError } from '../api/errors';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface AnalyticsSummary {
  period: string;
  totalStudyTime: number;
  totalSessions: number;
  quizStats: {
    total: number;
    correct: number;
    wrong: number;
    accuracy: number;
  };
  aiQuestions: number;
  notes: number;
  dailyActivity: Record<string, number>;
  hourlyActivity: number[];
  weekdayActivity: number[];
  weakConcepts: Record<string, number>;
  recentWrongAnswers: {
    quizId: string;
    question?: string;
    userAnswer: string;
    createdAt: string;
  }[];
}

export async function getAnalyticsSummary(
  period: '7d' | '30d' | '90d' | '1y' = '30d'
): Promise<AnalyticsSummary | null> {
  try {
    const response = await api.get<AnalyticsSummary>(
      config.api.endpoints.analyticsSummary,
      { params: { period } }
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) return null;
    logger.error('Failed to get analytics summary:', err);
    return null;
  }
}

export interface ReportAnalysisRequest {
  totalStudyTime: number;
  totalSessions: number;
  quizStats: {
    total: number;
    correct: number;
    accuracy: number;
  };
  aiQuestions: number;
  weakConcepts: Record<string, number>;
  weekdayActivity: number[];
  hourlyActivity: number[];
  recentWrongCount: number;
  streakDays?: number;
}

export interface ReportAnalysisResponse {
  analysis: string;
  provider: string;
}

/**
 * AI 기반 학습 리포트 분석 (LLM 호출 — 최대 3분 타임아웃)
 */
export async function getReportAnalysis(
  data: ReportAnalysisRequest
): Promise<ReportAnalysisResponse | null> {
  try {
    const response = await api.post<ReportAnalysisResponse>(
      config.api.endpoints.aiAnalyzeReport,
      data,
      { timeout: 180000 }
    );
    return response.data;
  } catch (err) {
    logger.error('Failed to get report analysis:', err);
    return null;
  }
}
