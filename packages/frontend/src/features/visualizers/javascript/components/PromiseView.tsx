/**
 * PromiseView - Promise 상태 시각화 컴포넌트
 *
 * promiseState 데이터를 받아 상태 머신 + 타임라인으로 렌더링.
 * - Promise 상태 (pending/fulfilled/rejected) 카드
 * - 핸들러 체인 (.then/.catch/.finally)
 * - 마이크로태스크 큐
 * - 타이머 진행 상태
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ============================================
// 타입 정의
// ============================================

interface PromiseHandler {
  type: string; // 'then' | 'catch' | 'finally'
  callback?: string;
  status?: string;
}

interface PromiseEntry {
  id: string;
  state: 'pending' | 'fulfilled' | 'rejected';
  value?: string;
  handlers?: PromiseHandler[];
  label?: string;
}

interface TimerInfo {
  delay: number;
  status?: string; // 'waiting' | 'fired'
  label?: string;
}

interface PromiseState {
  promises: PromiseEntry[];
  phase?: string;
  timer?: TimerInfo;
  microtaskQueue?: string[];
}

interface PromiseViewProps {
  promiseState: PromiseState;
  prevPromiseState?: PromiseState | null;
}

// ============================================
// 색상
// ============================================

const STATE_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  pending: { bg: '#fefce8', border: '#eab308', text: '#a16207', icon: '\u23f3' },
  fulfilled: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', icon: '\u2705' },
  rejected: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', icon: '\u274c' },
};

const HANDLER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  then: { bg: '#dbeafe', text: '#1d4ed8', border: '#60a5fa' },
  catch: { bg: '#fef2f2', text: '#b91c1c', border: '#f87171' },
  finally: { bg: '#f3e8ff', text: '#7c3aed', border: '#a78bfa' },
};

// ============================================
// PromiseCard 컴포넌트
// ============================================

interface PromiseCardProps {
  promise: PromiseEntry;
  isNew: boolean;
}

const PromiseCard = memo(function PromiseCard({ promise, isNew }: PromiseCardProps) {
  const stateStyle = STATE_COLORS[promise.state] || STATE_COLORS.pending;

  return (
    <motion.div
      initial={isNew ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border-2 overflow-hidden shadow-sm"
      style={{ backgroundColor: stateStyle.bg, borderColor: stateStyle.border }}
    >
      {/* Promise header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: stateStyle.bg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{stateStyle.icon}</span>
          <span className="font-mono text-sm font-bold" style={{ color: stateStyle.text }}>
            {promise.label || promise.id}
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: 'white',
            color: stateStyle.text,
            border: `1px solid ${stateStyle.border}`,
          }}
        >
          {promise.state}
        </span>
      </div>

      {/* Value */}
      {promise.value !== undefined && (
        <div className="px-3 py-2 bg-white bg-opacity-50 border-t" style={{ borderColor: stateStyle.border }}>
          <span className="text-xs text-gray-500">value: </span>
          <span className="font-mono text-sm font-semibold" style={{ color: stateStyle.text }}>
            {promise.value}
          </span>
        </div>
      )}

      {/* Handlers */}
      {promise.handlers && promise.handlers.length > 0 && (
        <div className="px-3 py-2 space-y-1 bg-white bg-opacity-30 border-t" style={{ borderColor: stateStyle.border }}>
          {promise.handlers.map((handler, i) => {
            const hColor = HANDLER_COLORS[handler.type] || HANDLER_COLORS.then;
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs"
                style={{ backgroundColor: hColor.bg, border: `1px solid ${hColor.border}` }}
              >
                <span className="font-mono font-bold" style={{ color: hColor.text }}>
                  .{handler.type}()
                </span>
                {handler.callback && (
                  <span className="font-mono text-gray-600 truncate">
                    {handler.callback}
                  </span>
                )}
                {handler.status === 'executed' && (
                  <span className="ml-auto text-green-600 font-bold">{'\u2713'}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
});

// ============================================
// PromiseView 메인 컴포넌트
// ============================================

export const PromiseView = memo(function PromiseView({
  promiseState,
  prevPromiseState,
}: PromiseViewProps) {
  const { t } = useTranslation();
  // All hooks called unconditionally (React rules of hooks)
  const prevIds = useMemo(
    () => new Set((prevPromiseState?.promises || []).map((p) => p.id)),
    [prevPromiseState]
  );

  if (!promiseState) {
    return (
      <div className="p-4 text-center text-gray-400">
        <span className="text-4xl mb-2 block">🤝</span>
        <p>{t('visualizer.promise_no_data')}</p>
      </div>
    );
  }

  return (
    <div className="promise-view p-4">
      {/* Header */}
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
        <span>🤝</span>
        <span>{t('visualizer.promise_desc')}</span>
      </div>

      {/* Phase indicator */}
      {promiseState.phase && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-sm text-indigo-700 font-medium"
        >
          📍 {t('visualizer.current_phase')}: {promiseState.phase}
        </motion.div>
      )}

      {/* Promise cards */}
      <div className="space-y-3 mb-4">
        {promiseState.promises.map((promise) => (
          <PromiseCard
            key={promise.id}
            promise={promise}
            isNew={!prevIds.has(promise.id)}
          />
        ))}
      </div>

      {/* Timer */}
      {promiseState.timer && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50"
        >
          <div className="flex items-center gap-2 text-sm">
            <span>{'\u23f0'}</span>
            <span className="text-gray-600">
              {promiseState.timer.label || 'Timer'}
            </span>
            <span className="font-mono text-gray-800 font-bold">
              {promiseState.timer.delay}ms
            </span>
            {promiseState.timer.status === 'fired' && (
              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-bold border border-green-300">
                fired!
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Microtask queue */}
      {promiseState.microtaskQueue && promiseState.microtaskQueue.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4"
        >
          <div className="text-xs text-gray-500 mb-2 font-medium">Microtask Queue</div>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {promiseState.microtaskQueue.map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-200 font-mono text-xs text-purple-700"
              >
                {task}
              </motion.div>
            ))}
            <div className="flex-shrink-0 text-gray-400 text-xs px-1">{'\u2192'} {t('visualizer.execution_order')}</div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-5 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {Object.entries(STATE_COLORS).map(([state, c]) => (
            <div key={state} className="flex items-center gap-1">
              <span>{c.icon}</span>
              <span>{state}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default PromiseView;
