/**
 * StepExplanation - 현재 스텝 설명 카드
 */

import { motion, AnimatePresence } from 'framer-motion';

interface StepExplanationProps {
  explanation: string;
  stepIndex: number;
}

export function StepExplanation({ explanation, stepIndex }: StepExplanationProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={stepIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="text-sm leading-relaxed text-stack-text"
      >
        {explanation}
      </motion.p>
    </AnimatePresence>
  );
}
