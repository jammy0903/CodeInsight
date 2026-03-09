/**
 * CodeMirrorEditor - Unified CodeMirror 6 editor
 *
 * editable=false (Lesson): Read-only code viewer with line highlight & selection
 * editable=true  (Playground): Full editor with history, autocompletion, etc.
 */

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, keymap, type ViewUpdate } from '@codemirror/view';
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
import { useThemeStore } from '@/stores/themeStore';
import { useIsMobile } from '@/hooks';
import type { SupportedLanguage } from '@/types/simulator';

export interface CodeSelection {
  text: string;
  lineStart: number;
  lineEnd: number;
  fullLineCode: string;
}

interface CodeMirrorEditorProps {
  code: string;
  language?: SupportedLanguage;
  highlightLine?: number;
  pointerLine?: number;
  editable?: boolean;
  onChange?: (code: string) => void;
  onSelectionChange?: (sel: CodeSelection) => void;
  bottomPadding?: number;
  mobileFontSizeOffset?: number;
  className?: string;
}

const languageExtensions: Record<string, () => ReturnType<typeof cpp>> = {
  c: cpp,
  cpp: cpp,
  python: python,
  java: java,
  javascript: javascript,
  'python-practical': python,
};

export function CodeMirrorEditor({
  code,
  language = 'c',
  highlightLine,
  pointerLine,
  editable = false,
  onChange,
  onSelectionChange,
  bottomPadding = 0,
  mobileFontSizeOffset = 0,
  className = '',
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const currentTheme = useThemeStore((s) => s.theme);
  const isMobile = useIsMobile();

  // Theme extension (memoized)
  const themeExtension = useMemo(() => {
    return codemirrorThemes[currentTheme] || codemirrorThemes.soft;
  }, [currentTheme]);

  // Font size & style extension (shared across editable / read-only)
  const styleExtension = useMemo(() => {
    const mobileContentMin = 10 + mobileFontSizeOffset;
    const mobileContentMax = 12 + mobileFontSizeOffset;
    return EditorView.theme({
      '.cm-content': {
        fontSize: isMobile
          ? `clamp(${mobileContentMin}px, 2.5vw, ${mobileContentMax}px)`
          : 'clamp(11px, 1.2vw, 14px)',
        padding: isMobile ? '3px 0' : '5px 0',
      },
      '.cm-scroller': { overflowX: 'hidden', overflowY: 'auto' },
      '.cm-gutters': {
        minWidth: isMobile ? '24px' : '36px',
        fontSize: isMobile ? 'clamp(9px, 2vw, 11px)' : 'clamp(10px, 1vw, 12px)',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: pointerLine ? '4.2em' : undefined,
        textAlign: pointerLine ? 'left' : undefined,
        whiteSpace: 'pre',
        overflow: 'visible',
      },
    });
  }, [isMobile, mobileFontSizeOffset, pointerLine]);

  // Bottom padding extension (for terminal overlay clearance)
  const bottomPaddingExtension = useMemo(() => {
    return EditorView.theme({
      '.cm-content': {
        paddingBottom: bottomPadding > 0 ? `${bottomPadding}px` : '0',
      },
    });
  }, [bottomPadding]);

  // onChange ref to avoid re-creating editor on handler change
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const handleChange = useCallback((update: ViewUpdate) => {
    if (update.docChanged && onChangeRef.current) {
      onChangeRef.current(update.state.doc.toString());
    }
  }, []);

  // Build extensions list
  const extensions = useMemo(() => {
    const langExtension = languageExtensions[language] || languageExtensions.c;
    const exts = [
      lineNumbers({
        formatNumber: (lineNo) => (pointerLine && lineNo === pointerLine ? `▶ ${lineNo}` : String(lineNo)),
      }),
      langExtension(),
      ...themeExtension,
      styleExtension,
      bottomPaddingExtension,
      lineHighlightExtension,
      lineHighlightTheme,
      EditorView.lineWrapping,
    ];

    if (editable) {
      // Editable mode: full editing capabilities
      exts.push(
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
        EditorView.updateListener.of(handleChange),
      );
    } else {
      // Read-only mode
      exts.push(EditorState.readOnly.of(true));
      // Selection listener for read-only (e.g. AI explanation of selected code)
      if (onSelectionChange) {
        exts.push(
          EditorView.updateListener.of((update) => {
            if (update.selectionSet) {
              const selection = update.state.selection.main;
              if (selection.from !== selection.to) {
                const doc = update.state.doc;
                const text = doc.sliceString(selection.from, selection.to);
                const lineStart = doc.lineAt(selection.from).number;
                const lineEnd = doc.lineAt(selection.to).number;
                const fullLineCode = doc.line(lineStart).text;
                onSelectionChange({ text, lineStart, lineEnd, fullLineCode });
              }
            }
          }),
        );
      }
    }

    return exts;
    // NOTE: onSelectionChange is intentionally excluded for read-only to avoid
    // unnecessary re-creation; it's captured via closure at creation time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, themeExtension, styleExtension, bottomPaddingExtension, editable, handleChange, pointerLine]);

  // Create editor
  useEffect(() => {
    if (!containerRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: code,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // Initial highlight
    if (highlightLine) {
      view.dispatch({ effects: setHighlightedLine.of(highlightLine) });
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // For editable mode, code is NOT in deps (internal state).
    // For read-only mode, code IS in deps (external control).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, editable ? [extensions] : [code, extensions]);

  // External code sync for editable mode (language switch etc.)
  const prevCodeRef = useRef(code);
  useEffect(() => {
    if (!editable || !viewRef.current) return;
    const currentEditorCode = viewRef.current.state.doc.toString();
    if (currentEditorCode !== code && prevCodeRef.current !== code) {
      viewRef.current.dispatch({
        changes: { from: 0, to: currentEditorCode.length, insert: code },
      });
    }
    prevCodeRef.current = code;
  }, [code, editable]);

  // Highlight line changes
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: setHighlightedLine.of(highlightLine ?? null),
    });
    if (highlightLine) {
      const lineCount = viewRef.current.state.doc.lines;
      if (highlightLine >= 1 && highlightLine <= lineCount) {
        const line = viewRef.current.state.doc.line(highlightLine);
        viewRef.current.dispatch({
          effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
        });
      }
    }
  }, [highlightLine]);

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ minHeight: '100px' }}
    />
  );
}
