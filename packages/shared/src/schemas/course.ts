import { z } from 'zod';

// =============================================
// Language Schemas
// =============================================

export const LanguageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional().transform(val => val ?? undefined),
  icon: z.string().nullable().optional().transform(val => val ?? undefined),
  color: z.string().nullable().optional().transform(val => val ?? undefined),
  isActive: z.boolean(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LanguagesSchema = z.array(LanguageSchema);

// =============================================
// Chapter Schemas
// =============================================

export const ChapterSchema = z.object({
  id: z.string(),  // short ID 지원 (j-1-1, p-2-3 등)
  languageId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional().transform(val => val ?? undefined),
  keyQuestion: z.string().nullable().optional().transform(val => val ?? undefined),
  order: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ChaptersSchema = z.array(ChapterSchema);

// =============================================
// Lesson Schemas
// =============================================

export const LessonDifficultySchema = z.enum(['basic', 'intermediate', 'advanced']);

export const LessonSchema = z.object({
  id: z.string(),  // short ID 지원 (j-1-1, p-2-3 등)
  chapterId: z.string(),  // short ID 지원
  title: z.string(),
  description: z.string().nullable().optional().transform(val => val ?? undefined),
  difficulty: LessonDifficultySchema,
  order: z.number(),
  estimatedTime: z.number().nullable().optional().transform(val => val ?? undefined),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LessonsSchema = z.array(LessonSchema);

// =============================================
// Content Schemas
// =============================================

// =============================================
// Memory Visualization Schemas (통일 형식)
// =============================================

// 변수 (스택 프레임 내의 개별 변수)
export const VariableSchema = z.object({
  name: z.string(),
  type: z.string(),
  value: z.union([z.string(), z.number()]),
  ref: z.string().optional(),        // 힙 객체 참조 ID
  highlight: z.boolean().optional(),
});

// 스택 프레임 (main, 함수명 등)
export const StackFrameSchema = z.object({
  name: z.string(),                  // "main", "addOne", "global"
  variables: z.array(VariableSchema),
});

// 힙 객체
export const HeapObjectSchema = z.object({
  id: z.string().optional(),         // 참조 ID (포인터용)
  address: z.string().optional(),    // 메모리 주소 (표시용)
  type: z.string(),                  // "String", "int[]", "Person"
  value: z.union([z.string(), z.number()]).optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  highlight: z.boolean().optional(),
});

// 메모리 상태 (C 언어 전용 - 레거시)
export const StepMemoryStateSchema = z.object({
  stack: z.array(StackFrameSchema).optional(),
  heap: z.array(HeapObjectSchema).optional(),
});

export const MemoryChangeSchema = z.object({
  action: z.enum(['allocate', 'update', 'free']),
  area: z.enum(['stack', 'heap']),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  value: z.union([z.string(), z.number()]),
  address: z.string(),
  previousValue: z.union([z.string(), z.number()]).optional(),
});

export const LessonStepSchema = z.object({
  line: z.number(),
  highlight: z.array(z.number()).optional(), // API는 highlight 사용
  highlightLines: z.array(z.number()).optional(), // 레거시
  title: z.string().optional(),
  explanation: z.string(),
  // WHY: 각 언어마다 다른 메모리 모델을 사용 (C: stack/heap, Python: objects/names, Java: 혼합)
  // TRADEOFF: 타입 안전성 < 언어별 유연성
  memoryChanges: z.array(MemoryChangeSchema).optional(),
  keyInsight: z.string().optional(),
  analogy: z.string().optional(),
  misconception: z.string().optional(),
  tip: z.string().optional(),
  output: z.string().optional(),
});

// Legacy aliases for backward compatibility
export const StackVariableSchema = VariableSchema;
export const HeapBlockSchema = HeapObjectSchema;

export const LessonContentSchema = z.object({
  id: z.string(),  // short ID 지원
  lessonId: z.string(),  // short ID 지원
  code: z.string(),
  language: z.string(),
  steps: z.array(LessonStepSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// =============================================
// Quiz Schemas
// =============================================

export const QuizTypeSchema = z.enum([
  'multiple_choice',
  'predict_output',
  'fill_blank',
  'code_fix',
]);

export const QuizSchema = z.object({
  id: z.string(),  // short ID 지원
  lessonId: z.string(),  // short ID 지원
  type: QuizTypeSchema,
  question: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.string(),
  explanation: z.string().optional(),
  order: z.number(),
  createdAt: z.string(),
});

export const QuizzesSchema = z.array(QuizSchema);

// =============================================
// Progress Schemas
// =============================================

export const ProgressStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);

export const UserProgressSchema = z.object({
  id: z.string(),  // short ID 또는 UUID
  userNickname: z.string(),
  lessonId: z.string(),  // short ID 지원
  status: ProgressStatusSchema,
  currentStep: z.number(),
  quizScore: z.number().optional(),
  quizTotal: z.number().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  updatedAt: z.string(),
});

export const ProgressUpdateRequestSchema = z.object({
  lessonId: z.string(),  // short ID 지원
  status: ProgressStatusSchema.optional(),
  currentStep: z.number().optional(),
  quizScore: z.number().optional(),
  quizTotal: z.number().optional(),
});

export const UserProgressListSchema = z.array(UserProgressSchema);

// =============================================
// API Response Schemas
// =============================================

export const ChapterWithLessonsSchema = ChapterSchema.extend({
  lessons: LessonsSchema,
});

export const LessonFullSchema = LessonSchema.extend({
  content: LessonContentSchema.nullish(),  // null 또는 undefined 허용
  quizzes: QuizzesSchema,
});

export const LessonWithProgressSchema = LessonSchema.extend({
  progress: UserProgressSchema.optional(),
});

export const ChapterWithProgressSchema = ChapterSchema.extend({
  lessons: z.array(LessonWithProgressSchema),
  completedCount: z.number(),
  totalCount: z.number(),
});
