/**
 * FlowViewer - Python 실행 흐름 시각화
 *
 * flowIcon, flowLabel, flowDetail을 세로로 연결하여 표시
 */

import { motion } from 'framer-motion';

interface FlowStep {
  line: number;
  flowIcon?: string;
  flowLabel?: string;
  flowDetail?: string;
}

interface FlowViewerProps {
  steps: FlowStep[];
  currentStepIndex: number;
}

export function FlowViewer({ steps, currentStepIndex }: FlowViewerProps) {
  // flowIcon이 있는 스텝만 필터링
  const flowSteps = steps.filter(s => s.flowIcon);

  if (flowSteps.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[var(--theme-dashboard-text-muted)] text-sm">
        실행 흐름 정보가 없습니다
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative">
        {flowSteps.map((step, idx) => {
          const isActive = steps.findIndex(s => s === step) <= currentStepIndex;
          const isCurrent = steps.findIndex(s => s === step) === currentStepIndex;

          return (
            <div key={idx} className="relative">
              {/* 연결선 */}
              {idx < flowSteps.length - 1 && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-8 transition-colors duration-300 ${
                    isActive ? 'bg-emerald-400' : 'bg-[var(--theme-dashboard-progress-bg)]'
                  }`}
                />
              )}

              {/* 플로우 아이템 */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-start gap-3 p-3 rounded-lg mb-2 transition-all duration-300 ${
                  isCurrent
                    ? 'bg-emerald-50 border-2 border-emerald-400 shadow-md'
                    : isActive
                    ? 'bg-[var(--theme-dashboard-card-bg)] border border-[var(--theme-dashboard-card-border)]'
                    : 'bg-white border border-[var(--theme-dashboard-card-border)] opacity-50'
                }`}
              >
                {/* 아이콘 */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-400 shadow-lg'
                      : isActive
                      ? 'bg-emerald-100'
                      : 'bg-[var(--theme-dashboard-section-header-bg)]'
                  }`}
                >
                  {step.flowIcon}
                </div>

                {/* 라벨 + 디테일 */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold text-sm ${
                      isCurrent ? 'text-emerald-700' : 'text-[var(--theme-dashboard-title)]'
                    }`}
                  >
                    {step.flowLabel}
                  </div>
                  {step.flowDetail && (
                    <div
                      className={`text-xs font-mono mt-1 ${
                        isCurrent ? 'text-emerald-600' : 'text-[var(--theme-dashboard-text-muted)]'
                      }`}
                    >
                      {step.flowDetail}
                    </div>
                  )}
                </div>

                {/* 라인 번호 */}
                <div
                  className={`text-xs px-2 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-emerald-200 text-emerald-800'
                      : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-dashboard-text-muted)]'
                  }`}
                >
                  L{step.line}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
