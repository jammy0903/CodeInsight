/**
 * Course Types Re-export
 *
 * 실제 타입 정의는 @/types/course.ts에 있습니다.
 * 기존 import 호환성을 위한 re-export 파일.
 *
 * Note: Step → CourseStep으로 이름 변경됨
 *       (types/memory.ts의 Step과 구분하기 위해)
 */

export type {
  Language,
  LanguageMeta,
  Day,
  CourseStep as Step,  // 기존 코드 호환성 유지
  CourseStep,
  MemoryChange,
  Quiz,
  QuizOption,
  Course,
  DayQuery,
  CourseProgress,
} from '@/types/course';
