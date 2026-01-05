/**
 * Course Schema Types (DB-based)
 *
 * 확장 가능한 코스 시스템을 위한 타입 정의
 * Prisma 스키마와 1:1 매핑됨
 *
 * 구조: Language → Chapter → Lesson → (Content + Quiz)
 */

// =============================================
// 기본 엔티티
// =============================================

/**
 * 프로그래밍 언어
 */
export interface Language {
  id: string; // 'c', 'java', 'python'
  name: string; // 'C', 'Java', 'Python'
  description?: string;
  icon?: string; // 아이콘 URL 또는 이모지
  color?: string; // 테마 색상 (#hex)
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 챕터 (주제별 그룹)
 */
export interface Chapter {
  id: string;
  languageId: string;
  title: string; // '변수와 메모리'
  description?: string;
  keyQuestion?: string; // '변수는 메모리 어디에 저장되는가?'
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 레슨 (개별 학습 단위)
 */
export interface Lesson {
  id: string;
  chapterId: string;
  title: string; // '변수 선언하기'
  description?: string;
  difficulty: LessonDifficulty;
  order: number;
  estimatedTime?: number; // 예상 소요 시간 (분)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LessonDifficulty = 'basic' | 'intermediate' | 'advanced';

// =============================================
// 콘텐츠 (JSON 기반 유연한 구조)
// =============================================

/**
 * 레슨 콘텐츠 (코드 + 스텝)
 */
export interface LessonContent {
  id: string;
  lessonId: string;
  code: string; // 메인 코드
  language: string; // 'c', 'java', 'python'
  steps: LessonStep[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 스텝 (코드 실행 단계)
 */
export interface LessonStep {
  line: number;
  highlightLines?: number[];
  title?: string;
  explanation: string;
  memoryChanges?: StepMemoryState;
  keyInsight?: string;
  analogy?: string;
  misconception?: string;
  tip?: string;
  output?: string;
}

/**
 * 메모리 상태 (통일 형식)
 * 모든 언어에서 동일한 구조 사용:
 * - stack: 스택 프레임 배열 (main, 함수들)
 * - heap: 힙 객체 배열
 */
export interface StepMemoryState {
  stack?: StackFrame[];
  heap?: HeapObject[];
}

/**
 * 변수 (스택 프레임 내의 개별 변수)
 */
export interface Variable {
  name: string;
  type: string;
  value: string | number;
  ref?: string;        // 힙 객체 참조 ID
  highlight?: boolean;
}

/**
 * 스택 프레임 (main, 함수명 등)
 */
export interface StackFrame {
  name: string;
  variables: Variable[];
}

/**
 * 힙 객체
 */
export interface HeapObject {
  id?: string;             // 참조 ID (포인터용)
  address?: string;        // 메모리 주소 (표시용)
  type: string;
  value?: string | number;
  fields?: Record<string, unknown>;
  highlight?: boolean;
}

/**
 * 포인터 연결 (레거시 - 향후 제거 예정)
 */
export interface PointerConnection {
  from: string;
  to: string;
  label?: string;
}

// Legacy aliases
export type StackVariable = Variable;
export type HeapBlock = HeapObject;

// =============================================
// 퀴즈
// =============================================

/**
 * 퀴즈/문제
 */
export interface Quiz {
  id: string;
  lessonId: string;
  type: QuizType;
  question: string;
  options?: string[]; // 선택지 (multiple_choice인 경우)
  answer: string; // 정답
  explanation?: string; // 해설
  order: number;
  createdAt: string;
}

export type QuizType =
  | 'multiple_choice' // 객관식
  | 'predict_output' // 출력 예측
  | 'fill_blank' // 빈칸 채우기
  | 'code_fix'; // 코드 수정

// =============================================
// 진행 상태
// =============================================

/**
 * 사용자 진행 상태
 */
export interface UserProgress {
  id: string;
  userNickname: string;
  lessonId: string;
  status: ProgressStatus;
  currentStep: number;
  quizScore?: number;
  quizTotal?: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

// =============================================
// API 응답 타입 (관계 포함)
// =============================================

/**
 * 언어 + 챕터 목록
 */
export interface LanguageWithChapters extends Language {
  chapters: Chapter[];
}

/**
 * 챕터 + 레슨 목록
 */
export interface ChapterWithLessons extends Chapter {
  lessons: Lesson[];
}

/**
 * 레슨 + 콘텐츠 + 퀴즈
 */
export interface LessonFull extends Lesson {
  content?: LessonContent;
  quizzes: Quiz[];
}

/**
 * 챕터 + 레슨 + 진행률
 */
export interface ChapterWithProgress extends Chapter {
  lessons: (Lesson & { progress?: UserProgress })[];
  completedCount: number;
  totalCount: number;
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

/**
 * 진행 상태 업데이트 요청
 */
export interface ProgressUpdateRequest {
  lessonId: string;
  status?: ProgressStatus;
  currentStep?: number;
  quizScore?: number;
  quizTotal?: number;
}

// =============================================
// ID 생성 헬퍼 (프론트엔드용)
// =============================================

/**
 * URL-safe 레슨 경로 생성
 * @example getLessonPath('c', 'ch-uuid', 'lesson-uuid') => '/courses/c/ch-uuid/lesson-uuid'
 */
export function getLessonPath(
  languageId: string,
  chapterId: string,
  lessonId: string
): string {
  return `/courses/${languageId}/${chapterId}/${lessonId}`;
}

/**
 * 챕터 경로 생성
 * @example getChapterPath('c', 'ch-uuid') => '/courses/c/ch-uuid'
 */
export function getChapterPath(languageId: string, chapterId: string): string {
  return `/courses/${languageId}/${chapterId}`;
}
