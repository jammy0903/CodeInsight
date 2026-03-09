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

import { useState, useCallback, useMemo } from 'react';
import type { LessonStep } from '@/types';
import { hasVisualizationData } from '../utils/visualizationData';

export type LessonRound = 'explanation' | 'visualization';

interface UseRoundNavigationOptions {
  steps: LessonStep[];
  lessonId: string;
  onStepChange?: (stepIndex: number) => void;
  onQuiz?: () => void;
  forceSingleRound?: boolean;
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
  goToExplanationStart: () => void;
  goToVisualizationStart: () => void;
  reset: () => void;
}

interface RoundState {
  lessonKey: string;
  round: LessonRound;
  stepIndex: number;
}

export function useRoundNavigation({
  steps,
  lessonId,
  onStepChange,
  onQuiz,
  forceSingleRound = false,
}: UseRoundNavigationOptions): UseRoundNavigationReturn {
  const lessonKey = lessonId || '__default_lesson__';
  const [roundState, setRoundState] = useState<RoundState>(() => ({
    lessonKey,
    round: 'explanation',
    stepIndex: 0,
  }));

  const round = roundState.lessonKey === lessonKey ? roundState.round : 'explanation';
  const stepIndex = roundState.lessonKey === lessonKey ? roundState.stepIndex : 0;

  const updateRoundState = useCallback(
    (updater: (prev: Omit<RoundState, 'lessonKey'>) => Omit<RoundState, 'lessonKey'>) => {
      setRoundState((prev) => {
        const base = prev.lessonKey === lessonKey
          ? { round: prev.round, stepIndex: prev.stepIndex }
          : { round: 'explanation' as LessonRound, stepIndex: 0 };
        const next = updater(base);
        return { lessonKey, ...next };
      });
    },
    [lessonKey]
  );

  // Memoize which steps have visualization data
  const vizStepIndices = useMemo(
    () => steps.reduce<number[]>((acc, step, i) => {
      if (hasVisualizationData(step)) acc.push(i);
      return acc;
    }, []),
    [steps]
  );

  const hasVizRound = !forceSingleRound && vizStepIndices.length > 0;

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
        updateRoundState((prev) => ({ ...prev, stepIndex: next }));
        onStepChange?.(next);
      } else {
        if (hasVizRound) {
          updateRoundState(() => ({ round: 'visualization', stepIndex: 0 }));
          onStepChange?.(vizStepIndices[0]);
        } else {
          onQuiz?.();
        }
      }
    } else {
      if (stepIndex < vizStepIndices.length - 1) {
        const next = stepIndex + 1;
        updateRoundState((prev) => ({ ...prev, stepIndex: next }));
        onStepChange?.(vizStepIndices[next]);
      } else {
        onQuiz?.();
      }
    }
  }, [round, stepIndex, steps.length, hasVizRound, vizStepIndices, onStepChange, onQuiz, updateRoundState]);

  const goPrev = useCallback(() => {
    if (round === 'explanation') {
      if (stepIndex > 0) {
        const prev = stepIndex - 1;
        updateRoundState((current) => ({ ...current, stepIndex: prev }));
        onStepChange?.(prev);
      }
    } else {
      if (stepIndex > 0) {
        const prev = stepIndex - 1;
        updateRoundState((current) => ({ ...current, stepIndex: prev }));
        onStepChange?.(vizStepIndices[prev]);
      } else {
        const lastR1 = steps.length - 1;
        updateRoundState(() => ({ round: 'explanation', stepIndex: lastR1 }));
        onStepChange?.(lastR1);
      }
    }
  }, [round, stepIndex, steps.length, vizStepIndices, onStepChange, updateRoundState]);

  const goToExplanationStart = useCallback(() => {
    updateRoundState(() => ({ round: 'explanation', stepIndex: 0 }));
    onStepChange?.(0);
  }, [onStepChange, updateRoundState]);

  const goToVisualizationStart = useCallback(() => {
    if (!hasVizRound || vizStepIndices.length === 0) return;
    updateRoundState(() => ({ round: 'visualization', stepIndex: 0 }));
    onStepChange?.(vizStepIndices[0]);
  }, [hasVizRound, vizStepIndices, onStepChange, updateRoundState]);

  const reset = useCallback(() => {
    updateRoundState(() => ({ round: 'explanation', stepIndex: 0 }));
  }, [updateRoundState]);

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
    goToExplanationStart,
    goToVisualizationStart,
    reset,
  };
}
