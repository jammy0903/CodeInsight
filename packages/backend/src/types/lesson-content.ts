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

export interface MemoryChange {
  action: 'allocate' | 'update' | 'free';
  area: 'stack' | 'heap';
  name: string;
  type: string;
  size: number;
  value: string | number;
  address: string;
  previousValue?: string | number;
}

export interface LessonStep {
  line?: number;              // step.code로부터 런타임 계산 후 주입
  code?: string;              // 코드 매칭 키 (trimmed)
  occurrence?: number;        // 동일 코드 라인 구분 (기본값: 1)
  title?: string;
  explanation: string;
  highlight?: number[];
  highlightOffset?: number[]; // step.line 기준 상대 오프셋
  misconception?: string;
  memoryChanges?: MemoryChange[];
}

export interface Quiz {
  question: string;
  options: string[];
  correctIndex: number; // 정답 인덱스 (0-based)
  explanation: string;
}

export interface LessonContentData {
  lessonId: string;
  title: string;
  concept: string;
  content: {
    code: string;
    steps: LessonStep[];
  };
  quiz: Quiz;
  misconceptions?: Array<{
    wrong: string;
    correct: string;
    why: string;
  }>;
  keyTakeaway: string;
}
