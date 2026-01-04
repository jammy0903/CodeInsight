import { z } from 'zod';

// =============================================
// Language Schemas
// =============================================

export const LanguageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
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
  id: z.string().uuid(),
  languageId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  keyQuestion: z.string().nullable().optional(),
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
  id: z.string().uuid(),
  chapterId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  difficulty: LessonDifficultySchema,
  order: z.number(),
  estimatedTime: z.number().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LessonsSchema = z.array(LessonSchema);

// =============================================
// Content Schemas
// =============================================

export const StackVariableSchema = z.object({
  name: z.string(),
  type: z.string(),
  value: z.union([z.string(), z.number()]),
  address: z.string().optional(),
  size: z.number().optional(),
  action: z.enum(['create', 'update', 'delete']).optional(),
});

export const HeapBlockSchema = z.object({
  id: z.string(),
  address: z.string(),
  size: z.number(),
  value: z.union([z.string(), z.number()]).optional(),
  label: z.string().optional(),
  action: z.enum(['create', 'update', 'delete']).optional(),
});

export const PointerConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
});

export const StepMemoryStateSchema = z.object({
  stack: z.array(StackVariableSchema).optional(),
  heap: z.array(HeapBlockSchema).optional(),
  pointers: z.array(PointerConnectionSchema).optional(),
});

export const LessonStepSchema = z.object({
  line: z.number(),
  highlightLines: z.array(z.number()).optional(),
  explanation: z.string(),
  memoryChanges: StepMemoryStateSchema.optional(),
});

export const LessonContentSchema = z.object({
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
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
  id: z.string().uuid(),
  lessonId: z.string().uuid(),
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
  id: z.string().uuid(),
  userNickname: z.string(),
  lessonId: z.string().uuid(),
  status: ProgressStatusSchema,
  currentStep: z.number(),
  quizScore: z.number().optional(),
  quizTotal: z.number().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  updatedAt: z.string(),
});

export const ProgressUpdateRequestSchema = z.object({
  lessonId: z.string().uuid(),
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
  content: LessonContentSchema.optional(),
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
