/**
 * CodeViewer - 읽기 전용 코드 뷰어 + 라인 하이라이트
 *
 * WHY: Monaco Editor 설치 없이 간단한 코드 표시.
 *      학습용이므로 편집 기능 불필요.
 * TRADEOFF: 구문 강조 없음 < 의존성 최소화.
 * REVISIT: 구문 강조 필요 시 highlight.js 또는 prism.js 추가.
 */

import { cn } from '@/lib/utils';

interface CodeViewerProps {
  code: string;
  highlightLine?: number;
  language?: string;
}

export function CodeViewer({ code, highlightLine }: CodeViewerProps) {
  const lines = code.split('\n');

  return (
    <div className="h-full rounded-lg border bg-zinc-900 overflow-auto font-mono text-sm">
      <div className="flex">
        {/* 라인 번호 */}
        <div className="flex-shrink-0 py-3 px-2 text-right text-zinc-500 select-none border-r border-zinc-700 bg-zinc-950">
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
  let highlighted = line;
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
