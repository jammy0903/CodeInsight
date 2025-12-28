/**
 * Common Types
 * 공통으로 사용되는 기본 타입 정의
 */

// Chat message
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Code execution result
export interface RunResult {
  success: boolean;
  output: string;
  time?: string;
  memory?: string;
}
