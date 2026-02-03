/**
 * Simulator Store — 코드 실행 + 스텝 상태
 */

import { create } from 'zustand';
import type { RunResult, Step } from '@/types/index';

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    int sum = x + y;
    printf("Sum: %d\\n", sum);
    return 0;
}`;

interface SimulatorState {
  code: string;
  setCode: (code: string) => void;
  result: RunResult | null;
  setResult: (result: RunResult | null) => void;
  isRunning: boolean;
  setRunning: (running: boolean) => void;
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  code: DEFAULT_CODE,
  setCode: (code) => set({ code }),
  result: null,
  setResult: (result) => set({ result }),
  isRunning: false,
  setRunning: (running) => set({ isRunning: running }),
  steps: [],
  setSteps: (steps) => set({ steps, currentStep: 0 }),
  currentStep: 0,
  setCurrentStep: (step) => set({ currentStep: step }),
  nextStep: () => {
    const { steps, currentStep } = get();
    if (currentStep < steps.length - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },
}));
