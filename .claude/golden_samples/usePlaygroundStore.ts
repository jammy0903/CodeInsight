/**
 * usePlaygroundStore.ts
 *
 * CodeInsight 플레이그라운드 상태 관리 (Zustand)
 * - 코드, 언어, 실행 결과, 현재 단계
 * - 비동기 액션 (API 호출)
 * - 단계별 네비게이션
 */

import { create } from 'zustand';
import { api } from '@/services/api';

/**
 * 실행 단계 인터페이스
 */
interface ExecutionStep {
  step: number;
  line: number;
  column: number;
  variables: Record<string, VariableValue>;
  memory: MemoryState;
  callStack: CallStackFrame[];
}

interface VariableValue {
  type: string;
  value: any;
}

interface MemoryState {
  stack: Map<number, any>;
  heap: Map<number, any>;
}

interface CallStackFrame {
  function: string;
  file: string;
  line: number;
}

/**
 * 스토어 인터페이스
 */
interface PlaygroundStore {
  // 상태
  code: string;
  language: 'c' | 'python' | 'js' | 'java';
  isExecuting: boolean;
  steps: ExecutionStep[];
  currentStep: number;
  error: string | null;
  lastExecutionId: string | null;

  // 액션
  setCode: (code: string) => void;
  setLanguage: (language: 'c' | 'python' | 'js' | 'java') => void;

  /**
   * 코드 실행 (비동기)
   * - API 호출
   * - 결과 저장
   * - 에러 처리
   *
   * @throws Error (Toast로 자동 처리됨)
   */
  execute: () => Promise<void>;

  /**
   * 다음 단계로 이동
   * - currentStep 증가
   * - 범위 초과 시 무시
   */
  nextStep: () => void;

  /**
   * 이전 단계로 이동
   * - currentStep 감소
   * - 범위 미만 시 무시
   */
  prevStep: () => void;

  /**
   * 특정 단계로 이동
   * @param step - 이동할 단계 번호
   */
  jumpToStep: (step: number) => void;

  /**
   * 상태 초기화
   */
  reset: () => void;
}

/**
 * 초기 상태
 */
const initialState = {
  code: `// 안녕하세요!\nint main() {\n  int x = 5;\n  return 0;\n}`,
  language: 'c' as const,
  isExecuting: false,
  steps: [],
  currentStep: 0,
  error: null,
  lastExecutionId: null,
};

/**
 * Zustand 스토어 생성
 */
export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
  ...initialState,

  // ✅ 동기 액션들
  setCode: (code: string) => set({ code }),

  setLanguage: (language: 'c' | 'python' | 'js' | 'java') => {
    set({ language, currentStep: 0, steps: [] });
  },

  nextStep: () => {
    const { currentStep, steps } = get();
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

  jumpToStep: (step: number) => {
    const { steps } = get();
    if (step >= 0 && step < steps.length) {
      set({ currentStep: step });
    }
  },

  reset: () => {
    set(initialState);
  },

  /**
   * ✅ 비동기 액션: 코드 실행
   *
   * 흐름:
   * 1. 실행 중 플래그 설정
   * 2. API 호출
   * 3. 결과 저장
   * 4. 에러 처리
   * 5. 항상 실행 중 플래그 해제
   */
  execute: async () => {
    const { code, language } = get();

    // 1️⃣ 유효성 검증
    if (!code.trim()) {
      throw new Error('Code cannot be empty');
    }

    // 2️⃣ 실행 중 상태 설정
    set({ isExecuting: true, error: null, currentStep: 0 });

    try {
      // 3️⃣ API 호출
      const result = await api.executeCode({
        code,
        language,
      });

      // 4️⃣ 결과 저장
      set({
        steps: result.steps,
        lastExecutionId: result.executionId,
        currentStep: 0,
      });
    } catch (error) {
      // 5️⃣ 에러 저장 (Toast로 처리는 호출처에서)
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // 에러 다시 던지기 (호출처에서 Toast 표시)
      throw error;
    } finally {
      // 6️⃣ 실행 중 플래그 해제
      set({ isExecuting: false });
    }
  },
}));

/**
 * ✅ 사용 예시:
 *
 * // 컴포넌트에서
 * const { code, steps, currentStep, isExecuting } = usePlaygroundStore();
 *
 * // 상태 변경
 * usePlaygroundStore.setState({ code: newCode });
 *
 * // 액션 호출
 * const store = usePlaygroundStore.getState();
 * await store.execute();
 * store.nextStep();
 */

/**
 * 설계 원칙:
 *
 * 1. ✅ 단일 책임 원칙
 *    - UI 상태만 관리
 *    - 비즈니스 로직은 API 서비스로 분리
 *
 * 2. ✅ 비동기 패턴
 *    - finally로 상태 정리
 *    - 에러는 throw하여 호출처에서 처리
 *
 * 3. ✅ 상태 불변성
 *    - set()을 통해서만 변경
 *    - 직접 수정 금지
 *
 * 4. ✅ 경계값 처리
 *    - nextStep/prevStep에서 범위 확인
   - jumpToStep에서 유효성 검증
 *
 * 5. ✅ 에러 처리
 *    - 에러 상태 저장
 *    - 호출처에서 Toast 표시
 */
