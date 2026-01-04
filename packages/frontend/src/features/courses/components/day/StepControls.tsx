/**
 * StepControls - 이전/다음 스텝 버튼 + 진행률
 */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepControlsProps {
  currentStep: number;    // 1부터 시작 (표시용)
  totalSteps: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToQuiz: () => void;
}

export function StepControls({
  currentStep,
  totalSteps,
  canGoPrev,
  canGoNext,
  isLastStep,
  onPrev,
  onNext,
  onGoToQuiz,
}: StepControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
      {/* 이전 버튼 */}
      <motion.div whileTap={canGoPrev ? { scale: 0.95 } : undefined}>
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          이전
        </Button>
      </motion.div>

      {/* 진행률 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Step {currentStep} / {totalSteps}
        </span>
        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* 다음/퀴즈 버튼 */}
      {isLastStep ? (
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button size="sm" onClick={onGoToQuiz} className="gap-1">
            퀴즈 풀기
            <Play className="w-4 h-4" />
          </Button>
        </motion.div>
      ) : (
        <motion.div whileTap={canGoNext ? { scale: 0.95 } : undefined}>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!canGoNext}
            className="gap-1"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
