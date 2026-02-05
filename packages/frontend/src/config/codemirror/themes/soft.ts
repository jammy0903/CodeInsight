/**
 * CodeMirror Soft Theme
 * 라벤더-피치 계열의 부드러운 테마
 */
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const softColors = {
  bg: '#ffffff',
  text: '#6b5a7a',
  cursor: '#a855f7',
  selection: '#e9d5ff80',
  selectionHighlight: '#a855f720',
  lineHighlight: '#faf5ff',
  lineNumberText: '#c4b5d0',
  lineNumberActiveText: '#a855f7',
  bracketMatch: '#e9d5ff50',
  bracketBorder: '#a855f7',
  // 구문 강조
  keyword: '#c026d3',
  string: '#16a34a',
  comment: '#a08eb0',
  number: '#ea580c',
  type: '#db2777',
  function: '#7c3aed',
  variable: '#6b5a7a',
  operator: '#ea580c',
};

export const softTheme = EditorView.theme({
  '&': {
    backgroundColor: softColors.bg,
    color: softColors.text,
  },
  '.cm-content': {
    caretColor: softColors.cursor,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: softColors.cursor,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: softColors.selection,
  },
  '.cm-selectionMatch': {
    backgroundColor: softColors.selectionHighlight,
  },
  '.cm-activeLine': {
    backgroundColor: softColors.lineHighlight,
  },
  '.cm-gutters': {
    backgroundColor: softColors.bg,
    borderRight: 'none',
    color: softColors.lineNumberText,
  },
  '.cm-activeLineGutter': {
    backgroundColor: softColors.lineHighlight,
    color: softColors.lineNumberActiveText,
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: softColors.lineNumberText,
    paddingRight: '12px',
  },
  '.cm-lineNumbers .cm-gutterElement.cm-activeLineGutter': {
    color: softColors.lineNumberActiveText,
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: softColors.bracketMatch,
    outline: `1px solid ${softColors.bracketBorder}`,
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineHeight: '1.6',
  },
});

export const softHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: softColors.keyword, fontWeight: 'bold' },
  { tag: tags.controlKeyword, color: softColors.keyword, fontWeight: 'bold' },
  { tag: tags.moduleKeyword, color: softColors.keyword, fontWeight: 'bold' },
  { tag: tags.operatorKeyword, color: softColors.keyword, fontWeight: 'bold' },
  { tag: tags.string, color: softColors.string },
  { tag: tags.comment, color: softColors.comment, fontStyle: 'italic' },
  { tag: tags.lineComment, color: softColors.comment, fontStyle: 'italic' },
  { tag: tags.blockComment, color: softColors.comment, fontStyle: 'italic' },
  { tag: tags.number, color: softColors.number },
  { tag: tags.integer, color: softColors.number },
  { tag: tags.float, color: softColors.number },
  { tag: tags.typeName, color: softColors.type },
  { tag: tags.className, color: softColors.type },
  { tag: tags.function(tags.variableName), color: softColors.function },
  { tag: tags.function(tags.definition(tags.variableName)), color: softColors.function },
  { tag: tags.variableName, color: softColors.variable },
  { tag: tags.definition(tags.variableName), color: softColors.variable },
  { tag: tags.propertyName, color: softColors.function },
  { tag: tags.operator, color: softColors.operator },
  { tag: tags.arithmeticOperator, color: softColors.operator },
  { tag: tags.logicOperator, color: softColors.operator },
  { tag: tags.compareOperator, color: softColors.operator },
  { tag: tags.punctuation, color: softColors.text },
  { tag: tags.bracket, color: softColors.text },
  { tag: tags.bool, color: softColors.keyword },
  { tag: tags.null, color: softColors.keyword },
  { tag: tags.self, color: softColors.keyword },
]);

export const soft = [softTheme, syntaxHighlighting(softHighlightStyle)];
