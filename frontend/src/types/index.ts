/**
 * Types Index
 * 모든 타입의 통합 진입점
 *
 * Usage:
 *   import { Step, Message, Course } from '@/types';
 *   import type { MemoryBlock } from '@/types';
 *
 * WHY: Step vs CourseStep 분리
 *      - Step (memory.ts): 실시간 트레이서 결과. code, stdout, memoryBlocks 포함.
 *      - CourseStep (course.ts): 코스 데이터용. explanation, highlight, memoryChanges 포함.
 *      이름이 같지만 용도와 필드가 완전히 다름.
 * TRADEOFF: CourseStep으로 rename해서 혼란 방지 > Step 유지하며 충돌 위험.
 * REVISIT: 두 타입이 통합되거나, 하나가 사라지면 단순화 가능.
 */

// === Memory Types (실시간 트레이서용) ===
export type {
  MemoryBlock,
  Step,           // 실시간 트레이서 스텝
  TraceResult,
} from './memory';

// === Course Types (코스 데이터용) ===
export type {
  Language,
  LanguageMeta,
  Day,
  CourseStep,     // 코스 데이터 스텝 (Step과 다름)
  MemoryChange,
  Quiz,
  QuizOption,
  Course,
  DayQuery,
  CourseProgress,
} from './course';

// === Common Types ===
export type {
  Message,
  RunResult,
} from './common';
