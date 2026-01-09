/**
 * StepExplanation - 현재 스텝 설명 표시
 * 다크 테마 + 코드 하이라이트
 */

import { motion } from 'framer-motion';
import type { SimulationStep } from '../stores/playgroundStore';

interface StepExplanationProps {
  step: SimulationStep;
}

export function StepExplanation({ step }: StepExplanationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 w-full"
    >
      {/* 코드 */}
      <div className="flex-none">
        <code className="inline-flex items-center px-4 py-2
                        bg-[#2d333b] border border-[#444c56] rounded-lg
                        font-mono text-sm text-[#79c0ff] font-medium">
          {step.code}
        </code>
      </div>

      {/* 화살표 */}
      <div className="flex-none text-[#3fb950] text-lg">→</div>

      {/* 설명 */}
      <div className="flex-1">
        <p className="text-base text-[#e6edf3] leading-relaxed font-medium">
          {step.explanation}
        </p>
      </div>
    </motion.div>
  );
}
