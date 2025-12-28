/**
 * Course Types
 * 언어별 코스 데이터 타입 정의
 */

// === 지원 언어 ===
export type Language = 'c' | 'java' | 'python';

// 언어 메타 정보
export interface LanguageMeta {
  id: Language;
  name: string;           // "C", "Java", "Python"
  icon: string;           // 이모지 or 아이콘 이름
  description: string;    // 짧은 설명
  codeBlockLang: string;  // 마크다운 코드 블록용 ("c", "java", "python")
  totalDays: number;      // 전체 Day 수
}

// === Day (개별 학습 단위) ===
export interface Day {
  day: number;                    // Day 번호 (1부터)
  title: string;                  // "포인터 역참조"
  concept: string;                // 핵심 개념 한 줄
  code: string;                   // 전체 코드
  steps: CourseStep[];            // 시뮬레이션 스텝
  quiz: Quiz;                     // 퀴즈
  commonMistakes: string[];       // 흔한 착각 포인트들
}

// === 시뮬레이션 스텝 (코스용) ===
// Note: types/memory.ts의 Step(TraceStep)과 구분하기 위해 CourseStep으로 명명
export interface CourseStep {
  stepIndex: number;              // 0부터 시작
  line: number;                   // 코드 줄 번호 (1부터)
  explanation: string;            // 이 스텝에서 무슨 일이 일어나는지
  memoryChanges?: MemoryChange[]; // 메모리 변화 (optional)
}

// 메모리 변화 (시각화용)
export interface MemoryChange {
  type: 'stack' | 'heap';
  action: 'create' | 'update' | 'delete';
  name: string;                   // 변수명
  value?: string | number;        // 새 값
  address?: string;               // 주소 (예: "0x1000")
  pointsTo?: string;              // 포인터가 가리키는 대상
}

// === 퀴즈 ===
export interface Quiz {
  question: string;               // "실행 후 a의 값은?"
  options: QuizOption[];          // 선택지
  correctIndex: number;           // 정답 인덱스 (0부터)
  explanation: string;            // 정답 해설
}

export interface QuizOption {
  label: string;                  // "20"
  value: string;                  // 내부 값
}

// === 코스 (언어별 전체 Day 모음) ===
export interface Course {
  language: LanguageMeta;
  days: Day[];
}

// === 유틸리티 타입 ===

// Day를 찾을 때 사용
export interface DayQuery {
  language: Language;
  day: number;
}

// 코스 진행 상태
export interface CourseProgress {
  language: Language;
  completedDays: number[];
  currentDay: number;
}
