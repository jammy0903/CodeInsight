/**
 * CodeInsight Global Store
 * Zustand 기반 상태 관리
 */

import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import type { Message, RunResult, Step } from '@/types/index';

// App User 타입 (우리 DB의 User)
export interface OAuthAccountInfo {
  provider: string;
  email: string | null;
}

export interface AppUser {
  nickname: string;
  role: 'user' | 'admin';
  oauthAccounts: OAuthAccountInfo[];
}

interface Store {
  // === UI 상태 ===
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // === 사용자 (Firebase + App) ===
  firebaseUser: FirebaseUser | null;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  appUser: AppUser | null;
  setAppUser: (user: AppUser | null) => void;
  needsRegistration: boolean;
  setNeedsRegistration: (needs: boolean) => void;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;

  // === 채팅 ===
  messages: Message[];
  isAiLoading: boolean;
  addMessage: (msg: Message) => void;
  setAiLoading: (loading: boolean) => void;
  clearMessages: () => void;

  // === 코드 시뮬레이터 ===
  code: string;
  setCode: (code: string) => void;
  result: RunResult | null;
  setResult: (result: RunResult | null) => void;
  isRunning: boolean;
  setRunning: (running: boolean) => void;

  // === 시뮬레이션 스텝 ===
  steps: Step[];
  setSteps: (steps: Step[]) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int x = 10;
    int y = 20;
    int sum = x + y;
    printf("Sum: %d\\n", sum);
    return 0;
}`;

export const useStore = create<Store>((set, get) => ({
  // === UI 상태 ===
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // === 사용자 (Firebase + App) ===
  firebaseUser: null,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  appUser: null,
  setAppUser: (user) => set({ appUser: user }),
  needsRegistration: false,
  setNeedsRegistration: (needs) => set({ needsRegistration: needs }),
  authLoading: true,
  setAuthLoading: (loading) => set({ authLoading: loading }),

  // === 채팅 ===
  messages: [],
  isAiLoading: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setAiLoading: (loading) => set({ isAiLoading: loading }),
  clearMessages: () => set({ messages: [] }),

  // === 코드 시뮬레이터 ===
  code: DEFAULT_CODE,
  setCode: (code) => set({ code }),
  result: null,
  setResult: (result) => set({ result }),
  isRunning: false,
  setRunning: (running) => set({ isRunning: running }),

  // === 시뮬레이션 스텝 ===
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
