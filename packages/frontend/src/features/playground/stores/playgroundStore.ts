/**
 * Playground Store
 * 멀티언어 코드 시뮬레이터 상태 관리
 *
 * 설계 문서: docs/logic/SIMULATOR_EXTENSION.md (Part 3, Section 19)
 */

import { create } from 'zustand';
import type { LessonStep } from '@/types';
import type { SupportedLanguage } from '@/types/simulator';
import type { StackRegisters } from '@/features/visualizers/c';

// ============================================================
// 타입 정의
// ============================================================

/** 시뮬레이션 스텝 (LessonStep 통합 형식) */
export type SimulationStep = LessonStep;

/** Playground 상태 */
interface PlaygroundState {
  // === 언어 선택 ===
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;

  // === 코드 (언어별 분리) ===
  codes: Record<SupportedLanguage, string>;
  setCode: (code: string) => void;
  getCode: () => string;

  // === 시뮬레이션 상태 ===
  steps: SimulationStep[];
  setSteps: (steps: SimulationStep[], stepRegisters?: StackRegisters[]) => void;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;

  // === 레지스터 (RSP/RBP) ===
  stepRegisters: StackRegisters[];
  registers: StackRegisters;
  setRegisters: (registers: StackRegisters) => void;

  // === 실행 상태 ===
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // === 액션 ===
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  reset: () => void;

  // === 현재 스텝 접근 ===
  getCurrentStep: () => SimulationStep | null;
}

// ============================================================
// 기본 코드
// ============================================================

const DEFAULT_C_CODE = `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 10;
    int y = 20;
    printf("Before: x=%d, y=%d\\n", x, y);
    swap(&x, &y);
    printf("After: x=%d, y=%d\\n", x, y);
    return 0;
}`;

const DEFAULT_PYTHON_CODE = `# 불변 타입 - 참조가 복사되지 않음
x = 42
y = x
x = 100

# 문자열
name = "Alice"
greeting = "Hello"

# 리스트 (가변!) - 참조가 공유됨
numbers = [1, 2, 3]
nums_copy = numbers
numbers[0] = 999

# 튜플 (불변)
point = (10, 20)
coords = point

# 딕셔너리 (가변!)
person = {"name": "Bob", "age": 30}
p = person

# None
empty = None
nothing = empty

# 재참조
z = y
w = numbers
`;

const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        int x = 10;
        System.out.println(x);
    }
}`;

const DEFAULT_JAVASCRIPT_CODE = `// Welcome to the JavaScript Visualizer!
// Click 'Run' to see the visualization.

let name = "CodeInsight";
const version = 1.0;
let isAwesome = true;

name = "CodeInsight Rocks!";
`;

const DEFAULT_PYTHON_PRACTICAL_CODE = `# 실용 파이썬 예제
import os

# 현재 디렉토리의 파일 목록 가져오기
files = os.listdir('.')
print(f"Files in current directory: {files}")
`;

// ============================================================
// 스토어 생성
// ============================================================

export const usePlaygroundStore = create<PlaygroundState>((set, get) => ({
  // === 언어 선택 ===
  language: 'c',
  setLanguage: (lang) => {
    set({ language: lang, steps: [], currentStepIndex: 0, error: null });
  },

  // === 코드 (언어별 분리) ===
  codes: {
    c: DEFAULT_C_CODE,
    python: DEFAULT_PYTHON_CODE,
    java: DEFAULT_JAVA_CODE,
    javascript: DEFAULT_JAVASCRIPT_CODE,
    'python-practical': DEFAULT_PYTHON_PRACTICAL_CODE,
  },
  setCode: (code) => {
    const { language, codes } = get();
    set({
      codes: { ...codes, [language]: code },
      // 코드 변경 시 시뮬레이션 리셋
      steps: [],
      currentStepIndex: 0,
      error: null,
    });
  },
  getCode: () => {
    const { language, codes } = get();
    return codes[language];
  },

  // === 시뮬레이션 상태 ===
  steps: [],
  setSteps: (steps, stepRegisters = []) =>
    set({
      steps,
      stepRegisters,
      currentStepIndex: 0,
      registers: stepRegisters[0] ?? {},
      error: null,
    }),
  currentStepIndex: 0,
  setCurrentStepIndex: (index) => {
    const { stepRegisters } = get();
    set({
      currentStepIndex: index,
      registers: stepRegisters[index] ?? {},
    });
  },

  // === 레지스터 (RSP/RBP) ===
  stepRegisters: [],
  registers: {},
  setRegisters: (registers) => set({ registers }),

  // === 실행 상태 ===
  isSimulating: false,
  setIsSimulating: (simulating) => set({ isSimulating: simulating }),
  error: null,
  setError: (error) => set({ error }),

  // === 액션 ===
  nextStep: () => {
    const { steps, currentStepIndex, stepRegisters } = get();
    if (currentStepIndex < steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      set({
        currentStepIndex: newIndex,
        registers: stepRegisters[newIndex] ?? {},
      });
    }
  },
  prevStep: () => {
    const { currentStepIndex, stepRegisters } = get();
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      set({
        currentStepIndex: newIndex,
        registers: stepRegisters[newIndex] ?? {},
      });
    }
  },
  goToStep: (index) => {
    const { steps, stepRegisters } = get();
    if (index >= 0 && index < steps.length) {
      set({
        currentStepIndex: index,
        registers: stepRegisters[index] ?? {},
      });
    }
  },
  reset: () => {
    set({
      steps: [],
      stepRegisters: [],
      currentStepIndex: 0,
      registers: {},
      isSimulating: false,
      error: null,
    });
  },

  // === 현재 스텝 접근 ===
  getCurrentStep: () => {
    const { steps, currentStepIndex } = get();
    return steps[currentStepIndex] || null;
  },
}));

// ============================================================
// 셀렉터 (성능 최적화용)
// ============================================================

/** 현재 언어 선택 */
export const useLanguage = () => usePlaygroundStore((s) => s.language);

/** 현재 코드 */
export const useCurrentCode = () => {
  const language = usePlaygroundStore((s) => s.language);
  const codes = usePlaygroundStore((s) => s.codes);
  return codes[language];
};

/** 시뮬레이션 상태 - 개별 값으로 반환 */
export function useSimulationState() {
  const steps = usePlaygroundStore((s) => s.steps);
  const currentStepIndex = usePlaygroundStore((s) => s.currentStepIndex);
  const isSimulating = usePlaygroundStore((s) => s.isSimulating);
  const error = usePlaygroundStore((s) => s.error);
  return { steps, currentStepIndex, isSimulating, error };
}

/** 스텝 컨트롤 액션 (안정적 참조) */
export function useStepControls() {
  const nextStep = usePlaygroundStore((s) => s.nextStep);
  const prevStep = usePlaygroundStore((s) => s.prevStep);
  const goToStep = usePlaygroundStore((s) => s.goToStep);
  const reset = usePlaygroundStore((s) => s.reset);
  const canGoNext = usePlaygroundStore((s) => s.currentStepIndex < s.steps.length - 1);
  const canGoPrev = usePlaygroundStore((s) => s.currentStepIndex > 0);
  return { nextStep, prevStep, goToStep, reset, canGoNext, canGoPrev };
}
