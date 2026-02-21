/**
 * LessonCodePanel - Shared code editor panel with resizer
 *
 * Supports two orientations:
 * - vertical (mobile): code on top, children on bottom, row-resize
 * - horizontal (desktop): code on left, children on right, col-resize
 */

import { useState, useRef, useCallback } from 'react';
import { Code2 } from 'lucide-react';

import { CodeMirrorEditor, type CodeSelection } from '@/features/visualizers/shared/components/CodeMirrorEditor';
import { TerminalOutput, type TerminalLine } from '@/features/visualizers/shared/components/TerminalOutput';

interface LessonCodePanelProps {
  code: string;
  highlightLine: number;
  terminalLines: TerminalLine[];
  onSelectionChange?: (selection: CodeSelection) => void;
  defaultRatio?: number;
  orientation?: 'vertical' | 'horizontal';
  showCodeHeader?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function LessonCodePanel({
  code,
  highlightLine,
  terminalLines,
  onSelectionChange,
  defaultRatio = 0.5,
  orientation = 'vertical',
  showCodeHeader = false,
  children,
  className,
  style,
}: LessonCodePanelProps) {
  const [codeRatio, setCodeRatio] = useState(defaultRatio);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHorizontal = orientation === 'horizontal';

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const client = 'touches' in ev ? ev.touches[0] : ev;
      const ratio = isHorizontal
        ? (client.clientX - rect.left) / rect.width
        : (client.clientY - rect.top) / rect.height;
      setCodeRatio(Math.min(0.75, Math.max(0.2, ratio)));
    };

    const handleEnd = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
  }, [isHorizontal]);

  const codeSizeStyle = isHorizontal
    ? { width: `${codeRatio * 100}%` }
    : { height: `${codeRatio * 100}%` };

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${className || ''}`}
      style={style}
    >
      {/* === Code section === */}
      <div className="flex flex-col shrink-0" style={codeSizeStyle}>
        {showCodeHeader && (
          <div
            className="flex items-center px-3 py-1 text-xs font-medium shrink-0"
            style={{
              background: 'var(--theme-lesson-editor-header-bg)',
              color: 'var(--theme-lesson-editor-header-text)',
              borderBottom: '1px solid var(--theme-lesson-panel-border)',
            }}
          >
            <Code2 className="w-3 h-3 mr-1.5" />
            에디터
          </div>
        )}
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <CodeMirrorEditor
            code={code}
            highlightLine={highlightLine}
            onSelectionChange={onSelectionChange}
            bottomPadding={0}
          />
          {terminalLines.length > 0 && (
            <TerminalOutput lines={terminalLines} compact />
          )}
        </div>
      </div>

      {/* === Resizer handle === */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className="flex items-center justify-center shrink-0"
        style={{
          ...(isHorizontal
            ? { width: '6px', cursor: 'col-resize', background: 'var(--theme-lesson-panel-border)' }
            : { height: '24px', cursor: 'row-resize', background: 'transparent' }),
          touchAction: 'none',
        }}
      >
        <div style={isHorizontal
          ? { width: '3px', height: '32px', borderRadius: '2px', background: 'var(--theme-lesson-editor-header-text)', opacity: 0.4 }
          : { width: '48px', height: '4px', borderRadius: '3px', background: 'var(--theme-lesson-editor-header-text)', opacity: 0.35 }
        } />
      </div>

      {/* === Content section === */}
      <div
        className="flex flex-col min-h-0 min-w-0"
        style={{ flex: '1 1 0', overflow: 'hidden' }}
      >
        {children}
      </div>
    </div>
  );
}
