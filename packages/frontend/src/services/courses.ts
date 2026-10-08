/**
 * Courses Service
 * Language → Chapter → Lesson API 클라이언트
 *
 * DB 기반 새 코스 구조용 API 서비스
 */

import i18n from 'i18next';
import { api } from './api/axios';
import { handleError } from './api/errors';
import type {
  Language,
  Chapter,
  ChapterWithLessons,
  LessonFull,
} from '@/types';
import {
  LanguagesSchema,
  ChaptersSchema,
  ChapterWithLessonsSchema,
  LessonFullSchema,
} from '@codeinsight/shared';
import { logger } from '@/utils/logger';
import { resolveStepLines } from '@/features/courses/utils/resolveStepLines';

// =============================================
// API Endpoints
// =============================================

const ENDPOINTS = {
  languages: '/courses/languages',
  chapters: (lang: string) => `/courses/${lang}/chapters`,
  chapter: (id: string) => `/courses/chapters/${id}`,
  lesson: (id: string) => `/courses/lessons/${id}`,
};

function getRequestLocale(): string | undefined {
  const locale = i18n.resolvedLanguage || i18n.language;
  if (!locale) return undefined;
  const normalized = locale.toLowerCase().split('-')[0];
  return normalized === 'ko' ? undefined : normalized;
}

// =============================================
// Language API
// =============================================

/**
 * 언어 목록 조회
 */
export async function getLanguages(): Promise<Language[]> {
  try {
    const response = await api.get<Language[]>(ENDPOINTS.languages);

    // 런타임 검증
    const parsed = LanguagesSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      throw new Error('Invalid language data from server');
    }

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get languages:', error);
    throw error;
  }
}


/**
 * 언어 상세 (챕터 + 레슨 포함)
 */
export async function getLanguageWithChapters(languageId: string): Promise<Language & { chapters: ChapterWithLessons[] }> {
  try {
    const locale = getRequestLocale();
    const params = locale ? { locale } : undefined;
    const response = await api.get<Language & { chapters: ChapterWithLessons[] }>(`/courses/${languageId}`, { params });
    // Note: Zod schema verification omitted for creating composite type dynamically or assuming server correctness for perf
    return response.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get language with chapters:', error);
    throw error;
  }
}

// =============================================
// Chapter API
// =============================================

/**
 * 언어별 챕터 목록 조회
 */
export async function getChapters(languageId: string): Promise<Chapter[]> {
  try {
    const locale = getRequestLocale();
    const params = locale ? { locale } : undefined;
    const response = await api.get<Chapter[]>(ENDPOINTS.chapters(languageId), { params });

    // 런타임 검증
    const parsed = ChaptersSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      throw new Error('Invalid chapter data from server');
    }

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get chapters:', error);
    throw error;
  }
}

/**
 * 챕터 상세 (레슨 목록 포함)
 */
export async function getChapterWithLessons(chapterId: string): Promise<ChapterWithLessons> {
  try {
    const locale = getRequestLocale();
    const params = locale ? { locale } : undefined;
    const response = await api.get<ChapterWithLessons>(ENDPOINTS.chapter(chapterId), { params });

    // 런타임 검증
    const parsed = ChapterWithLessonsSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      throw new Error('Invalid chapter with lessons data from server');
    }

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get chapter:', error);
    throw error;
  }
}

// =============================================
// Lesson API
// =============================================

/**
 * 레슨 상세 (콘텐츠 + 퀴즈 포함)
 */
export async function getLessonFull(lessonId: string): Promise<LessonFull> {
  try {
    const locale = getRequestLocale();
    const params = locale ? { locale } : undefined;
    const response = await api.get<LessonFull>(ENDPOINTS.lesson(lessonId), { params });

    // step.code → step.line 런타임 계산 (Zod 검증 전에 수행)
    const data = response.data;
    if (data.content?.steps && data.content?.code) {
      data.content.steps = resolveStepLines(data.content.steps, data.content.code);
    }

    // 런타임 검증
    const parsed = LessonFullSchema.safeParse(data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      const firstIssue = parsed.error.issues[0];
      const detail = firstIssue
        ? `${firstIssue.path.join('.')} (${firstIssue.message})`
        : 'unknown schema mismatch';
      throw new Error(`Invalid lesson data from server: ${detail}`);
    }

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get lesson:', error);
    throw error;
  }
}
