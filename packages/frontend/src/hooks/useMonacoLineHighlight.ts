/**
 * useMonacoLineHighlight - Monaco 에디터 라인 하이라이트 훅
 *
 * 중복 제거: CodeEditor, LessonCodeEditor에서 동일하게 사용
 */

import { useEffect, useRef } from 'react';
import type * as monacoEditor from 'monaco-editor';

interface UseMonacoLineHighlightOptions {
  /** 에디터 인스턴스 ref */
  editorRef: React.MutableRefObject<monacoEditor.editor.IStandaloneCodeEditor | null>;
  /** 하이라이트할 라인 번호 */
  lineNumber?: number;
  /** 해당 라인으로 스크롤 여부 */
  scrollToLine?: boolean;
}

/**
 * Monaco 에디터에서 특정 라인을 하이라이트하는 훅
 *
 * @example
 * const editorRef = useRef(null);
 * useMonacoLineHighlight({ editorRef, lineNumber: currentLine });
 */
export function useMonacoLineHighlight({
  editorRef,
  lineNumber,
  scrollToLine = true,
}: UseMonacoLineHighlightOptions) {
  const decorationsRef = useRef<string[]>([]);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || !lineNumber) {
      // 라인 없으면 데코레이션 제거
      if (editor && decorationsRef.current.length > 0) {
        decorationsRef.current = editor.deltaDecorations(
          decorationsRef.current,
          []
        );
      }
      return;
    }

    // 현재 라인 하이라이트 추가
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'current-line-highlight',
            glyphMarginClassName: 'current-line-glyph',
          },
        },
      ]
    );

    // 해당 라인으로 스크롤
    if (scrollToLine) {
      editor.revealLineInCenter(lineNumber);
    }
  }, [editorRef, lineNumber, scrollToLine]);

  return decorationsRef;
}

/**
 * Monaco 에디터 라인 하이라이트 CSS 주입
 * 한 번만 실행됨 (중복 방지)
 */
export function injectMonacoHighlightStyles() {
  if (document.getElementById('monaco-highlight-style')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'monaco-highlight-style';
  style.textContent = `
    .current-line-highlight {
      background-color: rgba(34, 197, 94, 0.15) !important;
      border-left: 3px solid #22c55e !important;
    }
    .current-line-glyph {
      background-color: #22c55e;
      border-radius: 2px;
      margin-left: 3px;
    }
  `;
  document.head.appendChild(style);
}
