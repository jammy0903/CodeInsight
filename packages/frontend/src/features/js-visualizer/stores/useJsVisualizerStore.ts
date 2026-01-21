import { create } from 'zustand';
import { executeJsCode } from '../services/jsVisualizerService';

interface JsVisualizerState {
  code: string;
  steps: any[]; // TODO: Use JsStep type
  currentStepIndex: number;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  setCode: (code: string) => void;
  runVisualization: () => Promise<void>;
  setStep: (index: number) => void;
}

export const useJsVisualizerStore = create<JsVisualizerState>((set, get) => ({
  code: 'const x = 1;\nlet y = x;\ny = 10;',
  steps: [],
  currentStepIndex: 0,
  status: 'idle',
  error: null,
  setCode: (code) => set({ code }),
  runVisualization: async () => {
    set({ status: 'loading', error: null });
    try {
      const { code } = get();
      const result = await executeJsCode({ code });
      set({
        status: 'success',
        steps: result.steps,
        currentStepIndex: 0,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      set({ status: 'error', error: message });
    }
  },
  setStep: (index) => {
    const { steps } = get();
    if (index >= 0 && index < steps.length) {
      set({ currentStepIndex: index });
    }
  },
}));
