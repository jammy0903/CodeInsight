/**
 * Call Stack View - 모듈용 콜스택 시각화
 *
 * 다크 테마 기반 (시뮬레이터 기본 테마).
 * 모듈 내부 스토어에서 프레임 상태를 읽어 렌더링한다.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useCallStackModuleStore, type CallStackFrame } from './store';

function StackFrameItem({
  frame,
  index,
}: {
  frame: CallStackFrame;
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`
        rounded-lg border overflow-hidden
        ${frame.isActive
          ? 'border-emerald-500/60 bg-emerald-500/10'
          : 'border-[#30363d] bg-[#161b22]'
        }
      `}
    >
      {/* 프레임 헤더 */}
      <div className={`
        px-3 py-2 flex items-center justify-between
        ${frame.variables.length > 0 ? 'border-b border-[#30363d]' : ''}
      `}>
        <span className={`
          font-mono text-sm font-semibold
          ${frame.isActive ? 'text-emerald-400' : 'text-[#8b949e]'}
        `}>
          {frame.name}()
        </span>
        {frame.isActive && (
          <span className="text-[10px] text-emerald-500/70 font-mono">ACTIVE</span>
        )}
      </div>

      {/* 변수 목록 */}
      {frame.variables.length > 0 && (
        <div className="px-3 py-1.5 space-y-0.5">
          {frame.variables.map((v) => (
            <div
              key={v.name}
              className="flex items-center justify-between text-xs font-mono"
            >
              <span className="text-[#8b949e]">
                {v.type && <span className="text-[#484f58] mr-1">{v.type}</span>}
                {v.name}
              </span>
              <span className="text-[#e6edf3] font-medium">
                {v.value !== undefined ? String(v.value) : '?'}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function CallStackModuleView() {
  const frames = useCallStackModuleStore(s => s.frames);

  // 스택은 위에서 아래로 쌓이므로 역순 표시
  const reversedFrames = [...frames].reverse();

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-[#8b949e] font-mono">
          {frames.length} frame{frames.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* 스택 프레임들 */}
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {reversedFrames.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-xs text-[#484f58]"
            >
              Empty stack
            </motion.div>
          ) : (
            reversedFrames.map((frame, idx) => (
              <StackFrameItem
                key={frame.id}
                frame={frame}
                index={idx}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* 스택 바닥 */}
      <div className="mt-2 h-px bg-[#30363d]" />
    </div>
  );
}
