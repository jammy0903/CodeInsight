/**
 * Playground Store
 * 멀티언어 코드 시뮬레이터 상태 관리
 *
 * 설계 문서: docs/logic/SIMULATOR_EXTENSION.md (Part 3, Section 19)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LessonStep } from '@/types';
import type { SupportedLanguage } from '@/types/simulator';
import type { StackRegisters } from '@/features/visualizers/c';
// ============================================================
// 타입 정의
// ============================================================

/** Playground 상태 */
interface PlaygroundState {
  // === 언어 선택 ===
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;

  // === 코드 (언어별 분리) ===
  codes: Record<SupportedLanguage, string>;
  setCode: (code: string) => void;

  // === stdin (언어별 분리) ===
  stdins: Record<SupportedLanguage, string>;
  setStdin: (stdin: string) => void;

  // === 시뮬레이션 상태 ===
  steps: LessonStep[];
  setSteps: (steps: LessonStep[], stepRegisters?: StackRegisters[]) => void;
  currentStepIndex: number;

  // === 레지스터 (RSP/RBP) ===
  stepRegisters: StackRegisters[];

  // === 실행 상태 ===
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  abortController: AbortController | null;
  setAbortController: (controller: AbortController | null) => void;

  // === 액션 ===
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
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

const DEFAULT_CPP_CODE = `#include <iostream>
#include <vector>
#include <string>
#include <memory>

int main() {
    int x = 42;
    double pi = 3.14;
    std::string name = "CodeInsight";

    std::vector<int> nums = {1, 2, 3};
    nums.push_back(4);

    std::cout << name << ": " << x << std::endl;

    auto ptr = std::make_unique<int>(100);
    std::cout << "ptr: " << *ptr << std::endl;

    return 0;
}`;

const DEFAULT_JAVASCRIPT_CODE = `// Welcome to the JavaScript Visualizer!
// Click 'Run' to see the visualization.

let name = "CodeInsight";
const version = 1.0;
let isAwesome = true;

name = "CodeInsight Rocks!";
`;

// ============================================================
// 스토어 생성
// ============================================================

const DEFAULT_STDINS: Record<SupportedLanguage, string> = {
  c: '',
  cpp: '',
  python: '',
  java: '',
  javascript: '',
  'python-practical': '',
};

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set, get) => ({
      // === 언어 선택 ===
      language: 'c',
      setLanguage: (lang) => {
        set({ language: lang, steps: [], currentStepIndex: 0, error: null });
      },

      // === 코드 (언어별 분리) ===
      codes: {
        c: DEFAULT_C_CODE,
        cpp: DEFAULT_CPP_CODE,
        python: DEFAULT_PYTHON_CODE,
        java: DEFAULT_JAVA_CODE,
        javascript: DEFAULT_JAVASCRIPT_CODE,
        'python-practical': DEFAULT_PYTHON_CODE,
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

      // === stdin (언어별 분리) ===
      stdins: { ...DEFAULT_STDINS },
      setStdin: (stdin) => {
        const { language, stdins } = get();
        set({ stdins: { ...stdins, [language]: stdin } });
      },

      // === 시뮬레이션 상태 ===
      steps: [],
      setSteps: (steps, stepRegisters = []) =>
        set({
          steps,
          stepRegisters,
          currentStepIndex: 0,
          error: null,
        }),
      currentStepIndex: 0,

      // === 레지스터 (RSP/RBP) ===
      stepRegisters: [],

      // === 실행 상태 ===
      isSimulating: false,
      setIsSimulating: (simulating) => set({ isSimulating: simulating }),
      error: null,
      setError: (error) => set({ error }),
      abortController: null,
      setAbortController: (controller) => set({ abortController: controller }),

      // === 액션 ===
      nextStep: () => {
        const { steps, currentStepIndex } = get();
        if (currentStepIndex < steps.length - 1) {
          set({ currentStepIndex: currentStepIndex + 1 });
        }
      },
      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({ currentStepIndex: currentStepIndex - 1 });
        }
      },
      reset: () => {
        const { abortController } = get();
        if (abortController) abortController.abort();
        set({
          steps: [],
          stepRegisters: [],
          currentStepIndex: 0,
          isSimulating: false,
          error: null,
          abortController: null,
        });
      },
    }),
    {
      name: 'codeinsight-playground',
      partialize: (state) => ({
        codes: state.codes,
        stdins: state.stdins,
        language: state.language,
      }),
    }
  )
);

// ============================================================
// 셀렉터 (성능 최적화용)
// ============================================================

/** 현재 코드 */
export const useCurrentCode = () => {
  const language = usePlaygroundStore((s) => s.language);
  const codes = usePlaygroundStore((s) => s.codes);
  return codes[language];
};

/** 스텝 컨트롤 액션 (안정적 참조) */
export function useStepControls() {
  const nextStep = usePlaygroundStore((s) => s.nextStep);
  const prevStep = usePlaygroundStore((s) => s.prevStep);
  const reset = usePlaygroundStore((s) => s.reset);
  const canGoNext = usePlaygroundStore((s) => s.currentStepIndex < s.steps.length - 1);
  const canGoPrev = usePlaygroundStore((s) => s.currentStepIndex > 0);
  return { nextStep, prevStep, reset, canGoNext, canGoPrev };
}
