/**
 * CodePanel - Editor + Terminal wrapper
 *
 * Combines CodeMirrorEditor and TerminalOutput into a single panel.
 * Used by both Lesson (read-only + inline terminal) and Playground (editable + hacker terminal).
 */

import { CodeMirrorEditor, type CodeSelection } from './CodeMirrorEditor';
import { TerminalOutput, type TerminalLine } from './TerminalOutput';
import type { SupportedLanguage } from '@/types/simulator';

interface CodePanelProps {
  code: string;
  language?: SupportedLanguage;
  highlightLine?: number;
  editable?: boolean;
  onChange?: (code: string) => void;
  onSelectionChange?: (sel: CodeSelection) => void;
  bottomPadding?: number;
  terminalLines: TerminalLine[];
  terminalVariant?: 'terminal' | 'inline';
  terminalTitle?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CodePanel({
  code,
  language,
  highlightLine,
  editable,
  onChange,
  onSelectionChange,
  bottomPadding,
  terminalLines,
  terminalVariant,
  terminalTitle,
  className,
  style,
}: CodePanelProps) {
  return (
    <div className={className} style={style}>
      <CodeMirrorEditor
        code={code}
        language={language}
        highlightLine={highlightLine}
        editable={editable}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        bottomPadding={bottomPadding}
      />
      <TerminalOutput
        lines={terminalLines}
        variant={terminalVariant}
        title={terminalTitle}
        compact
      />
    </div>
  );
}
