/**
 * CodeMirror Dark Theme
 * 사이버펑크 스타일의 어두운 테마 (zinc + cyan 악센트)
 */
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const darkColors = {
  bg: '#09090b',           // zinc-950
  text: '#fafafa',         // zinc-50
  cursor: '#22d3ee',       // cyan-400
  selection: '#22d3ee40',
  selectionHighlight: '#22d3ee20',
  lineHighlight: '#18181b', // zinc-900
  lineNumberText: '#52525b', // zinc-600
  lineNumberActiveText: '#22d3ee', // cyan-400
  bracketMatch: '#22d3ee30',
  bracketBorder: '#22d3ee',
  // 구문 강조 - 네온 컬러
  keyword: '#22d3ee',      // cyan-400
  string: '#4ade80',       // green-400
  comment: '#71717a',      // zinc-500
  number: '#f472b6',       // pink-400
  type: '#a78bfa',         // violet-400
  function: '#fbbf24',     // amber-400
  variable: '#e4e4e7',     // zinc-200
  operator: '#f472b6',     // pink-400
};

export const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: darkColors.bg,
    color: darkColors.text,
  },
  '.cm-content': {
    caretColor: darkColors.cursor,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: darkColors.cursor,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: darkColors.selection,
  },
  '.cm-selectionMatch': {
    backgroundColor: darkColors.selectionHighlight,
  },
  '.cm-activeLine': {
    backgroundColor: darkColors.lineHighlight,
  },
  '.cm-gutters': {
    backgroundColor: darkColors.bg,
    borderRight: 'none',
    color: darkColors.lineNumberText,
  },
  '.cm-activeLineGutter': {
    backgroundColor: darkColors.lineHighlight,
    color: darkColors.lineNumberActiveText,
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: darkColors.lineNumberText,
    paddingRight: '12px',
  },
  '.cm-lineNumbers .cm-gutterElement.cm-activeLineGutter': {
    color: darkColors.lineNumberActiveText,
  },
  '&.cm-focused .cm-matchingBracket': {
    backgroundColor: darkColors.bracketMatch,
    outline: `1px solid ${darkColors.bracketBorder}`,
  },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineHeight: '1.6',
  },
});

export const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: darkColors.keyword, fontWeight: 'bold' },
  { tag: tags.controlKeyword, color: darkColors.keyword, fontWeight: 'bold' },
  { tag: tags.moduleKeyword, color: darkColors.keyword, fontWeight: 'bold' },
  { tag: tags.operatorKeyword, color: darkColors.keyword, fontWeight: 'bold' },
  { tag: tags.string, color: darkColors.string },
  { tag: tags.comment, color: darkColors.comment, fontStyle: 'italic' },
  { tag: tags.lineComment, color: darkColors.comment, fontStyle: 'italic' },
  { tag: tags.blockComment, color: darkColors.comment, fontStyle: 'italic' },
  { tag: tags.number, color: darkColors.number },
  { tag: tags.integer, color: darkColors.number },
  { tag: tags.float, color: darkColors.number },
  { tag: tags.typeName, color: darkColors.type },
  { tag: tags.className, color: darkColors.type },
  { tag: tags.function(tags.variableName), color: darkColors.function },
  { tag: tags.function(tags.definition(tags.variableName)), color: darkColors.function },
  { tag: tags.variableName, color: darkColors.variable },
  { tag: tags.definition(tags.variableName), color: darkColors.variable },
  { tag: tags.propertyName, color: darkColors.function },
  { tag: tags.operator, color: darkColors.operator },
  { tag: tags.arithmeticOperator, color: darkColors.operator },
  { tag: tags.logicOperator, color: darkColors.operator },
  { tag: tags.compareOperator, color: darkColors.operator },
  { tag: tags.punctuation, color: darkColors.text },
  { tag: tags.bracket, color: darkColors.text },
  { tag: tags.bool, color: darkColors.keyword },
  { tag: tags.null, color: darkColors.keyword },
  { tag: tags.self, color: darkColors.keyword },
]);

export const dark = [darkTheme, syntaxHighlighting(darkHighlightStyle)];
