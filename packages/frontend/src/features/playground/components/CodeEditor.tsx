/**
 * CodeEditor - Monaco 에디터
 * 코드 편집 + 라이트 테마 + 현재 실행 줄 하이라이트
 */

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { usePlaygroundStore, useCurrentCode } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

/** Monaco Editor onMount 핸들러 타입 */
type OnMountHandler = (
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: Monaco
) => void;

/** 언어별 Monaco 언어 ID */
const MONACO_LANGUAGES: Record<SupportedLanguage, string> = {
  c: 'c',
  python: 'python',
  java: 'java',
};

export function CodeEditor() {
  const { language, setCode, steps, currentStepIndex } = usePlaygroundStore();
  const code = useCurrentCode();

  const currentLine = steps[currentStepIndex]?.line;
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // 현재 라인 하이라이트 업데이트
  useEffect(() => {
    if (!editorRef.current || !currentLine) {
      // 라인 없으면 데코레이션 제거
      if (editorRef.current && decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(
          decorationsRef.current,
          []
        );
      }
      return;
    }

    // 현재 라인 하이라이트 추가
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: {
            startLineNumber: currentLine,
            startColumn: 1,
            endLineNumber: currentLine,
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
    editorRef.current.revealLineInCenter(currentLine);
  }, [currentLine]);

  const handleEditorMount: OnMountHandler = (editor, monaco) => {
    // 에디터 레퍼런스 저장
    editorRef.current = editor;

    // 라이트 테마 정의
    monaco.editor.defineTheme('codeinsight-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'dc2626' },
        { token: 'string', foreground: '16a34a' },
        { token: 'number', foreground: '2563eb' },
        { token: 'type', foreground: 'ea580c' },
        { token: 'function', foreground: '7c3aed' },
        { token: 'variable', foreground: 'ea580c' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1f2937',
        'editor.lineHighlightBackground': '#f3f4f6',
        'editor.selectionBackground': '#bfdbfe80',
        'editorCursor.foreground': '#22c55e',
        'editorLineNumber.foreground': '#9ca3af',
        'editorLineNumber.activeForeground': '#374151',
        'editor.selectionHighlightBackground': '#22c55e20',
        'editorBracketMatch.background': '#22c55e30',
        'editorBracketMatch.border': '#22c55e',
      },
    });
    monaco.editor.setTheme('codeinsight-light');

    // 현재 라인 하이라이트 CSS 주입
    const style = document.createElement('style');
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
  };

  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGES[language]}
      value={code}
      onChange={(value) => setCode(value || '')}
      theme="vs"
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        // 자동 괄호 닫기
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'languageDefined',
        // scrollbar 스타일
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          alwaysConsumeMouseWheel: false, // 스크롤 끝에서 부모로 전파
        },
      }}
    />
  );
}
