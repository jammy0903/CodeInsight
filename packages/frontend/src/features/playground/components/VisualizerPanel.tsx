/**
 * VisualizerPanel - 언어별 시각화 컴포넌트 라우터
 * 다크 테마 적용
 */

import { motion } from 'framer-motion';
import { usePlaygroundStore } from '../stores/playgroundStore';
import { CMemoryView } from '@/features/visualizers/c';
import type { CStep } from '@/types';

export function VisualizerPanel() {
  const { language, steps, currentStepIndex } = usePlaygroundStore();
  const currentStep = steps[currentStepIndex];

  if (!currentStep) {
    return null;
  }

  // 언어별 시각화 컴포넌트 분기
  switch (language) {
    case 'c':
      return <CMemoryView step={currentStep as CStep} />;
    case 'python':
      return <PyReferenceViewPlaceholder />;
    case 'java':
      return <JavaHeapViewPlaceholder />;
    default:
      return null;
  }
}

// ============================================================
// 임시 플레이스홀더 컴포넌트 (Python, Java - Phase 2)
// ============================================================

function PyReferenceViewPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col items-center justify-center
                 bg-gradient-to-br from-[#3fb950]/5 to-[#3fb950]/10
                 rounded-xl border border-[#3fb950]/20 backdrop-blur-sm"
    >
      <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-[#3fb950] to-[#238636]
                      flex items-center justify-center shadow-lg shadow-[#3fb950]/20">
        <span className="text-3xl">🐍</span>
      </div>
      <h3 className="text-lg font-medium text-[#3fb950] mb-2">
        Python Object Reference
      </h3>
      <p className="text-sm text-[#8b949e] mb-4">
        Names → Objects 참조 시각화
      </p>
      <span className="px-3 py-1 text-xs text-[#484f58] bg-[#21262d] rounded-full border border-[#30363d]">
        Coming Soon
      </span>
    </motion.div>
  );
}

function JavaHeapViewPlaceholder() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col items-center justify-center
                 bg-gradient-to-br from-[#f0883e]/5 to-[#f0883e]/10
                 rounded-xl border border-[#f0883e]/20 backdrop-blur-sm"
    >
      <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-[#f0883e] to-[#db6d28]
                      flex items-center justify-center shadow-lg shadow-[#f0883e]/20">
        <span className="text-3xl">☕</span>
      </div>
      <h3 className="text-lg font-medium text-[#f0883e] mb-2">
        Java Heap View
      </h3>
      <p className="text-sm text-[#8b949e] mb-4">
        Object / Reference 시각화
      </p>
      <span className="px-3 py-1 text-xs text-[#484f58] bg-[#21262d] rounded-full border border-[#30363d]">
        Coming Soon
      </span>
    </motion.div>
  );
}
