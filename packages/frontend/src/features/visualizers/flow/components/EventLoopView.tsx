/**
 * EventLoopView - 이벤트 루프 시각화 컴포넌트
 *
 * eventLoopState 데이터를 받아 시각적 다이어그램으로 렌더링.
 * - Call Stack: 현재 실행 중인 함수들 (스택 구조)
 * - Web APIs: 브라우저에 위임된 비동기 작업
 * - Task Queue (Callback Queue): 실행 대기 중인 콜백
 * - Microtask Queue: 우선 실행되는 마이크로태스크 (Promise 등)
 * - Output: 콘솔 출력 (누적)
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// 타입 정의
// ============================================

interface WebApiItem {
  name: string;
  delay?: number;
}

interface EventLoopState {
  callStack?: string[];
  webApis?: WebApiItem[];
  taskQueue?: string[];
  microtaskQueue?: string[];
  output?: string[];
}

interface EventLoopViewProps {
  eventLoopState: EventLoopState;
  prevEventLoopState?: EventLoopState | null;
}

// ============================================
// 색상 테마
// ============================================

const COLORS = {
  callStack: {
    bg: '#eff6ff',
    border: '#3b82f6',
    header: '#dbeafe',
    headerText: '#1e40af',
    itemBg: '#bfdbfe',
    itemBorder: '#60a5fa',
    itemText: '#1e3a8a',
  },
  webApis: {
    bg: '#fffbeb',
    border: '#f59e0b',
    header: '#fef3c7',
    headerText: '#92400e',
    itemBg: '#fde68a',
    itemBorder: '#fbbf24',
    itemText: '#78350f',
  },
  taskQueue: {
    bg: '#f0fdf4',
    border: '#22c55e',
    header: '#dcfce7',
    headerText: '#166534',
    itemBg: '#bbf7d0',
    itemBorder: '#4ade80',
    itemText: '#14532d',
  },
  microtaskQueue: {
    bg: '#faf5ff',
    border: '#a855f7',
    header: '#f3e8ff',
    headerText: '#6b21a8',
    itemBg: '#e9d5ff',
    itemBorder: '#c084fc',
    itemText: '#581c87',
  },
  output: {
    bg: '#0a1a0f',
    border: '#22c55e33',
    text: '#4ade80',
    dimText: '#166534',
  },
};

// ============================================
// 애니메이션 variants
// ============================================

const itemVariants = {
  initial: { opacity: 0, scale: 0.8, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: 8 },
};

const outputLineVariants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
};

// ============================================
// 서브 컴포넌트
// ============================================

/** 섹션 박스 (Call Stack, Web APIs 등) */
function Section({
  title,
  emoji,
  colors,
  children,
  isEmpty,
  emptyText,
  minHeight,
}: {
  title: string;
  emoji: string;
  colors: typeof COLORS.callStack;
  children?: React.ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
  minHeight?: string;
}) {
  return (
    <div
      className="rounded-xl border-2 overflow-hidden"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        minHeight: minHeight || '80px',
      }}
    >
      <div
        className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
        style={{ backgroundColor: colors.header, color: colors.headerText }}
      >
        <span>{emoji}</span>
        {title}
      </div>
      <div className="p-3">
        {isEmpty ? (
          <div className="text-xs italic opacity-40 text-center py-2">
            {emptyText || '(empty)'}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/** 스택/큐 아이템 */
function QueueItem({
  text,
  colors,
  delay,
  isNew,
}: {
  text: string;
  colors: { itemBg: string; itemBorder: string; itemText: string };
  delay?: number;
  isNew?: boolean;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial={isNew ? 'initial' : false}
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center gap-2"
      style={{
        backgroundColor: colors.itemBg,
        borderColor: colors.itemBorder,
        color: colors.itemText,
      }}
    >
      <span className="break-words whitespace-normal">{text}</span>
      {delay !== undefined && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
          style={{
            backgroundColor: colors.itemBorder,
            color: '#fff',
          }}
        >
          {delay}ms
        </span>
      )}
    </motion.div>
  );
}

// ============================================
// 이벤트 루프 화살표 (시각적 흐름 표시)
// ============================================

function LoopArrow() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="opacity-40">
          <path
            d="M4 12 C 20 12, 20 4, 40 4 C 60 4, 60 12, 76 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            fill="none"
          />
          <path d="M72 8 L76 12 L72 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <span>Event Loop</span>
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export const EventLoopView = memo(function EventLoopView({
  eventLoopState,
  prevEventLoopState,
}: EventLoopViewProps) {
  const callStack = eventLoopState.callStack || [];
  const webApis = eventLoopState.webApis || [];
  const taskQueue = eventLoopState.taskQueue || [];
  const microtaskQueue = eventLoopState.microtaskQueue || [];
  const output = eventLoopState.output || [];

  // 이전 상태와 비교하여 새로 추가된 항목 감지
  const prevCallStack = new Set(prevEventLoopState?.callStack || []);
  const prevWebApis = new Set((prevEventLoopState?.webApis || []).map(w => w.name));
  const prevTaskQueue = new Set(prevEventLoopState?.taskQueue || []);
  const prevOutput = prevEventLoopState?.output || [];

  // 새 출력 라인 감지 (이전보다 많아진 부분)
  const newOutputStartIndex = prevOutput.length;

  return (
    <div className="event-loop-view p-4 space-y-3">
      {/* 헤더 */}
      <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
        <span className="text-base">🔄</span>
        <span>Event Loop: 비동기 코드의 실행 흐름</span>
      </div>

      {/* 상단: Call Stack + Web APIs (2열) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Call Stack */}
        <Section
          title="Call Stack"
          emoji="📚"
          colors={COLORS.callStack}
          isEmpty={callStack.length === 0}
          emptyText="(비어있음 - 모든 코드 실행 완료)"
        >
          <div className="flex flex-col-reverse gap-1.5">
            <AnimatePresence mode="popLayout">
              {callStack.map((item, idx) => (
                <QueueItem
                  key={`cs-${idx}-${item}`}
                  text={item}
                  colors={COLORS.callStack}
                  isNew={!prevCallStack.has(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        </Section>

        {/* Web APIs */}
        <Section
          title="Web APIs"
          emoji="🌐"
          colors={COLORS.webApis}
          isEmpty={webApis.length === 0}
          emptyText="(비어있음)"
        >
          <div className="flex flex-col gap-1.5">
            <AnimatePresence mode="popLayout">
              {webApis.map((api, idx) => (
                <QueueItem
                  key={`wa-${idx}-${api.name}`}
                  text={api.name}
                  colors={COLORS.webApis}
                  delay={api.delay}
                  isNew={!prevWebApis.has(api.name)}
                />
              ))}
            </AnimatePresence>
          </div>
        </Section>
      </div>

      {/* 이벤트 루프 화살표 */}
      <LoopArrow />

      {/* 하단: Task Queue + Microtask Queue (2열) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Task Queue (Callback Queue) */}
        <Section
          title="Task Queue"
          emoji="📬"
          colors={COLORS.taskQueue}
          isEmpty={taskQueue.length === 0}
          emptyText="(비어있음)"
          minHeight="60px"
        >
          <div className="flex flex-col gap-1.5">
            <AnimatePresence mode="popLayout">
              {taskQueue.map((item, idx) => (
                <QueueItem
                  key={`tq-${idx}-${item}`}
                  text={item}
                  colors={COLORS.taskQueue}
                  isNew={!prevTaskQueue.has(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        </Section>

        {/* Microtask Queue */}
        <Section
          title="Microtask Queue"
          emoji="⚡"
          colors={COLORS.microtaskQueue}
          isEmpty={microtaskQueue.length === 0}
          emptyText="(비어있음)"
          minHeight="60px"
        >
          <div className="flex flex-col gap-1.5">
            <AnimatePresence mode="popLayout">
              {microtaskQueue.map((item, idx) => (
                <QueueItem
                  key={`mq-${idx}-${item}`}
                  text={item}
                  colors={COLORS.microtaskQueue}
                  isNew={true}
                />
              ))}
            </AnimatePresence>
          </div>
        </Section>
      </div>

      {/* Console Output */}
      {output.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: COLORS.output.bg,
            borderColor: COLORS.output.border,
          }}
        >
          <div
            className="px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: COLORS.output.text,
            }}
          >
            <span>🖥️</span>
            Console Output
          </div>
          <div className="px-3 py-2 font-mono text-xs space-y-0.5">
            {output.map((line, idx) => (
              <motion.div
                key={`out-${idx}-${line}`}
                variants={outputLineVariants}
                initial={idx >= newOutputStartIndex ? 'initial' : false}
                animate="animate"
                transition={{ duration: 0.2, delay: idx >= newOutputStartIndex ? 0.1 : 0 }}
                className="flex items-center gap-1.5"
              >
                <span style={{ color: COLORS.output.dimText }}>{'>'}</span>
                <span
                  style={{
                    color: idx >= newOutputStartIndex
                      ? '#4ade80'   /* 새 출력: 밝은 초록 */
                      : '#166534',  /* 기존 출력: 어두운 초록 */
                    fontWeight: idx >= newOutputStartIndex ? 600 : 400,
                  }}
                >
                  {line}
                </span>
                {idx >= newOutputStartIndex && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-green-900 text-green-300 ml-1">
                    new
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS.callStack.itemBg, border: `1px solid ${COLORS.callStack.itemBorder}` }} />
            <span>콜 스택</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS.webApis.itemBg, border: `1px solid ${COLORS.webApis.itemBorder}` }} />
            <span>Web API</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS.taskQueue.itemBg, border: `1px solid ${COLORS.taskQueue.itemBorder}` }} />
            <span>태스크 큐</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: COLORS.microtaskQueue.itemBg, border: `1px solid ${COLORS.microtaskQueue.itemBorder}` }} />
            <span>마이크로태스크</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EventLoopView;
