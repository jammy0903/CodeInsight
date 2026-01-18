/**
 * CodeViewer - 읽기 전용 코드 뷰어 + 라인 하이라이트 + 텍스트 선택
 *
 * WHY: Monaco Editor 설치 없이 간단한 코드 표시.
 *      학습용이므로 편집 기능 불필요.
 * TRADEOFF: 구문 강조 없음 < 의존성 최소화.
 * REVISIT: 구문 강조 필요 시 highlight.js 또는 prism.js 추가.
 *
 * 텍스트 선택: window.getSelection()으로 사용자가 드래그한 코드 감지
 * WHY: AI 채팅에 정확한 컨텍스트 전달 (특정 단어/라인)
 */

import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/themeStore';
import { codeViewerColors } from '@/config/themes';
import type { CodeSelection } from '../../types';

interface CodeViewerProps {
  code: string;
  highlightLine?: number;
  explanation?: string;
  stepIndex?: number;
  onSelectionChange?: (selection: CodeSelection) => void;
}

export function CodeViewer({ code, highlightLine, onSelectionChange }: CodeViewerProps) {
  // 외부 컨테이너에서 높이 제어 (10줄 고정 + 스크롤)
  const lines = code.split('\n');

  // 현재 테마의 색상 가져오기
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = codeViewerColors[currentTheme];

  /**
   * 텍스트 선택 핸들러
   * WHY: user-select:none이 적용된 라인 번호를 제외한 순수 코드만 선택
   */
  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.toString().trim() === '') return;

    const selectedText = sel.toString().trim();

    // 간단한 라인 계산 (현재 하이라이트된 라인 사용)
    // TODO: 정확한 라인 범위 계산 필요 시 개선
    const lineStart = highlightLine ?? 1;
    const lineEnd = highlightLine ?? 1;
    const fullLineCode = lines[lineStart - 1] ?? '';

    onSelectionChange?.({
      text: selectedText,
      lineStart,
      lineEnd,
      fullLineCode,
    });
  };

  return (
    <div
      className="font-mono text-[10px] sm:text-xs md:text-sm lg:text-base"
      style={{ backgroundColor: colors.bg }}
    >
      <div className="flex" onMouseUp={handleTextSelect}>
        {/* Line numbers - user-select: none to prevent selection */}
        <div
          className="flex-shrink-0 py-2 sm:py-3 px-1 sm:px-2 text-right select-none border-r"
          style={{
            userSelect: 'none',
            backgroundColor: colors.lineNumberBg,
            borderColor: colors.lineNumberBorder,
            color: colors.lineNumberText,
          }}
        >
          {lines.map((_, idx) => (
            <div
              key={idx}
              className="px-1 sm:px-2 leading-5 sm:leading-6"
              style={{
                color: highlightLine === idx + 1 ? colors.lineNumberActive : undefined,
                fontWeight: highlightLine === idx + 1 ? 'bold' : undefined,
              }}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <div className="flex-1 py-2 sm:py-3 px-2 sm:px-4 overflow-x-auto">
          {lines.map((line, idx) => {
            const isHighlighted = highlightLine === idx + 1;
            return (
              <div
                key={idx}
                className="leading-5 sm:leading-6 whitespace-pre"
                style={
                  isHighlighted
                    ? {
                        backgroundColor: colors.highlightBg,
                        marginLeft: '-0.5rem',
                        marginRight: '-1rem',
                        paddingLeft: '0.5rem',
                        paddingRight: '1rem',
                        borderLeft: `2px solid ${colors.highlightBorder}`,
                      }
                    : undefined
                }
              >
                <HighlightedLine line={line} colors={colors} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple C syntax highlighting
 * colors: 현재 테마의 색상 객체
 */
function HighlightedLine({ line, colors }: { line: string; colors: import('@/config/themes').CodeViewerColors }) {
  // 구문 패턴 정의
  const patterns: Array<{ regex: RegExp; color: string; fontWeight?: string }> = [
    { regex: /\/\/.*$/, color: colors.comment },                // Comments
    { regex: /"[^"]*"/, color: colors.string },                 // Strings
    { regex: /\b\d+\b/, color: colors.number },                 // Numbers
    {
      regex: /\b(int|char|void|return|if|else|for|while|sizeof|malloc|free|NULL|printf|scanf)\b/,
      color: colors.keyword,
      fontWeight: '600',                                        // Keywords (bold)
    },
    { regex: /\b(int|char|void)\s*\*/, color: colors.type },   // Pointer types
    { regex: /[&*](?=\w)/, color: colors.operator },           // Operators
  ];

  // Empty line handling
  if (line.trim() === '') {
    return <span>&nbsp;</span>;
  }

  // Simple tokenization (first match only)
  let elements: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, color, fontWeight } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index !== undefined) {
        // Text before match
        if (match.index > 0) {
          elements.push(
            <span key={key++} style={{ color: colors.text }}>
              {remaining.slice(0, match.index)}
            </span>
          );
        }
        // Matched text
        elements.push(
          <span key={key++} style={{ color, fontWeight }}>
            {match[0]}
          </span>
        );
        remaining = remaining.slice(match.index + match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No match, advance one character
      elements.push(
        <span key={key++} style={{ color: colors.text }}>
          {remaining[0]}
        </span>
      );
      remaining = remaining.slice(1);
    }
  }

  return <>{elements}</>;
}
