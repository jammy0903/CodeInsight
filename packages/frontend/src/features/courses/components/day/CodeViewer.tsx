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
import type { CodeSelection } from '../../types';

interface CodeViewerProps {
  code: string;
  highlightLine?: number;
  explanation?: string;
  stepIndex?: number;
  onSelectionChange?: (selection: CodeSelection) => void;
}

const MIN_LINES = 15;

export function CodeViewer({ code, highlightLine, onSelectionChange }: CodeViewerProps) {
  const codeLines = code.split('\n');
  // 최소 15줄 보장 (빈 줄로 패딩)
  const lines = codeLines.length < MIN_LINES
    ? [...codeLines, ...Array(MIN_LINES - codeLines.length).fill('')]
    : codeLines;

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
    <div className="bg-zinc-900 font-mono text-sm">
      <div className="flex" onMouseUp={handleTextSelect}>
        {/* 라인 번호 - user-select: none으로 선택 방지 */}
        <div
          className="flex-shrink-0 py-3 px-2 text-right text-zinc-500 select-none border-r border-zinc-700 bg-zinc-950"
          style={{ userSelect: 'none' }}
        >
          {lines.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'px-2 leading-6',
                highlightLine === idx + 1 && 'text-yellow-400 font-bold'
              )}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        {/* 코드 */}
        <div className="flex-1 py-3 px-4 overflow-x-auto">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                'leading-6 whitespace-pre',
                highlightLine === idx + 1 &&
                  'bg-yellow-400/20 -mx-4 px-4 border-l-2 border-yellow-400'
              )}
            >
              <HighlightedLine line={line} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 C 구문 강조
 */
function HighlightedLine({ line }: { line: string }) {
  // 기본적인 토큰 패턴
  const patterns: Array<{ regex: RegExp; className: string }> = [
    // 주석
    { regex: /\/\/.*$/, className: 'text-zinc-500' },
    // 문자열
    { regex: /"[^"]*"/, className: 'text-green-400' },
    // 숫자
    { regex: /\b\d+\b/, className: 'text-purple-400' },
    // 키워드
    {
      regex: /\b(int|char|void|return|if|else|for|while|sizeof|malloc|free|NULL|printf|scanf)\b/,
      className: 'text-blue-400',
    },
    // 타입/포인터
    { regex: /\b(int|char|void)\s*\*/, className: 'text-cyan-400' },
    // 연산자
    { regex: /[&*](?=\w)/, className: 'text-yellow-400' },
  ];

  // 빈 줄 처리
  if (line.trim() === '') {
    return <span>&nbsp;</span>;
  }

  // 간단한 토큰화 (첫 번째 매칭만)
  let elements: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    let matched = false;

    for (const { regex, className } of patterns) {
      const match = remaining.match(regex);
      if (match && match.index !== undefined) {
        // 매칭 전 텍스트
        if (match.index > 0) {
          elements.push(
            <span key={key++} className="text-zinc-100">
              {remaining.slice(0, match.index)}
            </span>
          );
        }
        // 매칭된 텍스트
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
      // 매칭 없으면 한 문자씩 진행
      elements.push(
        <span key={key++} className="text-zinc-100">
          {remaining[0]}
        </span>
      );
      remaining = remaining.slice(1);
    }
  }

  return <>{elements}</>;
}
