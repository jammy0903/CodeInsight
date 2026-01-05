/**
 * Courses Service
 * Language → Chapter → Lesson API 클라이언트
 *
 * DB 기반 새 코스 구조용 API 서비스
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import type {
  Language,
  Chapter,
  ChapterWithLessons,
  LessonFull,
  UserProgress,
  ProgressUpdateRequest,
  ChapterWithProgress,
} from '@/types';
import {
  LanguagesSchema,
  ChaptersSchema,
  ChapterWithLessonsSchema,
  LessonFullSchema,
  UserProgressSchema,
  UserProgressListSchema,
  ChapterWithProgressSchema,
} from '@codeinsight/shared';

// 환경별 로거 (프로덕션에서는 민감 정보 출력 안 함)
const logger = {
  error: (...args: unknown[]) => {
    // 에러는 항상 출력 (디버깅 필요)
    console.error('[courses]', ...args);
  },
};

// =============================================
// API Endpoints
// =============================================

const ENDPOINTS = {
  languages: '/courses/languages',
  chapters: (lang: string) => `/courses/${lang}/chapters`,
  chapter: (id: string) => `/courses/chapters/${id}`,
  chapterProgress: (id: string) => `/courses/chapters/${id}/progress`,
  lesson: (id: string) => `/courses/lessons/${id}`,
  progress: '/courses/progress',
};

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

// =============================================
// Chapter API
// =============================================

/**
 * 언어별 챕터 목록 조회
 */
export async function getChapters(languageId: string): Promise<Chapter[]> {
  try {
    const response = await api.get<Chapter[]>(ENDPOINTS.chapters(languageId));

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
    const response = await api.get<ChapterWithLessons>(ENDPOINTS.chapter(chapterId));

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

/**
 * 챕터 진행 상태 (인증 필요)
 */
export async function getChapterProgress(chapterId: string): Promise<ChapterWithProgress> {
  try {
    const response = await api.get<ChapterWithProgress>(ENDPOINTS.chapterProgress(chapterId));

    // 런타임 검증
    const parsed = ChapterWithProgressSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      throw new Error('Invalid chapter progress data from server');
    }

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get chapter progress:', error);
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
    const response = await api.get<LessonFull>(ENDPOINTS.lesson(lessonId));

    // 런타임 검증
    const parsed = LessonFullSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      throw new Error('Invalid lesson data from server');
    }

    // DEBUG: 파싱 후 content 확인
    console.log('[DEBUG] Raw response.data.content:', response.data.content);
    console.log('[DEBUG] Parsed data.content:', parsed.data.content);
    console.log('[DEBUG] Steps count:', parsed.data.content?.steps?.length);

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get lesson:', error);
    throw error;
  }
}

// =============================================
// Progress API
// =============================================

/**
 * 사용자 전체 진행 상태 조회
 */
export async function getUserProgress(): Promise<UserProgress[]> {
  try {
    const response = await api.get<UserProgress[]>(ENDPOINTS.progress);

    // 런타임 검증
    const parsed = UserProgressListSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      throw new Error('Invalid user progress data from server');
    }

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to get user progress:', error);
    throw error;
  }
}

/**
 * 진행 상태 업데이트
 */
export async function updateProgress(data: ProgressUpdateRequest): Promise<UserProgress> {
  try {
    const response = await api.post<UserProgress>(ENDPOINTS.progress, data);

    // 런타임 검증
    const parsed = UserProgressSchema.safeParse(response.data);
    if (!parsed.success) {
      logger.error('Invalid API response:', parsed.error);
      throw new Error('Invalid progress data from server');
    }

    return parsed.data;
  } catch (err) {
    const error = handleError(err);
    logger.error('Failed to update progress:', error);
    throw error;
  }
}

