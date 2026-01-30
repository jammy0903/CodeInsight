/**
 * LessonCodeEditor - Monaco 에디터 (읽기 전용)
 * 레슨 페이지용 코드 뷰어 - 편집 불가, 라인 하이라이트, 테마 지원
 */

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { useIsMobile } from '@/hooks';
import { useThemeStore } from '@/stores/themeStore';
import { monacoThemes } from '@/config/themes';

interface CodeSelection {
  text: string;
  lineStart: number;
  lineEnd: number;
  fullLineCode: string;
}

interface LessonCodeEditorProps {
  code: string;
  highlightLine?: number;
  currentLine?: number; // PythonLessonView 호환성
  onSelectionChange?: (selection: CodeSelection) => void;
  language?: 'c' | 'python' | 'java'; // 언어 선택
}

/** Monaco Editor onMount 핸들러 타입 */
type OnMountHandler = (
  editor: monacoEditor.editor.IStandaloneCodeEditor,
  monaco: Monaco
) => void;

export function LessonCodeEditor({
  code,
  highlightLine,
  currentLine,
  onSelectionChange,
  language = 'c' // 기본값: C
}: LessonCodeEditorProps) {
  const isMobile = useIsMobile();
  const currentTheme = useThemeStore((s) => s.theme);

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // 하이라이트할 라인 (currentLine 또는 highlightLine)
  const lineToHighlight = currentLine || highlightLine;

  // 현재 라인 하이라이트 업데이트
  useEffect(() => {
    if (!editorRef.current || !lineToHighlight) {
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
            startLineNumber: lineToHighlight,
            startColumn: 1,
            endLineNumber: lineToHighlight,
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
    editorRef.current.revealLineInCenter(lineToHighlight);
  }, [lineToHighlight]);

  // NOTE: 텍스트 선택 이벤트는 handleEditorMount에서 직접 등록
  // useEffect로 하면 editor mount 전에 실행돼서 등록이 안 됨

  const handleEditorMount: OnMountHandler = (editor, monaco) => {
    console.log('[LessonCodeEditor] Editor mounted!');
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 3가지 테마 등록
    Object.entries(monacoThemes).forEach(([themeName, themeConfig]) => {
      monaco.editor.defineTheme(`codeinsight-${themeName}`, themeConfig);
    });

    // 현재 테마 적용
    monaco.editor.setTheme(`codeinsight-${currentTheme}`);

    // 현재 라인 하이라이트 CSS 주입 (한 번만)
    if (!document.getElementById('monaco-highlight-style')) {
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

    // 텍스트 선택 이벤트 등록 (mount 시점에 바로 등록)
    if (onSelectionChange) {
      console.log('[LessonCodeEditor] 선택 이벤트 리스너 등록 (mount 시)');
      const model = editor.getModel();
      if (model) {
        editor.onDidChangeCursorSelection((e) => {
          const selectedText = model.getValueInRange(e.selection);
          const lineStart = e.selection.startLineNumber;
          const lineEnd = e.selection.endLineNumber;
          const fullLineCode = model.getLineContent(lineStart);

          const codeSelection: CodeSelection = {
            text: selectedText,
            lineStart,
            lineEnd,
            fullLineCode,
          };

          if (selectedText) {
            console.log('[LessonCodeEditor] 선택됨 (mount handler):', codeSelection);
          }

          onSelectionChange(codeSelection);
        });
      }
    }
  };

  // 테마 변경 시 Monaco 테마 업데이트
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(`codeinsight-${currentTheme}`);
    }
  }, [currentTheme]);

  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      onMount={handleEditorMount}
      options={{
        readOnly: true, // 읽기 전용
        minimap: { enabled: false },
        fontSize: isMobile ? 12 : 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: true, // 마지막 줄 아래로 스크롤 가능
        automaticLayout: true,
        tabSize: isMobile ? 2 : 4,
        wordWrap: 'on',
        padding: { top: isMobile ? 8 : 16, bottom: isMobile ? 200 : 300 }, // 하단 여백 증가
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        // 읽기 전용이므로 자동완성 비활성화
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnCommitCharacter: false,
        acceptSuggestionOnEnter: 'off',
        // 모바일에서 폴딩/글리프 마진 숨김
        folding: !isMobile,
        glyphMargin: !isMobile,
        lineNumbersMinChars: isMobile ? 2 : 3,
        // scrollbar 스타일
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: isMobile ? 6 : 8,
          horizontalScrollbarSize: isMobile ? 6 : 8,
          alwaysConsumeMouseWheel: false,
        },
      }}
    />
  );
}
