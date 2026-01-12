/**
 * TerminalOutput - 프로그램 출력을 보여주는 터미널 뷰 (VSCode 스타일)
 *
 * 모든 언어에서 공통으로 사용:
 * - C: printf(), puts(), fprintf()
 * - JavaScript: console.log()
 * - Python: print()
 * - Java: System.out.println()
 */

import { useEffect, useRef } from 'react';

export interface TerminalLine {
  /** 출력 내용 */
  content: string;
  /** 출력 타입: output=일반, stderr=에러, info=시스템 메시지 */
  type?: 'output' | 'stdout' | 'stderr' | 'info';
}

interface TerminalOutputProps {
  /** 터미널에 표시할 출력 라인들 */
  lines: TerminalLine[];
  /** 터미널 제목 (기본: "Output") */
  title?: string;
  /** 최대 높이 (기본: "120px") */
  maxHeight?: string;
  /** 출력이 없을 때 표시할 메시지 */
  emptyMessage?: string;
  /** 컴팩트 모드 (카드 스타일 없이 본문만) */
  compact?: boolean;
  /** 라인 카운트 표시 */
  showLineCount?: boolean;
}

// 출력 타입별 색상 (VSCode 스타일)
const LINE_COLORS: Record<string, string> = {
  output: '#4ec9b0',   // cyan
  stdout: '#4ec9b0',   // cyan
  stderr: '#f48771',   // red
  info: '#858585',     // gray
};

/**
 * 터미널 출력 컴포넌트 (VSCode 스타일)
 */
export function TerminalOutput({
  lines,
  title = 'Output',
  maxHeight = '120px',
  emptyMessage = 'No output',
  compact = false,
  showLineCount = true,
}: TerminalOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 출력이 추가되면 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines.length]);

  const isEmpty = lines.length === 0;

  // 컴팩트 모드: 본문만 렌더링
  if (compact) {
    return (
      <div
        ref={scrollRef}
        style={{
          padding: '8px 12px',
          maxHeight,
          overflowY: 'auto',
          fontFamily: '"SF Mono", Consolas, "Courier New", monospace',
          fontSize: '12px',
          lineHeight: '1.5',
          backgroundColor: '#1e1e1e',
        }}
      >
        {isEmpty ? (
          <span style={{ color: '#858585', fontStyle: 'italic' }}>{emptyMessage}</span>
        ) : (
          lines.map((line, idx) => (
            <div
              key={idx}
              style={{
                color: LINE_COLORS[line.type || 'output'],
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              <span style={{ color: '#6a9955', marginRight: '8px' }}>❯</span>
              {line.content}
            </div>
          ))
        )}
      </div>
    );
  }

  // 풀 모드: 카드 스타일
  return (
    <div
      style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* 터미널 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 12px',
          backgroundColor: '#252526',
          borderBottom: '1px solid #3c3c3c',
          gap: '8px',
        }}
      >
        {/* 창 버튼 (macOS 스타일) */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27ca41' }} />
        </div>
        <span
          style={{
            fontSize: '11px',
            color: '#9d9d9d',
            fontFamily: 'system-ui, sans-serif',
            marginLeft: '8px',
          }}
        >
          {title}
        </span>
        {showLineCount && !isEmpty && (
          <span
            style={{
              fontSize: '10px',
              color: '#6d6d6d',
              marginLeft: 'auto',
            }}
          >
            {lines.length} line{lines.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* 터미널 본문 */}
      <div
        ref={scrollRef}
        style={{
          padding: '10px 14px',
          maxHeight,
          overflowY: 'auto',
          fontFamily: '"SF Mono", Consolas, "Courier New", monospace',
          fontSize: '12px',
          lineHeight: '1.5',
        }}
      >
        {isEmpty ? (
          <span style={{ color: '#858585', fontStyle: 'italic' }}>{emptyMessage}</span>
        ) : (
          lines.map((line, idx) => (
            <div
              key={idx}
              style={{
                color: LINE_COLORS[line.type || 'output'],
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              <span style={{ color: '#6a9955', marginRight: '8px' }}>❯</span>
              {line.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
