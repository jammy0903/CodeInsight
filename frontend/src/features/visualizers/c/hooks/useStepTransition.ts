/**
 * useStepTransition Hook
 * 단계 변화 감지 및 애니메이션 트리거
 */

import { useState, useEffect, useRef } from 'react';
import type { Step, AnimationState, MemoryBlock } from '../types';
import { getChangedBlocks } from '../utils';

export function useStepTransition(currentStep: Step | null) {
  const previousStepRef = useRef<Step | null>(null);
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    previousStep: null,
    changedBlocks: [],
    direction: 'forward',
  });

  useEffect(() => {
    if (!currentStep) return;

    const prevStep = previousStepRef.current;

    // 변화 감지
    const changedBlocks = getChangedBlocks(prevStep, currentStep);

    // 방향 감지 (RSP 기준)
    let direction: 'forward' | 'backward' = 'forward';
    if (prevStep) {
      const prevRsp = parseInt(prevStep.rsp.replace('0x', ''), 16);
      const currRsp = parseInt(currentStep.rsp.replace('0x', ''), 16);
      direction = currRsp <= prevRsp ? 'forward' : 'backward';
    }

    // 애니메이션 상태 업데이트
    setAnimationState({
      isAnimating: true,
      previousStep: prevStep,
      changedBlocks,
      direction,
    });

    // 애니메이션 종료
    const timer = setTimeout(() => {
      setAnimationState(prev => ({
        ...prev,
        isAnimating: false,
      }));
    }, 300);

    // 현재 스텝 저장
    previousStepRef.current = currentStep;

    return () => clearTimeout(timer);
  }, [currentStep]);

  return {
    ...animationState,
    isNewBlock: (address: string) => {
      if (!animationState.previousStep) return true;
      const prevAddresses = [
        ...animationState.previousStep.stack.map((b: MemoryBlock) => b.address),
        ...animationState.previousStep.heap.map((b: MemoryBlock) => b.address),
      ];
      return !prevAddresses.includes(address);
    },
    isChangedBlock: (address: string) => animationState.changedBlocks.includes(address),
  };
}
