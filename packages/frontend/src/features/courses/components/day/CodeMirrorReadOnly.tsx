/**
 * CodeMirrorReadOnly - CodeMirror 6 기반 읽기 전용 에디터
 * LessonCodeEditor 대체용 - 레슨 페이지용 코드 뷰어
 */

import { useEffect, useRef, useMemo } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
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
import { useThemeStore } from '@/stores/themeStore';
import { useIsMobile } from '@/hooks';

interface CodeSelection {
  text: string;
  lineStart: number;
  lineEnd: number;
  fullLineCode: string;
}

interface CodeMirrorReadOnlyProps {
  code: string;
  highlightLine?: number;
  currentLine?: number; // PythonLessonView 호환성
  onSelectionChange?: (selection: CodeSelection) => void;
  language?: 'c' | 'python' | 'java' | 'javascript';
  className?: string;
  bottomPadding?: number;
}

const languageExtensions = {
  c: cpp,
  python: python,
  java: java,
  javascript: javascript,
};

export function CodeMirrorReadOnly({
  code,
  highlightLine,
  currentLine,
  onSelectionChange,
  language = 'c',
  className = '',
  bottomPadding = 0,
}: CodeMirrorReadOnlyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const currentTheme = useThemeStore((s) => s.theme);
  const isMobile = useIsMobile();

  // 하이라이트할 라인 (currentLine 또는 highlightLine)
  const lineToHighlight = currentLine || highlightLine;

  // 테마 확장 (memoized)
  const themeExtension = useMemo(() => {
    return codemirrorThemes[currentTheme] || codemirrorThemes.soft;
  }, [currentTheme]);

  // 폰트 크기 extension - 화면 크기에 따라 유연하게 조절
  // clamp(최소, 선호, 최대): 뷰포트 너비에 비례하되 범위 내로 제한
  const fontSizeExtension = useMemo(() => {
    return EditorView.theme({
      '.cm-content': {
        // 모바일: 10px~12px, 데스크탑: 11px~14px 범위로 뷰포트에 따라 조절
        fontSize: isMobile ? 'clamp(10px, 2.5vw, 12px)' : 'clamp(11px, 1.2vw, 14px)',
        padding: isMobile ? '8px 0' : '16px 0',
      },
      '.cm-scroller': {
        overflowX: 'hidden', // 가로 스크롤 숨김
        overflowY: 'auto',   // 세로 스크롤만 허용
      },
      '.cm-gutters': {
        minWidth: isMobile ? '24px' : '36px',
        fontSize: isMobile ? 'clamp(9px, 2vw, 11px)' : 'clamp(10px, 1vw, 12px)',
      },
    });
  }, [isMobile]);

  // 하단 여백 extension — 터미널 오버레이에 가려지지 않도록 스크롤 여유 확보
  const bottomPaddingExtension = useMemo(() => {
    return EditorView.theme({
      '.cm-content': {
        paddingBottom: bottomPadding > 0 ? `${bottomPadding}px` : '0',
      },
    });
  }, [bottomPadding]);

  // 에디터 생성 (code, language, theme 변경 시 재생성)
  useEffect(() => {
    if (!containerRef.current) return;

    // 기존 에디터 제거
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const langExtension = languageExtensions[language] || languageExtensions.c;

    const state = EditorState.create({
      doc: code,
      extensions: [
        EditorState.readOnly.of(true),
        lineNumbers(),
        EditorView.lineWrapping, // 긴 줄 자동 줄바꿈 (가로 스크롤 방지)
        langExtension(),
        ...themeExtension,
        fontSizeExtension,
        bottomPaddingExtension,
        lineHighlightExtension,
        lineHighlightTheme,
        // 선택 이벤트 리스너
        EditorView.updateListener.of((update) => {
          if (onSelectionChange && update.selectionSet) {
            const selection = update.state.selection.main;
            if (selection.from !== selection.to) {
              const doc = update.state.doc;
              const text = doc.sliceString(selection.from, selection.to);
              const lineStart = doc.lineAt(selection.from).number;
              const lineEnd = doc.lineAt(selection.to).number;
              const fullLineCode = doc.line(lineStart).text;

              onSelectionChange({
                text,
                lineStart,
                lineEnd,
                fullLineCode,
              });
            }
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // 초기 하이라이트 적용
    if (lineToHighlight) {
      view.dispatch({
        effects: setHighlightedLine.of(lineToHighlight),
      });
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [code, language, themeExtension, fontSizeExtension, bottomPaddingExtension, onSelectionChange]);

  // 하이라이트 라인 변경 시 업데이트
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: setHighlightedLine.of(lineToHighlight ?? null),
      });

      // 해당 라인으로 스크롤
      if (lineToHighlight) {
        const lineCount = viewRef.current.state.doc.lines;
        if (lineToHighlight >= 1 && lineToHighlight <= lineCount) {
          const line = viewRef.current.state.doc.line(lineToHighlight);
          viewRef.current.dispatch({
            effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
          });
        }
      }
    }
  }, [lineToHighlight]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ minHeight: '100px' }}
    />
  );
}
