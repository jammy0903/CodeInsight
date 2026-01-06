/**
 * StepControls - 컴팩트한 스텝 네비게이션
 */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface StepControlsProps {
  currentStep: number;
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
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="step-controls">
      {/* 이전 버튼 */}
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className="step-btn"
        aria-label="이전"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* 중앙: 진행률 바 + 스텝 표시 */}
      <div className="step-progress">
        <div className="step-progress-bar">
          <motion.div
            className="step-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <span className="step-label">{currentStep} / {totalSteps}</span>
      </div>

      {/* 다음/퀴즈 버튼 */}
      {isLastStep ? (
        <button onClick={onGoToQuiz} className="step-btn step-btn-quiz">
          <Sparkles className="w-4 h-4" />
          <span>퀴즈</span>
        </button>
      ) : (
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="step-btn"
          aria-label="다음"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
