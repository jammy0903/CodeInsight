/**
 * Course Feature Types
 */

/**
 * CodeSelection - 코드 텍스트 선택 정보
 * 사용자가 LessonCodeEditor 또는 CodeViewer에서 드래그한 텍스트 정보
 */
export interface CodeSelection {
  /** 선택된 텍스트 */
  text: string;
  /** 시작 줄 번호 (1-based) */
  lineStart: number;
  /** 끝 줄 번호 (1-based) */
  lineEnd: number;
  /** 선택된 첫 번째 라인의 전체 코드 */
  fullLineCode: string;
}
