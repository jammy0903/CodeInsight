/**
 * TerminalOutput - 통합 터미널 출력 컴포넌트
 *
 * 사용처:
 * - LessonPage (레슨 학습 페이지)
 * - MobileLessonView (모바일 레슨)
 * - FlowVisualizer (플로우 시각화)
 * - PlaygroundPage (연습장)
 *
 * 기능:
 * - 멀티라인 출력 지원
 * - framer-motion 애니메이션
 * - CSS 변수 기반 테마 시스템
 * - stdout/stderr/return 타입 지원
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
  /** 출력 라인 배열 */
  lines: TerminalLine[];
  /** 터미널 제목 */
  title?: string;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
  /** 컴팩트 모드 (패딩 축소) */
  compact?: boolean;
  /** 헤더 우측에 표시할 커스텀 콘텐츠 */
  rightContent?: React.ReactNode;
  /** 클래스명 */
  className?: string;
}

// ============================================
// 애니메이션 설정
// ============================================

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const lineVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, delay: i * 0.05 },
  }),
};

// ============================================
// 헬퍼 함수
// ============================================

function getPromptSymbol(type: TerminalLineType): string {
  switch (type) {
    case 'stdout':
      return '>';
    case 'stderr':
      return '!';
    case 'return':
      return '←';
    default:
      return '>';
  }
}

function getTextColor(type: TerminalLineType): string {
  switch (type) {
    case 'stdout':
      return 'var(--theme-lesson-terminal-text)';
    case 'stderr':
      return '#ef4444';
    case 'return':
      return '#22c55e';
    default:
      return 'var(--theme-lesson-terminal-text)';
  }
}

// ============================================
// 메인 컴포넌트
// ============================================

export const TerminalOutput = memo(function TerminalOutput({
  lines,
  title = '출력',
  emptyMessage = '출력이 없습니다',
  compact = false,
  rightContent,
  className = '',
}: TerminalOutputProps) {
  const padding = compact ? '8px' : '12px';
  const headerPadding = compact ? '6px 10px' : '8px 12px';

  return (
    <motion.div
      className={`terminal-output overflow-hidden rounded-lg ${className}`}
      style={{
        background: 'var(--theme-lesson-terminal-bg)',
        fontFamily: 'monospace',
        fontSize: '12px',
        border: '1px solid var(--theme-lesson-panel-border)',
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 터미널 헤더 */}
      <div
        style={{
          background: 'var(--theme-lesson-terminal-header-bg)',
          padding: headerPadding,
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
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.6)',
              }}
            />
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'rgba(234, 179, 8, 0.6)',
              }}
            />
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.6)',
              }}
            />
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
      <div
        style={{
          padding,
          color: 'var(--theme-lesson-terminal-text)',
        }}
      >
        {lines.length === 0 ? (
          <div style={{ opacity: 0.5, fontStyle: 'italic' }}>{emptyMessage}</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {lines.map((line, i) => (
              <motion.div
                key={`${i}-${line.content}`}
                custom={i}
                variants={lineVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -10 }}
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '8px',
                  marginBottom: i < lines.length - 1 ? '4px' : '0',
                }}
              >
                {/* 프롬프트 기호 */}
                <span style={{ opacity: 0.5, userSelect: 'none' }}>
                  {getPromptSymbol(line.type)}
                </span>
                {/* 출력 내용 */}
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
