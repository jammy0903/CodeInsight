/**
 * useRoundNavigation - Two-round lesson navigation
 *
 * Round 1 (explanation): Code + explanation for ALL steps
 * Round 2 (visualization): Code + visualization for steps WITH viz data
 *
 * Navigation: R1 last → R2 first (or quiz if no viz steps)
 *             R2 first ← R1 last (back)
 *             R2 last → quiz
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { LessonStep } from '@/types';
import { hasVisualizationData } from './useLessonVisualization';

export type LessonRound = 'explanation' | 'visualization';

interface UseRoundNavigationOptions {
  steps: LessonStep[];
  lessonId: string;
  onStepChange?: (stepIndex: number) => void;
  onQuiz?: () => void;
}

interface UseRoundNavigationReturn {
  round: LessonRound;
  /** 0-based index within the current round */
  stepIndex: number;
  /** Mapped index into the full steps[] array */
  actualStepIndex: number;
  /** Total steps in current round */
  totalInRound: number;
  /** Whether visualization round exists */
  hasVizRound: boolean;
  /** Indices of steps with viz data (for R2) */
  vizStepIndices: number[];
  canGoPrev: boolean;
  isLastOverall: boolean;
  goNext: () => void;
  goPrev: () => void;
  reset: () => void;
}

export function useRoundNavigation({
  steps,
  lessonId,
  onStepChange,
  onQuiz,
}: UseRoundNavigationOptions): UseRoundNavigationReturn {
  const [round, setRound] = useState<LessonRound>('explanation');
  const [stepIndex, setStepIndex] = useState(0);

  // Memoize which steps have visualization data
  const vizStepIndices = useMemo(
    () => steps.reduce<number[]>((acc, step, i) => {
      if (hasVisualizationData(step)) acc.push(i);
      return acc;
    }, []),
    [steps]
  );

  const hasVizRound = vizStepIndices.length > 0;

  // Reset when lesson changes
  useEffect(() => {
    setRound('explanation');
    setStepIndex(0);
  }, [lessonId]);

  // Map (round, stepIndex) → actual index in steps[]
  const actualStepIndex = useMemo(() => {
    if (round === 'explanation') {
      return Math.min(stepIndex, steps.length - 1);
    }
    if (vizStepIndices.length === 0) return 0;
    return vizStepIndices[Math.min(stepIndex, vizStepIndices.length - 1)];
  }, [round, stepIndex, steps.length, vizStepIndices]);

  const totalInRound = round === 'explanation'
    ? steps.length
    : vizStepIndices.length;

  const canGoPrev = !(round === 'explanation' && stepIndex === 0);

  const isLastOverall = round === 'visualization'
    ? stepIndex >= vizStepIndices.length - 1
    : !hasVizRound && stepIndex >= steps.length - 1;

  const goNext = useCallback(() => {
    if (round === 'explanation') {
      if (stepIndex < steps.length - 1) {
        const next = stepIndex + 1;
        setStepIndex(next);
        onStepChange?.(next);
      } else {
        if (hasVizRound) {
          setRound('visualization');
          setStepIndex(0);
          onStepChange?.(vizStepIndices[0]);
        } else {
          onQuiz?.();
        }
      }
    } else {
      if (stepIndex < vizStepIndices.length - 1) {
        const next = stepIndex + 1;
        setStepIndex(next);
        onStepChange?.(vizStepIndices[next]);
      } else {
        onQuiz?.();
      }
    }
  }, [round, stepIndex, steps.length, hasVizRound, vizStepIndices, onStepChange, onQuiz]);

  const goPrev = useCallback(() => {
    if (round === 'explanation') {
      if (stepIndex > 0) {
        const prev = stepIndex - 1;
        setStepIndex(prev);
        onStepChange?.(prev);
      }
    } else {
      if (stepIndex > 0) {
        const prev = stepIndex - 1;
        setStepIndex(prev);
        onStepChange?.(vizStepIndices[prev]);
      } else {
        const lastR1 = steps.length - 1;
        setRound('explanation');
        setStepIndex(lastR1);
        onStepChange?.(lastR1);
      }
    }
  }, [round, stepIndex, steps.length, vizStepIndices, onStepChange]);

  const reset = useCallback(() => {
    setRound('explanation');
    setStepIndex(0);
  }, []);

  return {
    round,
    stepIndex,
    actualStepIndex,
    totalInRound,
    hasVizRound,
    vizStepIndices,
    canGoPrev,
    isLastOverall,
    goNext,
    goPrev,
    reset,
  };
}
