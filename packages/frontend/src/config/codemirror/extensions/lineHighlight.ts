/**
 * CodeMirror Line Highlight Extension
 * 특정 라인을 하이라이트하는 기능 (시뮬레이터 현재 실행 라인 표시용)
 */
import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';

/** 하이라이트할 라인을 설정하는 Effect */
export const setHighlightedLine = StateEffect.define<number | null>();

/** 하이라이트 데코레이션 스타일 */
const highlightDecoration = Decoration.line({ class: 'cm-highlighted-line' });

/** 하이라이트된 라인을 관리하는 StateField */
const highlightedLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, tr) {
    // Effect가 있으면 처리
    for (const effect of tr.effects) {
      if (effect.is(setHighlightedLine)) {
        // null이면 하이라이트 제거
        if (effect.value === null) {
          return Decoration.none;
        }
        // 라인 번호가 유효한지 확인
        const lineCount = tr.state.doc.lines;
        if (effect.value < 1 || effect.value > lineCount) {
          return Decoration.none;
        }
        // 해당 라인에 하이라이트 추가
        const line = tr.state.doc.line(effect.value);
        return Decoration.set([highlightDecoration.range(line.from)]);
      }
    }
    // 문서 변경 시 위치 업데이트
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

/** 라인 하이라이트 extension */
export const lineHighlightExtension = highlightedLineField;

/** 라인 하이라이트 테마 (현재 실행 라인 스타일) */
export const lineHighlightTheme = EditorView.baseTheme({
  '.cm-highlighted-line': {
    backgroundColor: 'rgba(34, 197, 94, 0.15) !important',
    borderLeft: '3px solid #22c55e !important',
  },
});
