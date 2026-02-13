/**
 * LoopTrack Component
 *
 * 반복문 시각화 (for/while/do-while)
 * - 원형 카운터로 현재 iteration 표시
 * - 빙글빙글 도는 애니메이션
 * - 조건식 표시
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ControlFlow } from '@codeinsight/shared';
import { FLOW_THEMES, FLOW_ANIMATION, type FlowTheme } from '../../shared/styles';

// ============================================
// 타입 정의
// ============================================

interface LoopTrackProps {
  /** 제어 흐름 정보 */
  controlFlow: ControlFlow;
  /** 테마 */
  theme: FlowTheme;
  /** 최대 반복 횟수 (진행률 계산용) */
  maxIterations?: number;
}

// ============================================
// 상수
// ============================================

const CIRCLE_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ============================================
// 서브 컴포넌트: CircularProgress
// ============================================

interface CircularProgressProps {
  progress: number; // 0-1
  color: string;
  backgroundColor: string;
}

const CircularProgress = memo(function CircularProgress({
  progress,
  color,
  backgroundColor,
}: CircularProgressProps) {
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <svg
      width={CIRCLE_SIZE}
      height={CIRCLE_SIZE}
      className="transform -rotate-90"
    >
      {/* 배경 원 */}
      <circle
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={backgroundColor}
        strokeWidth={STROKE_WIDTH}
      />
      {/* 진행 원 */}
      <motion.circle
        cx={CIRCLE_SIZE / 2}
        cy={CIRCLE_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        initial={{ strokeDashoffset: CIRCUMFERENCE }}
        animate={{ strokeDashoffset: offset }}
        transition={{
          type: 'spring',
          stiffness: FLOW_ANIMATION.spring.stiffness,
          damping: FLOW_ANIMATION.spring.damping,
        }}
      />
    </svg>
  );
});

// ============================================
// 서브 컴포넌트: SpinningIndicator
// ============================================

interface SpinningIndicatorProps {
  isActive: boolean;
  color: string;
}

const SpinningIndicator = memo(function SpinningIndicator({
  isActive,
  color,
}: SpinningIndicatorProps) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      animate={isActive ? { rotate: 360 } : { rotate: 0 }}
      transition={
        isActive
          ? {
              repeat: Infinity,
              duration: 2,
              ease: 'linear',
            }
          : {}
      }
    >
      <div
        className="w-2 h-2 rounded-full absolute"
        style={{
          backgroundColor: color,
          top: 4,
        }}
      />
    </motion.div>
  );
});

// ============================================
// 메인 컴포넌트
// ============================================

export const LoopTrack = memo(function LoopTrack({
  controlFlow,
  theme,
  maxIterations = 10,
}: LoopTrackProps) {
  const { type, condition, loopIndex = 0 } = controlFlow;
  const colors = FLOW_THEMES[theme].control;

  // 루프 타입별 아이콘
  const loopIcon = useMemo(() => {
    switch (type) {
      case 'for':
        return '🔄';
      case 'while':
        return '🔁';
      case 'do-while':
        return '↩️';
      default:
        return '🔄';
    }
  }, [type]);

  // 루프 타입별 라벨
  const loopLabel = useMemo(() => {
    switch (type) {
      case 'for':
        return 'for';
      case 'while':
        return 'while';
      case 'do-while':
        return 'do-while';
      default:
        return 'loop';
    }
  }, [type]);

  // 진행률 계산 (0-1)
  const progress = Math.min(loopIndex / maxIterations, 1);

  // 활성 상태 (loopIndex이 0보다 크면 활성)
  const isActive = loopIndex > 0;

  return (
    <motion.div
      className="loop-track flex items-center gap-4 p-4 rounded-lg"
      style={{
        backgroundColor: `${colors.loop}15`,
        border: `2px solid ${colors.loop}40`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: FLOW_ANIMATION.spring.stiffness,
        damping: FLOW_ANIMATION.spring.damping,
      }}
    >
      {/* 원형 카운터 */}
      <div className="relative">
        <CircularProgress
          progress={progress}
          color={colors.loop}
          backgroundColor={`${colors.loop}30`}
        />

        {/* 중앙 loopIndex 숫자 */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          key={loopIndex}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span
            className="font-mono font-bold text-xl"
            style={{ color: colors.loop }}
          >
            {loopIndex}
          </span>
        </motion.div>

        {/* 빙글빙글 인디케이터 */}
        <SpinningIndicator isActive={isActive} color={colors.loop} />
      </div>

      {/* 루프 정보 */}
      <div className="flex-1">
        {/* 타입 + 아이콘 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{loopIcon}</span>
          <span
            className="font-mono font-medium"
            style={{ color: colors.loop }}
          >
            {loopLabel}
          </span>
        </div>

        {/* 조건식 */}
        {condition && (
          <motion.code
            className="text-sm font-mono block opacity-80"
            style={{ color: colors.loop }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 0.8, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            ({condition})
          </motion.code>
        )}

        {/* 반복 상태 */}
        <motion.span
          className="text-xs opacity-60 mt-1 block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.2 }}
        >
          {loopIndex === 0
            ? '반복 시작 전'
            : loopIndex === 1
            ? '첫 번째 반복'
            : `${loopIndex}번째 반복`}
        </motion.span>
      </div>

      {/* 진행률 바 (가로) */}
      <div className="w-24">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: `${colors.loop}30` }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.loop }}
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{
              type: 'spring',
              stiffness: FLOW_ANIMATION.spring.stiffness,
              damping: FLOW_ANIMATION.spring.damping,
            }}
          />
        </div>
        <span
          className="text-xs opacity-50 mt-1 block text-center"
          style={{ color: colors.loop }}
        >
          {loopIndex}/{maxIterations}
        </span>
      </div>
    </motion.div>
  );
});

export default LoopTrack;
