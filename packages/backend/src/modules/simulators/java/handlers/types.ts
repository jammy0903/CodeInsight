/**
 * Java 핸들러 시스템 타입 정의
 */

import { JavaContext, JavaEvent } from '../runtime/types';

/**
 * 핸들러 처리 결과
 */
export interface HandlerResult {
  success: boolean;
  explanation: string; // 한국어 설명
  events: JavaEvent[]; // 발생한 이벤트들
  error?: string;
}

/**
 * Java 코드 라인 핸들러 인터페이스
 */
export interface JavaHandler {
  /**
   * 핸들러 우선순위 (높을수록 먼저 처리)
   */
  priority: number;

  /**
   * 이 핸들러가 해당 라인을 처리할 수 있는지 확인
   */
  canHandle(line: string, context: JavaContext): boolean;

  /**
   * 라인 처리
   */
  handle(line: string, context: JavaContext): Promise<HandlerResult>;
}

/**
 * 핸들러 실행 컨텍스트 (확장)
 */
export interface JavaExecutionContext extends JavaContext {
  // 추가 컨텍스트 필드들
}
