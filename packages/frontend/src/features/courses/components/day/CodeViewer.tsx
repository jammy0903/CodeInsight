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

  // 테마에 따라 라이트/다크 모드 결정
  const currentTheme = useThemeStore((s) => s.theme);
  const isDark = currentTheme === 'dark';

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
    <div className={cn('font-mono text-sm', isDark ? 'bg-zinc-900' : 'bg-white')}>
      <div className="flex" onMouseUp={handleTextSelect}>
        {/* Line numbers - user-select: none to prevent selection */}
        <div
          className={cn(
            'flex-shrink-0 py-3 px-2 text-right select-none border-r',
            isDark
              ? 'text-zinc-500 border-zinc-700 bg-zinc-800'
              : 'text-gray-400 border-gray-200 bg-gray-50'
          )}
          style={{ userSelect: 'none' }}
        >
          {lines.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'px-2 leading-6',
                highlightLine === idx + 1 && (isDark ? 'text-blue-400 font-bold' : 'text-green-600 font-bold')
              )}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <div className="flex-1 py-3 px-4 overflow-x-auto">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                'leading-6 whitespace-pre',
                highlightLine === idx + 1 && (
                  isDark
                    ? 'bg-blue-900/40 -mx-4 px-4 border-l-2 border-blue-500'
                    : 'bg-green-100 -mx-4 px-4 border-l-2 border-green-500'
                )
              )}
            >
              <HighlightedLine line={line} isLight={!isDark} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple C syntax highlighting
 * isLight: true for light theme (LessonPage), false for dark theme
 */
function HighlightedLine({ line, isLight = false }: { line: string; isLight?: boolean }) {
  // Light theme colors (for white background)
  const lightPatterns: Array<{ regex: RegExp; className: string }> = [
    { regex: /\/\/.*$/, className: 'text-gray-500' },           // Comments
    { regex: /"[^"]*"/, className: 'text-green-600' },          // Strings
    { regex: /\b\d+\b/, className: 'text-purple-600' },         // Numbers
    {
      regex: /\b(int|char|void|return|if|else|for|while|sizeof|malloc|free|NULL|printf|scanf)\b/,
      className: 'text-blue-600 font-medium',                   // Keywords
    },
    { regex: /\b(int|char|void)\s*\*/, className: 'text-cyan-600' }, // Pointer types
    { regex: /[&*](?=\w)/, className: 'text-orange-500' },      // Operators
  ];

  // Dark theme colors (for dark background) - kept for reference
  const darkPatterns: Array<{ regex: RegExp; className: string }> = [
    { regex: /\/\/.*$/, className: 'text-zinc-500' },
    { regex: /"[^"]*"/, className: 'text-green-400' },
    { regex: /\b\d+\b/, className: 'text-purple-400' },
    {
      regex: /\b(int|char|void|return|if|else|for|while|sizeof|malloc|free|NULL|printf|scanf)\b/,
      className: 'text-blue-400',
    },
    { regex: /\b(int|char|void)\s*\*/, className: 'text-cyan-400' },
    { regex: /[&*](?=\w)/, className: 'text-yellow-400' },
  ];

  const patterns = isLight ? lightPatterns : darkPatterns;
  const defaultTextClass = isLight ? 'text-gray-800' : 'text-zinc-100';

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

    for (const { regex, className } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index !== undefined) {
        // Text before match
        if (match.index > 0) {
          elements.push(
            <span key={key++} className={defaultTextClass}>
              {remaining.slice(0, match.index)}
            </span>
          );
        }
        // Matched text
        elements.push(
          <span key={key++} className={className}>
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
        <span key={key++} className={defaultTextClass}>
          {remaining[0]}
        </span>
      );
      remaining = remaining.slice(1);
    }
  }

  return <>{elements}</>;
}
