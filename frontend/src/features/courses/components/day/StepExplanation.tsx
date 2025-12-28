/**
 * StepExplanation - 현재 스텝 설명 카드
 */

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface StepExplanationProps {
  explanation: string;
  stepIndex: number;
}

export function StepExplanation({ explanation, stepIndex }: StepExplanationProps) {
  return (
    <div className="p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm leading-relaxed"
          >
            {explanation}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
