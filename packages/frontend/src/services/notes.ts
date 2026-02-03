/**
 * Notes Service
 * 사용자 개념 노트 CRUD API 클라이언트
 *
 * WHY: 취약 개념 추적
 * - 퀴즈에서 노트 추가 (오답 시 자동 플래그)
 * - 레슨에서 수동 노트 추가
 * - 개념별 통계 조회
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// === 타입 정의 ===

export interface UserNote {
  id: string;
  lessonId: string;
  lessonTitle: string;
  quizId?: string;
  quizQuestion?: string;
  concept: string;
  content: string;
  source: 'quiz' | 'lesson' | 'manual';
  isFromWrong: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  lessonId: string;
  quizId?: string;
  concept: string;
  content: string;
  source: 'quiz' | 'lesson' | 'manual';
  isFromWrong?: boolean;
}

export interface UpdateNoteRequest {
  concept?: string;
  content?: string;
}

export interface NotesListResponse {
  notes: UserNote[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConceptsStatsResponse {
  topConcepts: { concept: string; count: number }[];
  weakConcepts: { concept: string; count: number }[];
}

// === CRUD API ===

/**
 * 노트 목록 조회
 * @param options 필터 옵션
 */
export async function getNotes(options?: {
  lessonId?: string;
  concept?: string;
  isFromWrong?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotesListResponse | null> {
  try {
    const params: Record<string, string | number> = {};
    if (options?.lessonId) params.lessonId = options.lessonId;
    if (options?.concept) params.concept = options.concept;
    if (options?.isFromWrong !== undefined) {
      params.isFromWrong = options.isFromWrong ? 'true' : 'false';
    }
    if (options?.limit) params.limit = options.limit;
    if (options?.offset) params.offset = options.offset;

    const response = await api.get<NotesListResponse>(
      config.api.endpoints.notes,
      { params }
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) {
      return null;
    }
    logger.error('Failed to get notes:', err);
    return null;
  }
}

/**
 * 노트 생성
 * @param data 노트 데이터
 */
export async function createNote(data: CreateNoteRequest): Promise<UserNote | null> {
  try {
    const response = await api.post<UserNote>(config.api.endpoints.notes, data);
    return response.data;
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) {
      return null;
    }
    logger.error('Failed to create note:', err);
    throw new Error(error.message);
  }
}

/**
 * 노트 수정
 * @param id 노트 ID
 * @param data 수정 데이터
 */
export async function updateNote(
  id: string,
  data: UpdateNoteRequest
): Promise<UserNote | null> {
  try {
    const response = await api.patch<UserNote>(
      `${config.api.endpoints.notes}/${id}`,
      data
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) {
      return null;
    }
    logger.error('Failed to update note:', err);
    throw new Error(error.message);
  }
}

/**
 * 노트 삭제
 * @param id 노트 ID
 */
export async function deleteNote(id: string): Promise<boolean> {
  try {
    await api.delete(`${config.api.endpoints.notes}/${id}`);
    return true;
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) {
      return false;
    }
    logger.error('Failed to delete note:', err);
    return false;
  }
}

// === Statistics API ===

/**
 * 개념별 통계 조회
 * WHY: 취약 개념 분석용
 * - topConcepts: 가장 많이 노트한 개념
 * - weakConcepts: 오답에서 온 노트 개념
 */
export async function getConceptsStats(): Promise<ConceptsStatsResponse | null> {
  try {
    const response = await api.get<ConceptsStatsResponse>(
      config.api.endpoints.notesConcepts
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) {
      return null;
    }
    logger.error('Failed to get concepts stats:', err);
    return null;
  }
}
