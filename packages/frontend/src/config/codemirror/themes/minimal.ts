/**
 * CodeMirror Minimal Theme
 * 브라운-베이지 계열의 중성적 미니멀 테마
 */
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const minimalColors = {
  bg: '#ffffff',
  text: '#5c534a',
  cursor: '#a08060',
  selection: '#e5d5c780',
  selectionHighlight: '#a0806020',
  lineHighlight: '#f5f3f0',
  lineNumberText: '#c9c2b8',
  lineNumberActiveText: '#a08060',
  bracketMatch: '#e5d5c750',
  bracketBorder: '#a08060',
  // 구문 강조 - 브라운 계열
  keyword: '#78716c',
  string: '#7c6f5e',
  comment: '#8a8279',
  number: '#a1887f',
  type: '#8d6e63',
  function: '#6b5a4a',
  variable: '#5c534a',
  operator: '#a1887f',
};

export const minimalTheme = EditorView.theme({
  '&': {
    backgroundColor: minimalColors.bg,
    color: minimalColors.text,
  },
  '.cm-content': {
    caretColor: minimalColors.cursor,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: minimalColors.cursor,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: minimalColors.selection,
  },
  '.cm-selectionMatch': {
    backgroundColor: minimalColors.selectionHighlight,
  },
  '.cm-activeLine': {
    backgroundColor: minimalColors.lineHighlight,
  },
  '.cm-gutters': {
    backgroundColor: minimalColors.bg,
    borderRight: 'none',
    color: minimalColors.lineNumberText,
  },
  '.cm-activeLineGutter': {
    backgroundColor: minimalColors.lineHighlight,
    color: minimalColors.lineNumberActiveText,
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: minimalColors.lineNumberText,
    paddingRight: '12px',
  },
  '.cm-lineNumbers .cm-gutterElement.cm-activeLineGutter': {
    color: minimalColors.lineNumberActiveText,
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: minimalColors.bracketMatch,
    outline: `1px solid ${minimalColors.bracketBorder}`,
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineHeight: '1.6',
  },
});

export const minimalHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: minimalColors.keyword, fontWeight: 'bold' },
  { tag: tags.controlKeyword, color: minimalColors.keyword, fontWeight: 'bold' },
  { tag: tags.moduleKeyword, color: minimalColors.keyword, fontWeight: 'bold' },
  { tag: tags.operatorKeyword, color: minimalColors.keyword, fontWeight: 'bold' },
  { tag: tags.string, color: minimalColors.string },
  { tag: tags.comment, color: minimalColors.comment, fontStyle: 'italic' },
  { tag: tags.lineComment, color: minimalColors.comment, fontStyle: 'italic' },
  { tag: tags.blockComment, color: minimalColors.comment, fontStyle: 'italic' },
  { tag: tags.number, color: minimalColors.number },
  { tag: tags.integer, color: minimalColors.number },
  { tag: tags.float, color: minimalColors.number },
  { tag: tags.typeName, color: minimalColors.type },
  { tag: tags.className, color: minimalColors.type },
  { tag: tags.function(tags.variableName), color: minimalColors.function },
  { tag: tags.function(tags.definition(tags.variableName)), color: minimalColors.function },
  { tag: tags.variableName, color: minimalColors.variable },
  { tag: tags.definition(tags.variableName), color: minimalColors.variable },
  { tag: tags.propertyName, color: minimalColors.function },
  { tag: tags.operator, color: minimalColors.operator },
  { tag: tags.arithmeticOperator, color: minimalColors.operator },
  { tag: tags.logicOperator, color: minimalColors.operator },
  { tag: tags.compareOperator, color: minimalColors.operator },
  { tag: tags.punctuation, color: minimalColors.text },
  { tag: tags.bracket, color: minimalColors.text },
  { tag: tags.bool, color: minimalColors.keyword },
  { tag: tags.null, color: minimalColors.keyword },
  { tag: tags.self, color: minimalColors.keyword },
]);

export const minimal = [minimalTheme, syntaxHighlighting(minimalHighlightStyle)];
