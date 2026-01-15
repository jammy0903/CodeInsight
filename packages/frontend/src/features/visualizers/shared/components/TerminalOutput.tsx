/**
 * TerminalOutput - STUB
 * TODO: 다른 서버(58.227.56.154)에서 실제 파일 가져온 후 교체
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
}

export function TerminalOutput({
  lines,
  title = '출력',
  emptyMessage = '출력이 없습니다',
}: TerminalOutputProps) {
  return (
    <div
      style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        fontFamily: 'monospace',
        fontSize: '12px',
        padding: '8px 12px',
      }}
    >
      <div style={{ color: '#6a9955', marginBottom: '4px' }}>// {title}</div>
      {lines.length === 0 ? (
        <div style={{ color: '#6a6a6a', fontStyle: 'italic' }}>{emptyMessage}</div>
      ) : (
        lines.map((line, i) => (
          <div
            key={i}
            style={{
              color: line.type === 'error' ? '#f48771' : '#d4d4d4',
            }}
          >
            {line.content}
          </div>
        ))
      )}
    </div>
  );
}
