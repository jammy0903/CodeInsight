/**
 * Analytics Service
 * 분석 리포트용 데이터 수집 API 클라이언트
 *
 * WHY: 사용자 학습 패턴 추적
 * - 레슨 체류 시간 (페이지 진입/이탈)
 * - 퀴즈 시도 (정답/오답, 풀이 시간)
 * - 분석 데이터 요약 조회
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// === 타입 정의 ===

export interface ActivityStartResponse {
  id: string;
  startedAt: string;
}

export interface ActivityEndResponse {
  id: string;
  startedAt: string;
  endedAt: string;
  duration: number;
}

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

export interface AnalyticsSummary {
  period: string;
  totalStudyTime: number; // 초 단위
  totalSessions: number;
  quizStats: {
    total: number;
    correct: number;
    wrong: number;
    accuracy: number;
  };
  aiQuestions: number;
  notes: number;
  dailyActivity: Record<string, number>; // 날짜 → 초
  hourlyActivity: number[]; // [0-23] 시간대별 초
  weekdayActivity: number[]; // [0-6] 요일별 초
  weakConcepts: Record<string, number>; // 개념 → 오답 수
  recentWrongAnswers: {
    quizId: string;
    question?: string;
    userAnswer: string;
    createdAt: string;
  }[];
}

// === Activity API (체류 시간) ===

/**
 * 레슨 활동 시작
 * @param lessonId 레슨 ID
 * @returns 활동 ID (종료 시 사용)
 */
export async function startLessonActivity(
  lessonId: string
): Promise<string | null> {
  try {
    const response = await api.post<ActivityStartResponse>(
      config.api.endpoints.analyticsActivity,
      { lessonId, action: 'start' }
    );
    return response.data.id;
  } catch (err) {
    logger.error('Failed to start activity:', err);
    return null; // 실패해도 사용자 경험에 영향 없음
  }
}

/**
 * 레슨 활동 종료 (일반 API)
 * @param activityId 활동 ID
 */
export async function endLessonActivity(activityId: string): Promise<void> {
  try {
    await api.post<ActivityEndResponse>(
      config.api.endpoints.analyticsActivity,
      { activityId, action: 'end' }
    );
  } catch (err) {
    logger.error('Failed to end activity:', err);
  }
}

/**
 * 레슨 활동 종료 (sendBeacon용)
 * WHY: 페이지 닫힐 때 navigator.sendBeacon 사용
 * - fetch/axios는 페이지 unload 시 취소될 수 있음
 * - sendBeacon은 브라우저가 보장
 *
 * @param activityId 활동 ID
 */
export function endLessonActivityBeacon(activityId: string): void {
  const url = `${config.api.baseUrl}${config.api.endpoints.analyticsActivityEnd}`;
  const data = JSON.stringify({ activityId });

  // sendBeacon은 Content-Type을 자동 설정하므로 Blob 사용
  const blob = new Blob([data], { type: 'application/json' });
  const success = navigator.sendBeacon(url, blob);

  if (!success) {
    logger.warn('sendBeacon failed for activity:', activityId);
  }
}

// === Quiz Attempt API ===

/**
 * 퀴즈 시도 기록
 * @param data 퀴즈 시도 데이터
 */
export async function recordQuizAttempt(
  data: QuizAttemptRequest
): Promise<void> {
  try {
    await api.post<QuizAttemptResponse>(
      config.api.endpoints.analyticsQuizAttempt,
      data
    );
  } catch (err) {
    const error = handleError(err);
    // 401/404는 로그인 안 됐거나 DB 사용자 없음 - 무시
    if (error.status === 401 || error.status === 404) {
      return;
    }
    logger.error('Failed to record quiz attempt:', err);
  }
}

// === Summary API ===

/**
 * 분석 데이터 요약 조회
 * @param period 조회 기간 ('7d', '30d', '90d', '1y')
 */
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
    // 401/404는 로그인 안 됨 - null 반환
    if (error.status === 401 || error.status === 404) {
      return null;
    }
    logger.error('Failed to get analytics summary:', err);
    return null;
  }
}

// === AI Report Analysis ===

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
 * AI 기반 학습 리포트 분석
 * @param data 학습 데이터 요약
 * @returns 개인화된 분석 텍스트
 */
export async function getReportAnalysis(
  data: ReportAnalysisRequest
): Promise<ReportAnalysisResponse | null> {
  try {
    const response = await api.post<ReportAnalysisResponse>(
      config.api.endpoints.aiAnalyzeReport,
      data
    );
    return response.data;
  } catch (err) {
    logger.error('Failed to get report analysis:', err);
    return null;
  }
}
