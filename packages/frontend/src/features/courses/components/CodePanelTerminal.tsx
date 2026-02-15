/**
 * CodePanelTerminal - 코드 에디터 바로 아래 인라인 터미널
 *
 * 코드와 같은 스크롤 컨테이너 안에 위치하여
 * 코드 마지막 줄 바로 아래에 출력이 표시됨.
 * 테마 변수: --theme-lesson-terminal-*
 */

import { memo } from 'react';
import type { TerminalLine } from '@/features/visualizers/shared';

interface CodePanelTerminalProps {
  lines: TerminalLine[];
}

export const CodePanelTerminal = memo(function CodePanelTerminal({
  lines,
}: CodePanelTerminalProps) {
  if (lines.length === 0) return null;

  return (
    <div
      className="border-t"
      style={{
        background: 'var(--theme-lesson-terminal-bg)',
        borderColor: 'var(--theme-lesson-panel-border)',
      }}
    >
      <div className="px-3 py-1.5">
        {lines.map((line, idx) => (
          <div
            key={`${idx}-${line.content}`}
            className="text-xs font-mono leading-relaxed break-words whitespace-pre-wrap"
            style={{ color: 'var(--theme-lesson-terminal-text)' }}
          >
            <span className="opacity-50 mr-1.5" style={{ userSelect: 'none' }}>
              {line.type === 'stderr' ? '!' : '>'}
            </span>
            {line.content}
          </div>
        ))}
      </div>
    </div>
  );
});
