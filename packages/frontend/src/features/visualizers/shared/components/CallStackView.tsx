/**
 * CallStackView - 공통 콜 스택 시각화 컴포넌트
 * 모든 언어에서 재사용 가능
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { CallStackViewProps, StackFrame } from '../types';
import { COLORS, ANIMATION } from '../constants';

/**
 * 단일 스택 프레임 컴포넌트
 */
function StackFrameItem({
  frame,
  isActive,
  index,
}: {
  frame: StackFrame;
  isActive: boolean;
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{
        duration: ANIMATION.duration.normal,
        delay: index * ANIMATION.stagger,
      }}
      className="rounded-lg border-2 overflow-hidden"
      style={{
        background: isActive ? COLORS.stack.frameActive : COLORS.stack.frame,
        borderColor: isActive ? COLORS.stack.frameBorder : '#E0E0E0',
      }}
    >
      {/* 프레임 헤더 */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{
          borderBottom: frame.variables.length > 0 ? '1px solid #E0E0E0' : 'none',
        }}
      >
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: COLORS.stack.text }}
        >
          {frame.name}()
        </span>
        {frame.line && (
          <span className="text-xs text-[var(--theme-dashboard-text-muted)]">line {frame.line}</span>
        )}
      </div>

      {/* 변수 목록 */}
      {frame.variables.length > 0 && (
        <div className="px-3 py-2 space-y-1 bg-white bg-opacity-50">
          {frame.variables.map((v) => (
            <div
              key={v.name}
              className="flex items-center justify-between text-xs font-mono"
            >
              <span className="text-[var(--theme-dashboard-text-muted)]">{v.name}</span>
              <span className="text-[var(--theme-dashboard-title)] font-medium">
                {String(v.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * 빈 스택 표시
 */
function EmptyStack() {
  return (
    <div className="flex items-center justify-center py-8 text-[var(--theme-dashboard-text-muted)] text-sm">
      <span>스택이 비어있습니다</span>
    </div>
  );
}

/**
 * CallStackView 메인 컴포넌트
 */
export function CallStackView({ state, animate = true }: CallStackViewProps) {
  const { frames, currentFrameIndex } = state;

  // 스택은 위에서 아래로 쌓이므로 역순 표시
  const reversedFrames = [...frames].reverse();

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: COLORS.stack.frameBorder }}
        />
        <h3 className="text-sm font-semibold text-[var(--theme-dashboard-title)]">Call Stack</h3>
        <span className="text-xs text-[var(--theme-dashboard-text-muted)]">
          ({frames.length} frame{frames.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* 스택 프레임들 */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {reversedFrames.length === 0 ? (
            <EmptyStack />
          ) : (
            reversedFrames.map((frame, idx) => (
              <StackFrameItem
                key={frame.id}
                frame={frame}
                isActive={frames.length - 1 - idx === currentFrameIndex}
                index={idx}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 스택 바닥 표시 */}
      <div
        className="mt-2 h-1 rounded-full"
        style={{ background: '#E0E0E0' }}
      />
    </div>
  );
}
