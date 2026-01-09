/**
 * EventLoopView - JavaScript 이벤트 루프 시각화
 *
 * 구조:
 * ┌─────────────┐  ┌─────────────┐
 * │ Call Stack  │  │  Web APIs   │
 * └─────────────┘  └─────────────┘
 * ┌────────────────────────────────┐
 * │      Microtask Queue          │
 * └────────────────────────────────┘
 * ┌────────────────────────────────┐
 * │        Task Queue             │
 * └────────────────────────────────┘
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { EventLoopViewProps, EventLoopState } from '../types';

// 색상 상수
const COLORS = {
  callStack: {
    bg: '#E8F5E9',
    border: '#81C784',
    item: '#C8E6C9',
    text: '#2E7D32',
  },
  webApi: {
    bg: '#FFF8E1',
    border: '#FFD54F',
    item: '#FFECB3',
    text: '#F57F17',
  },
  taskQueue: {
    bg: '#FFEBEE',
    border: '#EF9A9A',
    item: '#FFCDD2',
    text: '#C62828',
  },
  microtaskQueue: {
    bg: '#E1F5FE',
    border: '#4FC3F7',
    item: '#B3E5FC',
    text: '#0277BD',
  },
  output: {
    bg: '#F5F5F5',
    border: '#BDBDBD',
    text: '#424242',
  },
};

// 애니메이션 설정
const ANIMATION = {
  item: {
    initial: { opacity: 0, scale: 0.8, y: -10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 10 },
    transition: { duration: 0.3 },
  },
};

/**
 * 큐 아이템 컴포넌트
 */
function QueueItem({
  name,
  color,
  index,
}: {
  name: string;
  color: { item: string; text: string };
  index: number;
}) {
  return (
    <motion.div
      layout
      initial={ANIMATION.item.initial}
      animate={ANIMATION.item.animate}
      exit={ANIMATION.item.exit}
      transition={{ ...ANIMATION.item.transition, delay: index * 0.05 }}
      className="px-3 py-1.5 rounded-md text-xs font-mono truncate"
      style={{
        background: color.item,
        color: color.text,
        maxWidth: '150px',
      }}
      title={name}
    >
      {name}
    </motion.div>
  );
}

/**
 * 섹션 컨테이너
 */
function Section({
  title,
  color,
  children,
  isEmpty,
  emptyText,
  highlight,
}: {
  title: string;
  color: { bg: string; border: string; text: string };
  children?: React.ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg border-2 overflow-hidden transition-all"
      style={{
        background: color.bg,
        borderColor: highlight ? color.text : color.border,
        boxShadow: highlight ? `0 0 12px ${color.border}` : 'none',
      }}
    >
      {/* 헤더 */}
      <div
        className="px-3 py-1.5 text-xs font-semibold border-b"
        style={{
          background: color.border + '40',
          borderColor: color.border,
          color: color.text,
        }}
      >
        {title}
      </div>

      {/* 콘텐츠 */}
      <div className="p-2 min-h-[60px]">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            {emptyText || '비어있음'}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/**
 * Event Loop Arrow (순환 화살표)
 */
function EventLoopArrow() {
  return (
    <div className="flex items-center justify-center py-2">
      <svg width="200" height="30" viewBox="0 0 200 30">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#757575" />
          </marker>
        </defs>
        <path
          d="M 10 15 Q 100 -10 190 15"
          stroke="#757575"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,3"
          markerEnd="url(#arrowhead)"
        />
        <text x="100" y="28" textAnchor="middle" fontSize="10" fill="#757575">
          Event Loop
        </text>
      </svg>
    </div>
  );
}

/**
 * Output 패널
 */
function OutputPanel({ output }: { output: string[] }) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        background: COLORS.output.bg,
        borderColor: COLORS.output.border,
      }}
    >
      <div
        className="px-3 py-1.5 text-xs font-semibold border-b flex items-center gap-2"
        style={{
          borderColor: COLORS.output.border,
          color: COLORS.output.text,
        }}
      >
        <span>📺</span> Console Output
      </div>
      <div className="p-2 font-mono text-xs max-h-[100px] overflow-y-auto">
        {output.length === 0 ? (
          <span className="text-gray-400">// 출력 없음</span>
        ) : (
          output.map((line, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="py-0.5"
              style={{ color: COLORS.output.text }}
            >
              {'>'} {line}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * EventLoopView 메인 컴포넌트
 */
export function EventLoopView({
  state,
  animate = true,
  showOutput = true,
}: EventLoopViewProps) {
  const {
    callStack,
    webApis,
    taskQueue,
    microtaskQueue,
    output,
    currentPhase,
    highlightArea,
  } = state;

  return (
    <div className="p-4 space-y-3">
      {/* 상단: Call Stack + Web APIs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Call Stack */}
        <Section
          title="📚 Call Stack"
          color={COLORS.callStack}
          isEmpty={callStack.length === 0}
          emptyText="(empty)"
          highlight={highlightArea === 'callStack' || currentPhase === 'executing'}
        >
          <div className="space-y-1.5 flex flex-col-reverse">
            <AnimatePresence mode="popLayout">
              {callStack.map((item, idx) => (
                <QueueItem
                  key={`${item}-${idx}`}
                  name={item}
                  color={COLORS.callStack}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </div>
        </Section>

        {/* Web APIs */}
        <Section
          title="🌐 Web APIs"
          color={COLORS.webApi}
          isEmpty={webApis.length === 0}
          emptyText="(no timers)"
          highlight={highlightArea === 'webApis'}
        >
          <div className="space-y-1.5">
            <AnimatePresence mode="popLayout">
              {webApis.map((api, idx) => (
                <QueueItem
                  key={api.id}
                  name={`${api.name}${api.delay !== undefined ? ` (${api.delay}ms)` : ''}`}
                  color={COLORS.webApi}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </div>
        </Section>
      </div>

      {/* Event Loop 화살표 */}
      <EventLoopArrow />

      {/* Microtask Queue */}
      <Section
        title="⚡ Microtask Queue (우선순위 높음)"
        color={COLORS.microtaskQueue}
        isEmpty={microtaskQueue.length === 0}
        emptyText="(empty)"
        highlight={highlightArea === 'microtaskQueue' || currentPhase === 'checkingMicrotasks'}
      >
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence mode="popLayout">
            {microtaskQueue.map((item, idx) => (
              <QueueItem
                key={`${item}-${idx}`}
                name={item}
                color={COLORS.microtaskQueue}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>
      </Section>

      {/* Task Queue */}
      <Section
        title="📋 Task Queue (Macrotask)"
        color={COLORS.taskQueue}
        isEmpty={taskQueue.length === 0}
        emptyText="(empty)"
        highlight={highlightArea === 'taskQueue' || currentPhase === 'checkingTasks'}
      >
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence mode="popLayout">
            {taskQueue.map((item, idx) => (
              <QueueItem
                key={`${item}-${idx}`}
                name={item}
                color={COLORS.taskQueue}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>
      </Section>

      {/* Console Output */}
      {showOutput && <OutputPanel output={output} />}

      {/* 실행 순서 힌트 */}
      <div className="text-xs text-gray-500 text-center">
        실행 순서: Call Stack 비움 → Microtask 전부 → Task 하나 → 반복
      </div>
    </div>
  );
}
