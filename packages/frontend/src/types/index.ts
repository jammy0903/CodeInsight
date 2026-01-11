/**
 * Types Index
 * 모든 타입의 통합 진입점
 *
 * Usage:
 *   import { Step, Message, Chapter, Lesson } from '@/types';
 *   import type { MemoryBlock, LessonStep } from '@/types';
 *   import type { PyStep, SupportedLanguage } from '@/types';
 */

// === Memory Types (레슨/Playground 공용) ===
export type {
  SegmentType,
  MemoryBlock,
  MemoryState,
  StackRegisters,
  Step,           // 실시간 트레이서 스텝
  TraceResult,
} from './memory';

// === Simulator Types (Playground용) ===
export type {
  Simulator,
  CodeHandler,
  HandlerRegistry,
  SupportedLanguage,
  BaseStep,
  BaseChange,
  HexAddress,
  ObjectId,
} from './simulator';

// === C Simulator Types ===
// Note: CStep, CMemoryBlock, CCodeHandler removed - use LessonStep and MemoryBlock from shared
export type {
  CSegmentType,
  CParamDef,
  CFunctionDef,
  CCallFrame,
  CFieldDef,
  CStructDef,
  CVariable,
  CSimContext,
  CChangeType,
  CChange,
} from './c-simulator';

// === Python Simulator Types ===
export type {
  PyPrimitiveType,
  PyCollectionType,
  PyAdvancedType,
  PyType,
  PyPrimitiveValue,
  PyObjectRef,
  PyValue,
  PyScope,
  PyName,
  PyObject,
  PyCallFrame,
  PySimContext,
  PyChangeType,
  PyChange,
  PyStep,
  PyCodeHandler,
} from './py-simulator';

export {
  isPrimitiveType,
  isCollectionType,
  isImmutableType,
} from './py-simulator';

// === Common Types ===
export type {
  Message,
  RunResult,
} from './common';

// === Course Schema Types (DB 기반) ===
// Language → Chapter → Lesson 계층 구조
// Now imported from shared package (@codeinsight/shared)
// NOTE: `export type`이 아닌 `export`를 사용해야 Vite 개발 모드에서 정상 작동
export {
  // 기본 엔티티
  type Language,
  type Chapter,
  type Lesson,
  type LessonDifficulty,
  // 콘텐츠
  type LessonContent,
  type LessonStep,
  type StepMemoryState,
  type MemoryChangeAction,
  // 메모리 시각화 (통일 형식)
  type Variable,
  type StackFrame,
  type HeapObject,
  // 레거시 alias
  type StackVariable,
  type HeapBlock,
  type PointerConnection,
  // 퀴즈
  type Quiz,
  type QuizType,
  // 진행 상태
  type UserProgress,
  type ProgressStatus,
  // API 응답
  type LanguageWithChapters,
  type ChapterWithLessons,
  type LessonFull,
  type ChapterWithProgress,
  // 유틸리티
  type LessonQuery,
  type ChapterQuery,
  type ProgressUpdateRequest,
  // 함수
  getLessonPath,
  getChapterPath,
} from '@codeinsight/shared';
