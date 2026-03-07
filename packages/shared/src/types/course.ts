/**
 * Course Schema Types (DB-based)
 *
 * 확장 가능한 코스 시스템을 위한 타입 정의
 * Prisma 스키마와 1:1 매핑됨
 *
 * 구조: Language → Chapter → Lesson → (Content + Quiz)
 *
 * WHY: Zod 스키마에서 타입 추론 (Single Source of Truth)
 * - 스키마 수정 → 타입 자동 동기화
 * - 런타임 검증 + 컴파일타임 타입 안전성
 */

// =============================================
// Zod 기반 타입 (schemas/course.ts에서 추론)
// =============================================

export type {
  // 기본 엔티티
  Language,
  Chapter,
  Lesson,
  LessonDifficulty,

  // 메모리 시각화
  Variable,
  StackFrame,
  HeapObject,
  StepMemoryState,
  MemoryChangeAction,

  // 콘텐츠
  LessonStep,
  LessonContent,

  // 퀴즈
  QuizType,
  Quiz,

  // 진행 상태
  ProgressStatus,
  UserProgress,
  ProgressUpdateRequest,

  // API 응답
  ChapterWithLessons,
  LessonFull,
  ChapterWithProgress,

  // Legacy aliases
  StackVariable,
  HeapBlock,
} from '../schemas/course';

// =============================================
// Python 메모리 상태 (Phase 4 - 스키마 없음)
// TODO: Python 시뮬레이터 완성 시 스키마로 이동
// =============================================

export interface PythonMemoryState {
  names: PythonName[];
  objects: PythonObject[];
  output?: string[];
}

export interface PythonName {
  name: string;
  pointsTo: string;
}

export interface PythonObject {
  id: string;
  type: string;
  value: string;
  pyId?: string;
  highlight?: boolean;
}

// =============================================
// 포인터 연결 (레거시 - 향후 제거 예정)
// =============================================

export interface PointerConnection {
  from: string;
  to: string;
  label?: string;
}

// =============================================
// API 응답 타입 (Zod 스키마 없음)
// =============================================

import type { Language, Chapter } from '../schemas/course';

/**
 * 언어 + 챕터 목록
 */
export interface LanguageWithChapters extends Language {
  chapters: Chapter[];
}

// =============================================
// 유틸리티 타입
// =============================================

/**
 * 레슨 조회 쿼리
 */
export interface LessonQuery {
  languageId: string;
  chapterId: string;
  lessonId: string;
}

/**
 * 챕터 조회 쿼리
 */
export interface ChapterQuery {
  languageId: string;
  chapterId: string;
}

// =============================================
// ID 생성 헬퍼 (프론트엔드용)
// =============================================

/**
 * URL-safe 레슨 경로 생성
 * @example getLessonPath('c-1-1') => '/courses/c-1-1'
 */
export function getLessonPath(lessonId: string): string {
  return `/courses/${lessonId}`;
}

/**
 * 챕터 경로 생성
 * @example getChapterPath('c', 'ch-uuid') => '/courses/c/ch-uuid'
 */
export function getChapterPath(languageId: string, chapterId: string): string {
  return `/courses/${languageId}/${chapterId}`;
}
