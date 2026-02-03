/**
 * Activity Service — 레슨 활동 추적 (체류 시간, 세션 컨텍스트, 스텝 활동)
 */

import { api } from '../api/axios';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// === Activity (체류 시간) ===

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

export async function startLessonActivity(lessonId: string): Promise<string | null> {
  try {
    const response = await api.post<ActivityStartResponse>(
      config.api.endpoints.analyticsActivity,
      { lessonId, action: 'start' }
    );
    return response.data.id;
  } catch (err) {
    logger.error('Failed to start activity:', err);
    return null;
  }
}

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
 * 페이지 닫힐 때 navigator.sendBeacon 사용 — fetch/axios는 unload 시 취소될 수 있음
 */
export function endLessonActivityBeacon(activityId: string): void {
  const url = `${config.api.baseUrl}${config.api.endpoints.analyticsActivityEnd}`;
  const data = JSON.stringify({ activityId });
  const blob = new Blob([data], { type: 'application/json' });
  const success = navigator.sendBeacon(url, blob);

  if (!success) {
    logger.warn('sendBeacon failed for activity:', activityId);
  }
}

// === Session Context ===

export interface SessionContextData {
  lessonActivityId?: string;
  screenWidth?: number;
  screenHeight?: number;
  orientation?: 'portrait' | 'landscape';
  inputMethod?: 'touch' | 'mouse';
  userAgent?: string;
  language?: string;
  connectionType?: string;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  localHour?: number;
  localWeekday?: number;
  timezone?: string;
}

export async function saveSessionContext(data: SessionContextData): Promise<string | null> {
  try {
    const response = await api.post<{ id: string; createdAt: string }>(
      config.api.endpoints.analyticsSessionContext,
      data
    );
    return response.data.id;
  } catch (err) {
    logger.error('Failed to save session context:', err);
    return null;
  }
}

export function collectSessionContext(lessonActivityId?: string): SessionContextData {
  const now = new Date();
  const connection = (navigator as any).connection;

  return {
    lessonActivityId,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    inputMethod: 'ontouchstart' in window ? 'touch' : 'mouse',
    userAgent: navigator.userAgent.slice(0, 500),
    language: navigator.language.slice(0, 10),
    connectionType: connection?.type,
    effectiveType: connection?.effectiveType,
    localHour: now.getHours(),
    localWeekday: now.getDay(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

// === Step Activity ===

export interface StepActivityData {
  lessonActivityId: string;
  lessonId: string;
  stepIndex: number;
  duration?: number;
  wentBack?: boolean;
  visHoverCount?: number;
  visClickCount?: number;
  aiQuestionCount?: number;
  codeSelections?: number;
  scrollEvents?: number;
}

export async function saveStepActivity(data: StepActivityData): Promise<void> {
  try {
    await api.post(config.api.endpoints.analyticsStepActivity, data);
  } catch (err) {
    logger.error('Failed to save step activity:', err);
  }
}

export async function saveStepActivities(activities: StepActivityData[]): Promise<void> {
  try {
    await api.post(config.api.endpoints.analyticsStepActivities, { activities });
  } catch (err) {
    logger.error('Failed to save step activities:', err);
  }
}
