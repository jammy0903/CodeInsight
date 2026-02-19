/**
 * TerminalOutput - Unified terminal output component
 *
 * variant='terminal' (Playground): Hacker dark style with Framer Motion animations
 * variant='inline'   (Lesson):     Minimal inline style using CSS theme vars, no animation
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// 타입 정의
// ============================================

export type TerminalLineType = 'stdout' | 'stderr' | 'return';

export interface TerminalLine {
  content: string;
  type: TerminalLineType;
}

interface TerminalOutputProps {
  lines: TerminalLine[];
  variant?: 'terminal' | 'inline';
  title?: string;
  emptyMessage?: string;
  compact?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

// ============================================
// 고정 터미널 색상 (테마 무관 - terminal variant)
// ============================================

const TERMINAL = {
  bg: '#0a0e17',
  headerBg: '#111827',
  border: '#1e293b',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  stdout: '#4ade80',
  stderr: '#ef4444',
  return: '#60a5fa',
  prompt: '#6366f1',
  dot: { red: '#ef4444', yellow: '#eab308', green: '#22c55e' },
} as const;

// ============================================
// 애니메이션 (terminal variant only)
// ============================================

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
} as const;

const lineVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, delay: i * 0.03 },
  }),
};

// ============================================
// 헬퍼
// ============================================

function getPromptSymbol(type: TerminalLineType): string {
  switch (type) {
    case 'stdout': return '$';
    case 'stderr': return '!';
    case 'return': return '←';
    default: return '$';
  }
}

function getTextColor(type: TerminalLineType): string {
  switch (type) {
    case 'stdout': return TERMINAL.stdout;
    case 'stderr': return TERMINAL.stderr;
    case 'return': return TERMINAL.return;
    default: return TERMINAL.text;
  }
}

// ============================================
// Inline variant (Lesson) — CSS theme vars, no animation
// ============================================

const InlineTerminal = memo(function InlineTerminal({
  lines,
  className,
}: Pick<TerminalOutputProps, 'lines' | 'className'>) {
  if (lines.length === 0) return null;

  return (
    <div
      className={`border-t ${className || ''}`}
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

// ============================================
// Terminal variant (Playground) — hacker dark, Framer Motion
// ============================================

const HackerTerminal = memo(function HackerTerminal({
  lines,
  title = 'Terminal',
  emptyMessage = 'No output',
  compact = false,
  rightContent,
  className = '',
}: Omit<TerminalOutputProps, 'variant'>) {
  const padding = compact ? '8px 10px' : '10px 14px';
  const headerPadding = compact ? '5px 10px' : '7px 12px';

  return (
    <motion.div
      className={`terminal-output overflow-hidden rounded-lg ${className}`}
      style={{
        background: TERMINAL.bg,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, monospace",
        fontSize: '12px',
        border: `1px solid ${TERMINAL.border}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 터미널 헤더 */}
      <div
        style={{
          background: TERMINAL.headerBg,
          padding: headerPadding,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderBottom: `1px solid ${TERMINAL.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[TERMINAL.dot.red, TERMINAL.dot.yellow, TERMINAL.dot.green].map((color, i) => (
              <div
                key={i}
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: color,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <span
            style={{
              color: TERMINAL.textMuted,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </span>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>

      {/* 터미널 내용 */}
      <div style={{ padding, color: TERMINAL.text }}>
        {lines.length === 0 ? (
          <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '11px' }}>
            {emptyMessage}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {lines.map((line, i) => (
              <motion.div
                key={`${i}-${line.content}`}
                custom={i}
                variants={lineVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -8 }}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: i < lines.length - 1 ? '3px' : '0',
                  lineHeight: '1.5',
                }}
              >
                <span style={{ color: TERMINAL.prompt, opacity: 0.6, userSelect: 'none', flexShrink: 0 }}>
                  {getPromptSymbol(line.type)}
                </span>
                <span
                  style={{
                    color: getTextColor(line.type),
                    flex: 1,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {line.content}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

// ============================================
// 메인 컴포넌트 (variant dispatch)
// ============================================

export const TerminalOutput = memo(function TerminalOutput({
  variant = 'terminal',
  ...props
}: TerminalOutputProps) {
  if (variant === 'inline') {
    return <InlineTerminal lines={props.lines} className={props.className} />;
  }
  return <HackerTerminal {...props} />;
});
