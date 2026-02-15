/**
 * LessonCodePanel - Shared code editor panel with resizer
 *
 * Top: Code editor + terminal overlay (height controlled by ratio)
 * Middle: Resizer handle (drag to resize, hidden when collapsed)
 * Bottom: children (explanation, visualization, etc.)
 *
 * Used by both LessonDesktopLayout and MobileLessonView.
 */

import { useState, useRef, useCallback } from 'react';
import { Code2 } from 'lucide-react';

import { LessonCodeEditor } from './day/LessonCodeEditor';
import type { TerminalLine } from '@/features/visualizers/shared';
import type { CodeSelection } from '../types';

interface LessonCodePanelProps {
  code: string;
  highlightLine: number;
  terminalLines: TerminalLine[];
  onSelectionChange?: (selection: CodeSelection) => void;
  defaultRatio?: number;
  collapsed?: boolean;
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
  defaultRatio = 0.55,
  collapsed = false,
  showCodeHeader = false,
  children,
  className,
  style,
}: LessonCodePanelProps) {
  const [codeHeightRatio, setCodeHeightRatio] = useState(defaultRatio);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      const ratio = Math.min(0.85, Math.max(0.15, (clientY - rect.top) / rect.height));
      setCodeHeightRatio(ratio);
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
  }, []);

  return (
    <div ref={containerRef} className={`flex flex-col ${className || ''}`} style={style}>
      {/* === Top: Code editor + terminal overlay === */}
      <div
        className="relative flex flex-col shrink-0"
        style={{ height: collapsed ? '100%' : `${codeHeightRatio * 100}%` }}
      >
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
          <LessonCodeEditor
            code={code}
            highlightLine={highlightLine}
            onSelectionChange={onSelectionChange}
            bottomPadding={terminalLines.length > 0 ? 140 : 0}
          />
        </div>
        {/* Terminal overlay — bottom of code editor */}
        {terminalLines.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[40%]">
            <div
              className="overflow-hidden shadow-lg border-t"
              style={{
                background: 'rgba(0, 20, 10, 0.92)',
                borderColor: 'rgba(34, 197, 94, 0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="px-3 py-1.5 overflow-y-auto max-h-[120px]">
                {terminalLines.map((line, idx) => (
                  <div key={idx} className="text-xs font-mono leading-relaxed text-green-400 break-words whitespace-pre-wrap">
                    <span className="text-emerald-500 opacity-70 mr-1.5">{'>'}</span>
                    {line.content}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === Resizer handle === */}
      {!collapsed && (
        <div
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
          style={{
            height: '6px',
            cursor: 'row-resize',
            background: 'var(--theme-lesson-panel-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            touchAction: 'none',
          }}
        >
          <div style={{
            width: '32px',
            height: '3px',
            borderRadius: '2px',
            background: 'var(--theme-lesson-editor-header-text)',
            opacity: 0.4,
          }} />
        </div>
      )}

      {/* === Bottom: children (explanation, visualization, etc.) === */}
      <div
        className="flex flex-col min-h-0"
        style={{
          flex: collapsed ? '0 0 auto' : '1 1 0',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
