/**
 * CodeMirrorEditor - CodeMirror 6 기반 코드 에디터
 * Monaco CodeEditor 대체용 - Playground용 편집 가능 에디터
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { codemirrorThemes } from '@/config/codemirror/themes';
import {
  lineHighlightExtension,
  lineHighlightTheme,
  setHighlightedLine,
} from '@/config/codemirror/extensions/lineHighlight';
import { usePlaygroundStore, useCurrentCode } from '../stores/playgroundStore';
import { useThemeStore } from '@/stores/themeStore';
import { useIsMobile } from '@/hooks';
import type { SupportedLanguage } from '@/types/simulator';

const languageExtensions: Record<SupportedLanguage, () => ReturnType<typeof cpp>> = {
  c: cpp,
  python: python,
  java: java,
  javascript: javascript,
  'python-practical': python,
};

export function CodeMirrorEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isMobile = useIsMobile();
  const currentTheme = useThemeStore((s) => s.theme);
  const { language, setCode, steps, currentStepIndex } = usePlaygroundStore();
  const code = useCurrentCode();

  const currentLine = steps[currentStepIndex]?.line;

  // 테마 확장 (memoized)
  const themeExtension = useMemo(() => {
    return codemirrorThemes[currentTheme] || codemirrorThemes.soft;
  }, [currentTheme]);

  // 폰트 크기 및 모바일 스타일 extension
  const styleExtension = useMemo(() => {
    return EditorView.theme({
      '.cm-content': {
        fontSize: isMobile ? '12px' : '14px',
        padding: isMobile ? '8px 0' : '16px 0',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      '.cm-gutters': {
        minWidth: isMobile ? '24px' : '36px',
      },
    });
  }, [isMobile]);

  // 코드 변경 핸들러 (ref로 관리하여 의존성 문제 해결)
  const setCodeRef = useRef(setCode);
  useEffect(() => {
    setCodeRef.current = setCode;
  }, [setCode]);

  const handleChange = useCallback((update: ViewUpdate) => {
    if (update.docChanged) {
      setCodeRef.current(update.state.doc.toString());
    }
  }, []);

  // 에디터 생성 (language, theme 변경 시 재생성)
  useEffect(() => {
    if (!containerRef.current) return;

    // 기존 에디터가 있으면 현재 코드 저장 후 제거
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const langExtension = languageExtensions[language] || languageExtensions.c;

    const state = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        closeBrackets(),
        indentOnInput(),
        autocompletion(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...closeBracketsKeymap,
          indentWithTab,
        ]),
        langExtension(),
        ...themeExtension,
        styleExtension,
        lineHighlightExtension,
        lineHighlightTheme,
        EditorView.updateListener.of(handleChange),
        // 줄바꿈 설정
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // 초기 하이라이트 적용
    if (currentLine) {
      view.dispatch({
        effects: setHighlightedLine.of(currentLine),
      });
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // NOTE: code를 의존성에 포함하지 않음 - 내부 상태로 관리됨
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, themeExtension, styleExtension, handleChange]);

  // 외부 코드 변경 동기화 (language 변경 등으로 인한 초기 코드 세팅)
  const prevCodeRef = useRef(code);
  useEffect(() => {
    if (viewRef.current) {
      const currentEditorCode = viewRef.current.state.doc.toString();
      // 에디터의 코드와 store의 코드가 다를 때만 업데이트
      // (언어 변경 등 외부 요인으로 인한 코드 변경)
      if (currentEditorCode !== code && prevCodeRef.current !== code) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentEditorCode.length,
            insert: code,
          },
        });
      }
      prevCodeRef.current = code;
    }
  }, [code]);

  // 하이라이트 라인 변경 시 업데이트
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: setHighlightedLine.of(currentLine ?? null),
      });

      // 해당 라인으로 스크롤
      if (currentLine) {
        const lineCount = viewRef.current.state.doc.lines;
        if (currentLine >= 1 && currentLine <= lineCount) {
          const line = viewRef.current.state.doc.line(currentLine);
          viewRef.current.dispatch({
            effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
          });
        }
      }
    }
  }, [currentLine]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: '100px' }}
    />
  );
}
