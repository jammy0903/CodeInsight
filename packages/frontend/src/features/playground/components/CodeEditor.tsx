/**
 * CodeEditor - Monaco 에디터
 * 코드 편집 + 라이트 테마 + 현재 실행 줄 하이라이트
 * 반응형 지원 (모바일에서 폰트 크기 축소)
 */

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import { usePlaygroundStore, useCurrentCode } from '../stores/playgroundStore';
import { useIsMobile, useMonacoLineHighlight, injectMonacoHighlightStyles } from '@/hooks';
import { useThemeStore } from '@/stores/themeStore';
import { monacoThemes } from '@/config/themes';
import type { SupportedLanguage } from '@/types/simulator';

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
  javascript: 'javascript',
  'python-practical': 'python',
};

export function CodeEditor() {
  const isMobile = useIsMobile();
  const currentTheme = useThemeStore((s) => s.theme);
  const { language, setCode, steps, currentStepIndex } = usePlaygroundStore();
  const code = useCurrentCode();

  const currentLine = steps[currentStepIndex]?.line;
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // 라인 하이라이트 훅 사용 (중복 코드 제거)
  useMonacoLineHighlight({ editorRef, lineNumber: currentLine });

  const handleEditorMount: OnMountHandler = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 3가지 테마 등록
    Object.entries(monacoThemes).forEach(([themeName, themeConfig]) => {
      monaco.editor.defineTheme(`codeinsight-${themeName}`, themeConfig);
    });

    // 현재 테마 적용
    monaco.editor.setTheme(`codeinsight-${currentTheme}`);

    // 현재 라인 하이라이트 CSS 주입 (공용 유틸리티 사용)
    injectMonacoHighlightStyles();
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
      language={MONACO_LANGUAGES[language]}
      value={code}
      onChange={(value) => setCode(value || '')}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: isMobile ? 12 : 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: isMobile ? 2 : 4,
        wordWrap: 'on',
        padding: { top: isMobile ? 8 : 16, bottom: isMobile ? 8 : 16 },
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        // 자동 괄호 닫기
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'languageDefined',
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
          alwaysConsumeMouseWheel: false, // 스크롤 끝에서 부모로 전파
        },
      }}
    />
  );
}
