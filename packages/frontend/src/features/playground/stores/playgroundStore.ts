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

const LEGACY_DEFAULT_C_CODE = `#include <stdio.h>

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

const LEGACY_DEFAULT_PYTHON_CODE = `# 불변 타입 - 참조가 복사되지 않음
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

const LEGACY_DEFAULT_JAVA_CODE = `import java.util.Scanner;

/**
 * 간단한 은행 계좌 클래스
 */
class BankAccount {
    private String owner;      // 예금주 (캡슐화)
    private long balance;      // 잔액

    public BankAccount(String owner, long initialBalance) {
        this.owner = owner;
        this.balance = initialBalance;
    }

    // 입금 메소드
    public void deposit(long amount) {
        if (amount <= 0) {
            System.out.println("❌ 0원 이하의 금액은 입금할 수 없습니다.");
            return;
        }
        balance += amount;
        System.out.println("💰 [" + amount + "원] 입금 완료. 현재 잔액: " + balance + "원");
    }

    // 출금 메소드
    public void withdraw(long amount) {
        if (amount > balance) {
            System.out.println("⚠️ 잔액이 부족합니다. (현재 잔액: " + balance + "원)");
            return;
        }
        if (amount <= 0) {
            System.out.println("❌ 출금 금액이 올바르지 않습니다.");
            return;
        }
        balance -= amount;
        System.out.println("💸 [" + amount + "원] 출금 완료. 현재 잔액: " + balance + "원");
    }

    // 정보 출력
    public void showInfo() {
        System.out.println("---------------------------");
        System.out.println("👤 예금주: " + owner);
        System.out.println("🏦 현재 잔액: " + balance + "원");
        System.out.println("---------------------------");
    }
}

public class Main {
    public static void main(String[] args) {
        // 1. 계좌 생성
        BankAccount myAccount = new BankAccount("홍길동", 50000);
        myAccount.showInfo();

        // 2. 동작 테스트
        myAccount.deposit(15000);  // 입금
        myAccount.withdraw(20000); // 출금
        myAccount.withdraw(60000); // 잔액 부족 테스트

        // 3. 최종 결과
        myAccount.showInfo();
    }
}`;

const LEGACY_DEFAULT_CPP_CODE = `#include <iostream>
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

const LEGACY_DEFAULT_JAVASCRIPT_CODE = `/**
 * 간단한 은행 계좌 클래스
 */
class BankAccount {
  constructor(owner, initialBalance) {
    this.owner = owner;      // 예금주
    this.balance = initialBalance; // 잔액
  }

  // 입금 메소드
  deposit(amount) {
    if (amount <= 0) {
      console.log("❌ 0원 이하의 금액은 입금할 수 없습니다.");
      return;
    }
    this.balance += amount;
    console.log("💰 [" + amount + "원] 입금 완료. 현재 잔액: " + this.balance + "원");
  }

  // 출금 메소드
  withdraw(amount) {
    if (amount > this.balance) {
      console.log("⚠️ 잔액이 부족합니다. (현재 잔액: " + this.balance + "원)");
      return;
    }
    if (amount <= 0) {
      console.log("❌ 출금 금액이 올바르지 않습니다.");
      return;
    }
    this.balance -= amount;
    console.log("💸 [" + amount + "원] 출금 완료. 현재 잔액: " + this.balance + "원");
  }

  // 정보 출력
  showInfo() {
    console.log("---------------------------");
    console.log("👤 예금주: " + this.owner);
    console.log("🏦 현재 잔액: " + this.balance + "원");
    console.log("---------------------------");
  }
}

// 1. 계좌 생성
const myAccount = new BankAccount("홍길동", 50000);
myAccount.showInfo();

// 2. 동작 테스트
myAccount.deposit(15000);  // 입금
myAccount.withdraw(20000); // 출금
myAccount.withdraw(60000); // 잔액 부족 테스트

// 3. 최종 결과
myAccount.showInfo();
`;

const DEFAULT_C_CODE = `#include <stdio.h>
#include <stdlib.h>

void update(int *valuePtr, int *heapPtr) {
    int local = 3;
    *valuePtr += local;
    *heapPtr = *valuePtr * 2;
    printf("inside: %d %d\\n", *valuePtr, *heapPtr);
}

int main() {
    int x = 5;
    int *ptr = &x;
    int *heapValue = malloc(sizeof(int));
    *heapValue = 10;

    update(ptr, heapValue);
    printf("main: %d %d\\n", x, *heapValue);

    free(heapValue);
    return 0;
}`;

const DEFAULT_PYTHON_CODE = `def update(items, label):
    alias = items
    alias.append(label)
    print("inside", alias, id(alias))

numbers = [1, 2]
other = numbers
text = "Py"
count = 10
same_count = count

update(numbers, text)
print(other, id(numbers), id(other))
print(count, same_count)
`;

const DEFAULT_JAVA_CODE = `class Box {
    String name;
    int value;

    Box(String name, int value) {
        this.name = name;
        this.value = value;
    }
}

public class Main {
    static void update(Box box, int[] numbers) {
        Box alias = box;
        alias.value += numbers[0];
        numbers[1] = alias.value;
        System.out.println(alias.name + " " + alias.value);
    }

    public static void main(String[] args) {
        String label = "box";
        Box box = new Box(label, 10);
        Box same = box;
        int[] numbers = {1, 2};

        update(same, numbers);
        System.out.println(box.value + " " + numbers[1]);
    }
}`;

const DEFAULT_CPP_CODE = `#include <iostream>
#include <memory>
#include <string>
#include <vector>

void grow(std::vector<int>& nums, std::unique_ptr<int>& heapValue) {
    int local = nums[0];
    nums.push_back(local + 2);
    *heapValue += nums.back();
    std::cout << "inside: " << *heapValue << "\\n";
}

int main() {
    int x = 5;
    int& ref = x;
    std::vector<int> nums = {1, 2};
    std::string label = "cpp";
    auto heapValue = std::make_unique<int>(10);

    grow(nums, heapValue);
    ref += nums[1];

    std::cout << label << " " << x << " " << nums.size() << " " << *heapValue << "\\n";
    return 0;
}`;

const DEFAULT_JAVASCRIPT_CODE = `function update(user, numbers) {
  const alias = user;
  alias.score += numbers[0];
  numbers.push(alias.score);
  console.log(alias.name, alias.score);
}

const user = { name: "Ada", score: 10 };
const sameUser = user;
const numbers = [1, 2];

update(sameUser, numbers);
console.log(user.score, numbers.length);
`;

const DEFAULT_PYTHON_PRACTICAL_CODE = `rows = [
    {"name": "Ada", "score": 91},
    {"name": "Lin", "score": 84},
]

passed = []

for row in rows:
    if row["score"] >= 90:
        passed.append(row["name"])

print(passed)
`;

const DEFAULT_CODES: Record<SupportedLanguage, string> = {
  c: DEFAULT_C_CODE,
  cpp: DEFAULT_CPP_CODE,
  python: DEFAULT_PYTHON_CODE,
  java: DEFAULT_JAVA_CODE,
  javascript: DEFAULT_JAVASCRIPT_CODE,
  'python-practical': DEFAULT_PYTHON_PRACTICAL_CODE,
};

const LEGACY_DEFAULT_CODES: Record<SupportedLanguage, string> = {
  c: LEGACY_DEFAULT_C_CODE,
  cpp: LEGACY_DEFAULT_CPP_CODE,
  python: LEGACY_DEFAULT_PYTHON_CODE,
  java: LEGACY_DEFAULT_JAVA_CODE,
  javascript: LEGACY_DEFAULT_JAVASCRIPT_CODE,
  'python-practical': LEGACY_DEFAULT_PYTHON_CODE,
};

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
      codes: { ...DEFAULT_CODES },
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
      version: 2,
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') return persistedState;

        const state = persistedState as {
          codes?: Partial<Record<SupportedLanguage, string>>;
        };

        const nextCodes: Record<SupportedLanguage, string> = { ...DEFAULT_CODES };

        (Object.keys(DEFAULT_CODES) as SupportedLanguage[]).forEach((language) => {
          const saved = state.codes?.[language];
          if (!saved || saved === LEGACY_DEFAULT_CODES[language]) {
            nextCodes[language] = DEFAULT_CODES[language];
            return;
          }
          nextCodes[language] = saved;
        });

        return {
          ...state,
          codes: nextCodes,
        };
      },
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
