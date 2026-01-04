/**
 * Types Index
 * 모든 타입의 통합 진입점
 *
 * Usage:
 *   import { Step, Message, Chapter, Lesson } from '@/types';
 *   import type { MemoryBlock, LessonStep } from '@/types';
 */

// === Memory Types (실시간 트레이서용) ===
export type {
  MemoryBlock,
  Step,           // 실시간 트레이서 스텝
  TraceResult,
} from './memory';

// === Common Types ===
export type {
  Message,
  RunResult,
} from './common';

// === Course Schema Types (DB 기반) ===
// Language → Chapter → Lesson 계층 구조
// Now imported from shared package (@codeinsight/shared)
export type {
  // 기본 엔티티
  Language,
  Chapter,
  Lesson,
  LessonDifficulty,
  // 콘텐츠
  LessonContent,
  LessonStep,
  StepMemoryState,
  StackVariable,
  HeapBlock,
  PointerConnection,
  // 퀴즈
  Quiz,
  QuizType,
  // 진행 상태
  UserProgress,
  ProgressStatus,
  // API 응답
  LanguageWithChapters,
  ChapterWithLessons,
  LessonFull,
  ChapterWithProgress,
  // 유틸리티
  LessonQuery,
  ChapterQuery,
  ProgressUpdateRequest,
} from '@codeinsight/shared';

export { getLessonPath, getChapterPath } from '@codeinsight/shared';
