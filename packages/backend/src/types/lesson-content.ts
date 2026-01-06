/**
 * Lesson Content Types
 *
 * JSON 파일에서 로드되는 레슨 콘텐츠의 타입 정의
 */

export interface MemoryVariable {
  name: string;
  value: string | number;
  address: string;
  type?: string; // "int", "int*", etc.
}

export interface MemoryState {
  stack: MemoryVariable[];
  heap?: MemoryVariable[];
}

export interface LessonStep {
  line: number;
  explanation: string;
  misconception?: string; // 착각 포인트 (선택)
  memoryState: MemoryState;
}

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number; // 정답 인덱스 (0-based)
  explanation: string;
}

export interface LessonContentData {
  lessonId: string;
  code: string;
  steps: LessonStep[];
  quizzes: Quiz[];
}
