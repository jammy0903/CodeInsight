/**
 * CodeEditor - Monaco 에디터 래퍼
 * 다크 테마 + 현재 줄 하이라이트
 */

import Editor from '@monaco-editor/react';
import { usePlaygroundStore, useCurrentCode } from '../stores/playgroundStore';
import type { SupportedLanguage } from '@/types';

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

  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGES[language]}
      value={code}
      onChange={(value) => setCode(value || '')}
      theme="vs-dark"
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
        // 배경 투명하게 (부모 배경 사용)
        // scrollbar 스타일
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
      onMount={(editor, monaco) => {
        // 커스텀 테마 정의
        monaco.editor.defineTheme('codeinsight-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
            { token: 'keyword', foreground: 'ff7b72' },
            { token: 'string', foreground: 'a5d6ff' },
            { token: 'number', foreground: '79c0ff' },
            { token: 'type', foreground: 'ffa657' },
            { token: 'function', foreground: 'd2a8ff' },
            { token: 'variable', foreground: 'ffa657' },
          ],
          colors: {
            'editor.background': '#0d1117',
            'editor.foreground': '#c9d1d9',
            'editor.lineHighlightBackground': '#161b2280',
            'editor.selectionBackground': '#264f7840',
            'editorCursor.foreground': '#58a6ff',
            'editorLineNumber.foreground': '#484f58',
            'editorLineNumber.activeForeground': '#8b949e',
            'editor.selectionHighlightBackground': '#3fb95020',
            'editorBracketMatch.background': '#58a6ff30',
            'editorBracketMatch.border': '#58a6ff',
          },
        });
        monaco.editor.setTheme('codeinsight-dark');
      }}
    />
  );
}
