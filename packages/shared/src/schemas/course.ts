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
  isSequential: z.boolean(), // 순차 잠금 여부 (true = 이전 챕터 완료 필요, false = all open)
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

// Python 타입
export const PyTypeSchema = z.enum([
  'int', 'float', 'str', 'bool', 'NoneType',
  'list', 'tuple', 'dict', 'set',
  'function', 'class', 'instance',
]);

// Python 객체
export const PyObjectSchema = z.object({
  id: z.string(),
  type: z.union([PyTypeSchema, z.string()]), // 'list' 등 추가 타입 허용
  value: z.unknown(),
  mutable: z.boolean().optional(), // Lesson JSON에선 선택적
  pyId: z.string().optional(), // 실제 Python 객체 ID (예: "140234567890")
  highlight: z.boolean().optional(),
});

// Python 이름 (변수)
export const PyNameSchema = z.object({
  name: z.string(),
  scope: z.string().optional(), // Lesson JSON에선 선택적 (프레임명: 'global', '__main__', 함수명 등)
  pointsTo: z.string(),
  highlight: z.boolean().optional(),
});

// 변수 (스택 프레임 내의 개별 변수)
export const VariableSchema = z.object({
  name: z.string(),
  type: z.string(),
  value: z.union([z.string(), z.number()]),
  address: z.string().optional(),
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

// MemoryBlock (Playground용 스냅샷 형식)
// WHY: Playground는 실시간 C 코드 실행 결과를 직접 스냅샷으로 받음
// TRADEOFF: memoryChanges 형식과 별도 관리 필요 (useLessonVisualization이 두 형식 모두 처리)
// NOTE: Heap blocks may not have a name (anonymous malloc blocks)
export const MemoryBlockSchema: z.ZodType<{
  name?: string;  // Optional for heap blocks
  address: string;
  value: string;
  type?: string;
  size?: number;
  bytes?: number[];
  segment?: 'stack' | 'heap' | 'data' | 'text';
  points_to?: string | null;
  explanation?: string;
  highlight?: boolean;
  isArray?: boolean;
  arrayElements?: any[];
  isExpanded?: boolean;
}> = z.object({
  name: z.string().optional(),  // Heap blocks may be anonymous
  address: z.string(),
  value: z.string(),
  // Optional fields
  type: z.string().optional(),
  size: z.number().optional(),
  bytes: z.array(z.number()).optional(),
  segment: z.enum(['stack', 'heap', 'data', 'text']).optional(),
  points_to: z.string().nullable().optional(),
  explanation: z.string().optional(),
  highlight: z.boolean().optional(),
  // 배열 지원 (접기/펼치기)
  isArray: z.boolean().optional(),
  arrayElements: z.lazy(() => z.array(MemoryBlockSchema)).optional(),
  isExpanded: z.boolean().optional(),
});

// 메모리 상태 (C 언어 전용 - 레거시)
export const StepMemoryStateSchema = z.object({
  stack: z.array(StackFrameSchema).optional(),
  heap: z.array(HeapObjectSchema).optional(),
});

// MemoryChangeAction - 메모리 변경 액션 (배열 형식)
// WHY: C 메모리 시뮬레이션에서 frame 생성/종료, 변수 할당/해제를 표현
// REVISIT: Python/Java 추가 시 언어별 분기 필요할 수 있음
export const MemoryChangeSchema = z.object({
  action: z.enum(['frame', 'allocate', 'update', 'free', 'deallocate', 'frame_end']),
  area: z.enum(['stack', 'heap']),
  // deallocate, frame_end 액션은 name이 없을 수 있음
  name: z.string().optional(),
  // frame/frame_end 액션은 type, size, value, address가 없음
  type: z.string().optional(),
  size: z.number().optional(),
  value: z.union([z.string(), z.number()]).optional(),
  address: z.string().optional(),
  frame: z.string().optional(),  // 변수가 속한 프레임명
  previousValue: z.union([z.string(), z.number()]).optional(),
});

// Event-Driven Visualization용 이벤트 타입 import
import { VisualizationEventSchema } from './events';

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
  // 터미널 출력 (시뮬레이터 불필요 시 직접 지정)
  stdout: z.string().optional(),
  // Python/JS 시각화 (Phase 4+)
  visualizationType: z.string().optional(),
  // Python 메모리 시각화 (Lesson JSON용)
  // WHY: Python 레슨은 names-objects 모델로 직접 시각화 데이터 제공
  pythonMemoryState: z.object({
    names: z.array(PyNameSchema),
    objects: z.array(PyObjectSchema),
    output: z.array(z.string()).optional(), // 터미널 출력 (id() 결과 등)
  }).optional(),
  // Java 메모리 시각화 (Lesson JSON용)
  // WHY: Java 레슨은 stack/heap 모델로 참조 관계를 시각화
  memoryState: z.object({
    stack: z.array(z.object({
      name: z.string(),
      value: z.union([z.string(), z.number()]),
      type: z.string().optional(),
    })).optional(),
    heap: z.array(z.object({
      address: z.string(),
      content: z.union([z.string(), z.number()]),
      type: z.string().optional(),
      new: z.boolean().optional(), // 새로 생성된 객체 하이라이트
    })).optional(),
    comparison: z.string().optional(), // "0x001 != 0x002" 등
    output: z.array(z.string()).optional(), // ["false"] 등
  }).optional(),
  // Java 메모리 시각화 (Standardized)
  javaMemoryState: z.object({
    stack: z.array(z.object({
      name: z.string(),
      value: z.union([z.string(), z.number()]),
      type: z.string().optional(),
      address: z.string().optional(),
      sameRef: z.boolean().optional(),
    })).optional(),
    heap: z.array(z.object({
      address: z.string(),
      content: z.union([z.string(), z.number()]),
      type: z.string().optional(),
      new: z.boolean().optional(),
      refCount: z.number().optional(),
      hashCode: z.string().optional(),
    })).optional(),
    stringPool: z.array(z.object({
      value: z.string(),
      address: z.string(),
      refCount: z.number().optional(),
    })).optional(),
    cache: z.any().optional(),
    hashSet: z.any().optional(),
    comparison: z.string().optional(),
    output: z.array(z.string()).optional(),
    note: z.string().optional(),
    warning: z.string().optional(),
  }).optional(),
  // Playground용 메모리 스냅샷 (직접 실행 결과)
  // WHY: Playground는 실시간 C 실행 결과를 받아 즉시 시각화
  // TRADEOFF: Lesson은 memoryChanges로 누적, Playground는 stack/heap으로 스냅샷
  stack: z.array(MemoryBlockSchema).optional(),
  heap: z.array(MemoryBlockSchema).optional(),
  data: z.array(MemoryBlockSchema).optional(),
  // Python 시각화 (Playground용)
  // WHY: Python은 Names-Objects 모델이므로 C의 stack/heap과 다른 구조
  pyNames: z.array(PyNameSchema).optional(),
  pyObjects: z.array(PyObjectSchema).optional(),
  // Python 콜스택 (함수 호출 시각화)
  // WHY: 함수 호출/반환 시 프레임 생성/삭제 시각화
  callStack: z.array(z.object({
    functionName: z.string(),
    depth: z.number(),
    localNames: z.array(PyNameSchema),
  })).optional(),
  // JavaScript 시각화 (이벤트 루프, 클로저 등)
  eventLoopState: z.unknown().optional(),
  callStackState: z.unknown().optional(),
  closureState: z.unknown().optional(),
  thisBindState: z.unknown().optional(),
  hoistingState: z.unknown().optional(),
  scopeChainState: z.unknown().optional(),
  prototypeState: z.unknown().optional(),
  // Playground에서 필요한 코드 필드
  code: z.string().optional(),
  // C 시뮬레이터 return 정보
  isReturn: z.boolean().optional(),
  returnInfo: z.unknown().optional(),
  // Event-Driven Visualization (권장 방식)
  // WHY: 프론트엔드가 diff 계산 불필요, 백엔드가 명시적 이벤트 전달
  // TRADEOFF: 기존 memoryChanges/stack/heap 형식과 병존 (하위 호환성)
  events: z.array(VisualizationEventSchema).optional(),
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
  showRegisters: z.boolean().optional(), // 함수 레슨에서 RSP/RBP 레지스터 표시
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
  lessonId: z.string(),  // short ID 지원
  status: ProgressStatusSchema,
  currentStep: z.number(),
  quizScore: z.number().nullable().optional(),  // Prisma Int? → null 허용
  quizTotal: z.number().nullable().optional(),  // Prisma Int? → null 허용
  startedAt: z.string().nullable().optional(),  // Prisma DateTime? → null 허용
  completedAt: z.string().nullable().optional(),  // Prisma DateTime? → null 허용
  updatedAt: z.string().optional(),  // Prisma @updatedAt는 항상 존재
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
// Progress Schemas
// =============================================

/**
 * 챕터별 집계된 진행률
 * WHY: 백엔드에서 계산하여 제공 (DRY 원칙)
 */
export const ChapterProgressSchema = z.object({
  total: z.number(),       // 전체 레슨 수
  completed: z.number(),   // 완료한 레슨 수
  percentage: z.number(),  // 완료율 (0-100)
});

// =============================================
// API Response Schemas
// =============================================

export const ChapterWithLessonsSchema = ChapterSchema.extend({
  lessons: LessonsSchema,
  progress: ChapterProgressSchema.optional(), // 로그인 시에만 포함
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

// =============================================
// Inferred Types (Single Source of Truth)
// WHY: Zod 스키마에서 타입을 추론하여 스키마-타입 동기화 보장
// USAGE: types/course.ts에서 re-export
// =============================================

// 기본 엔티티
export type Language = z.infer<typeof LanguageSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonDifficulty = z.infer<typeof LessonDifficultySchema>;

// 메모리 시각화
export type Variable = z.infer<typeof VariableSchema>;
export type StackFrame = z.infer<typeof StackFrameSchema>;
export type HeapObject = z.infer<typeof HeapObjectSchema>;
export type MemoryBlock = z.infer<typeof MemoryBlockSchema>;
export type StepMemoryState = z.infer<typeof StepMemoryStateSchema>;
export type MemoryChangeAction = z.infer<typeof MemoryChangeSchema>;

// Python 메모리 시각화
export type PyType = z.infer<typeof PyTypeSchema>;
export type PyObject = z.infer<typeof PyObjectSchema>;
export type PyName = z.infer<typeof PyNameSchema>;

// 콘텐츠
export type LessonStep = z.infer<typeof LessonStepSchema>;
export type LessonContent = z.infer<typeof LessonContentSchema>;

// 퀴즈
export type QuizType = z.infer<typeof QuizTypeSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

// 진행 상태
export type ProgressStatus = z.infer<typeof ProgressStatusSchema>;
export type UserProgress = z.infer<typeof UserProgressSchema>;
export type ProgressUpdateRequest = z.infer<typeof ProgressUpdateRequestSchema>;
export type ChapterProgress = z.infer<typeof ChapterProgressSchema>;

// API 응답
export type ChapterWithLessons = z.infer<typeof ChapterWithLessonsSchema>;
export type LessonFull = z.infer<typeof LessonFullSchema>;
export type ChapterWithProgress = z.infer<typeof ChapterWithProgressSchema>;

// Legacy aliases
export type StackVariable = Variable;
export type HeapBlock = HeapObject;
