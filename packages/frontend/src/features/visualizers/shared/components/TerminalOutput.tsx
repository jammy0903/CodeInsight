/**
 * TerminalOutput - 터미널 출력 컴포넌트
 * Flow Visualizer 스타일: 터미널 버튼 + 프롬프트 기호
 */

export interface TerminalLine {
  content: string;
  type: 'output' | 'error' | 'info';
}

interface TerminalOutputProps {
  lines: TerminalLine[];
  title?: string;
  maxHeight?: string;
  emptyMessage?: string;
  compact?: boolean;
  /** 헤더 우측에 표시할 커스텀 콘텐츠 (예: 스텝 네비게이션 버튼) */
  rightContent?: React.ReactNode;
}

export function TerminalOutput({
  lines,
  title = '출력',
  emptyMessage = '출력이 없습니다',
  rightContent,
}: TerminalOutputProps) {

  return (
    <div
      style={{
        background: 'var(--theme-lesson-terminal-bg)',
        fontFamily: 'monospace',
        fontSize: '12px',
        border: '1px solid var(--theme-lesson-panel-border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* 터미널 헤더 - Flow Visualizer 스타일 */}
      <div
        style={{
          background: 'var(--theme-lesson-terminal-header-bg)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderBottom: '1px solid var(--theme-lesson-panel-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 터미널 버튼들 (장식용) */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.6)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.6)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.6)' }} />
          </div>
          <span
            style={{
              color: 'var(--theme-lesson-terminal-text)',
              fontSize: '11px',
              fontWeight: 600,
              opacity: 0.5,
            }}
          >
            {title}
          </span>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
      {/* 터미널 내용 */}
      <div style={{ padding: '12px', color: 'var(--theme-lesson-terminal-text)' }}>
        {lines.length === 0 ? (
          <div style={{ opacity: 0.5, fontStyle: 'italic' }}>{emptyMessage}</div>
        ) : (
          lines.map((line, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'start',
                gap: '8px',
                marginBottom: i < lines.length - 1 ? '4px' : '0',
              }}
            >
              {/* 프롬프트 기호 */}
              <span style={{ opacity: 0.5, userSelect: 'none' }}>
                {line.type === 'error' ? '!' : '>'}
              </span>
              {/* 출력 내용 */}
              <span
                style={{
                  color: line.type === 'error' ? '#ef4444' : 'var(--theme-lesson-terminal-text)',
                  flex: 1,
                }}
              >
                {line.content}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
