/**
 * QuizCard - 퀴즈 질문 + 선택지 + 결과
 *
 * WHY: Card 래퍼 제거 - Dialog 안에서 사용되므로 중복 방지.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { QuizResult } from './QuizResult';
import type { Quiz } from '@/types/course';

interface QuizCardProps {
  quiz: Quiz;
  onComplete: (isCorrect: boolean) => void;
}

type QuizPhase =
  | { state: 'answering'; selected: number | null }
  | { state: 'result'; selected: number; isCorrect: boolean };

export function QuizCard({ quiz, onComplete }: QuizCardProps) {
  const [phase, setPhase] = useState<QuizPhase>({
    state: 'answering',
    selected: null,
  });

  const handleSelect = (index: number) => {
    if (phase.state === 'answering') {
      setPhase({ state: 'answering', selected: index });
    }
  };

  const handleSubmit = () => {
    if (phase.state === 'answering' && phase.selected !== null) {
      const isCorrect = phase.selected === quiz.correctIndex;
      setPhase({ state: 'result', selected: phase.selected, isCorrect });
    }
  };

  const handleRetry = () => {
    setPhase({ state: 'answering', selected: null });
  };

  const handleContinue = () => {
    if (phase.state === 'result') {
      onComplete(phase.isCorrect);
    }
  };

  return (
    <div className="space-y-6">
        {/* 질문 */}
        <div className="text-lg font-medium">{quiz.question}</div>

        {phase.state === 'answering' ? (
          <>
            {/* 선택지 */}
            <div className="space-y-3">
              {quiz.options.map((option, index) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    phase.selected === index
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        phase.selected === index
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {phase.selected === index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-current"
                        />
                      )}
                    </div>
                    <span className="font-mono">{option.label}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* 제출 버튼 */}
            <Button
              onClick={handleSubmit}
              disabled={phase.selected === null}
              className="w-full"
              size="lg"
            >
              제출하기
            </Button>
          </>
        ) : (
          <QuizResult
            isCorrect={phase.isCorrect}
            explanation={quiz.explanation}
            onContinue={handleContinue}
            onRetry={handleRetry}
          />
        )}
    </div>
  );
}
