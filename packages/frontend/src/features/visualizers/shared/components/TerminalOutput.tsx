/**
 * TerminalOutput - 터미널 출력 컴포넌트
 * 테마 지원 추가
 */

import { useThemeStore } from '@/stores/themeStore';
import { themes } from '@/config/themes';

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
  const currentTheme = useThemeStore((s) => s.theme);
  const themeColors = themes[currentTheme].lesson;

  return (
    <div
      style={{
        background: themeColors.terminalBg,
        fontFamily: 'monospace',
        fontSize: '12px',
      }}
    >
      {/* 터미널 헤더 */}
      <div
        style={{
          background: themeColors.terminalHeaderBg,
          padding: '6px 12px',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ opacity: 0.8 }}>▶</span>
        {title}
      </div>
      {/* 터미널 내용 */}
      <div style={{ padding: '8px 12px', color: themeColors.terminalText }}>
        {lines.length === 0 ? (
          <div style={{ opacity: 0.5, fontStyle: 'italic' }}>{emptyMessage}</div>
        ) : (
          lines.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.type === 'error' ? '#ef4444' : themeColors.terminalText,
              }}
            >
              {line.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
