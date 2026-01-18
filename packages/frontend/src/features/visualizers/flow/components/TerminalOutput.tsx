/**
 * TerminalOutput Component
 *
 * printf/cout 출력 시각화
 * - 간단한 fade-in 애니메이션
 * - 터미널 스타일 출력 영역
 *
 * ⚠️ 설계 의도 (2026-01-18):
 * 이 컴포넌트는 의도적으로 STATELESS로 유지됨.
 *
 * 이전에 useState/useEffect로 누적 출력, FlyingValue 애니메이션 등
 * 복잡한 로직이 있었으나 다음 문제 발생:
 * 1. Date.now()가 매 렌더마다 새 값 → 무한 애니메이션 재실행
 * 2. 상태 동기화 버그 → 어색한 애니메이션
 *
 * 해결: 상태 제거, 단순 fade-in만 사용
 * → 부모(FlowVisualizer)에서 terminalOutputData를 useMemo로 관리
 *
 * DO NOT ADD:
 * - useState, useEffect
 * - 누적 출력 로직 (allOutputs)
 * - FlyingValue 같은 복잡한 애니메이션
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { TerminalOutput as TerminalOutputType } from '@codeinsight/shared';
import { FLOW_THEMES, type FlowTheme } from '../styles';

// ============================================
// 타입 정의
// ============================================

interface TerminalOutputProps {
  /** 현재 출력 정보 */
  output: TerminalOutputType;
  /** 테마 */
  theme: FlowTheme;
  /** 클래스명 */
  className?: string;
}

// ============================================
// 메인 컴포넌트
// ============================================

export const TerminalOutputComponent = memo(function TerminalOutputComponent({
  output,
  theme,
  className = '',
}: TerminalOutputProps) {
  const colors = FLOW_THEMES[theme].terminal;

  // 출력 타입에 따른 색상
  const getTextColor = () => {
    switch (output.type) {
      case 'stdout':
        return colors.stdout;
      case 'stderr':
        return colors.stderr;
      case 'return':
        return colors.return;
      default:
        return colors.stdout;
    }
  };

  return (
    <motion.div
      className={`terminal-output overflow-hidden rounded-lg ${className}`}
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* 헤더 */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{ borderColor: colors.border }}
      >
        {/* 터미널 버튼들 (장식용) */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span
          className="text-xs font-mono opacity-50 ml-2"
          style={{ color: colors.text }}
        >
          출력
        </span>
      </div>

      {/* 출력 영역 */}
      <div className="p-3">
        <motion.div
          className="flex items-start gap-2 font-mono text-sm"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          {/* 프롬프트 */}
          <span className="opacity-50 select-none" style={{ color: colors.text }}>
            {output.type === 'stdout' && '>'}
            {output.type === 'stderr' && '!'}
            {output.type === 'return' && '←'}
          </span>

          {/* 출력 값 */}
          <span style={{ color: getTextColor() }}>
            {output.value}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
});

export default TerminalOutputComponent;
