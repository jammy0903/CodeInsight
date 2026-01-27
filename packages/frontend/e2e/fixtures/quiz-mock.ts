/**
 * Standalone Quiz API 모킹 Fixture
 * 퀴즈 시스템의 모든 API 엔드포인트를 모킹하여 테스트 데이터 제공
 *
 * WHY: 실제 DB 없이 빠르고 안정적인 E2E 테스트
 * - 일관된 테스트 데이터
 * - 네트워크 지연 없음
 * - 다양한 시나리오 시뮬레이션 (에러, 빈 데이터 등)
 */

import { Page } from '@playwright/test';

// === 모킹 데이터 타입 ===

interface ChapterStatistics {
  chapterId: string;
  chapterTitle: string;
  totalQuizzes: number;
  attemptedQuizzes: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  lastAttemptedAt: string | null;
}

interface StandaloneQuiz {
  id: string;
  language: string;
  quizType: string;
  chapterId: string;
  chapterTitle: string;
  question: string;
  options: string[] | null;
  answer: string;
  explanation: string;
  concepts: string[];
  difficulty: string;
  orderNum: number;
  lastAttempt: {
    isCorrect: boolean;
    attemptNumber: number;
    createdAt: string;
  } | null;
}

interface WeakConcept {
  concept: string;
  totalAttempts: number;
  wrongAttempts: number;
  errorRate: number;
  uniqueQuizzes: number;
  relatedQuizzes: Array<{
    quizId: string;
    question: string;
    lastAttempt: {
      isCorrect: boolean;
      createdAt: string;
    };
  }>;
}

// === 테스트 데이터 생성기 ===

/**
 * C 언어 OX 퀴즈 챕터 통계 생성
 */
function generateChapterStatistics(withData: boolean = true): ChapterStatistics[] {
  const baseChapters: ChapterStatistics[] = [
    {
      chapterId: 'c-var',
      chapterTitle: '변수와 자료형',
      totalQuizzes: 10,
      attemptedQuizzes: withData ? 5 : 0,
      correctCount: withData ? 4 : 0,
      wrongCount: withData ? 1 : 0,
      accuracy: withData ? 80 : 0,
      lastAttemptedAt: withData ? new Date().toISOString() : null,
    },
    {
      chapterId: 'c-operator',
      chapterTitle: '연산자',
      totalQuizzes: 8,
      attemptedQuizzes: withData ? 3 : 0,
      correctCount: withData ? 2 : 0,
      wrongCount: withData ? 1 : 0,
      accuracy: withData ? 67 : 0,
      lastAttemptedAt: withData ? new Date(Date.now() - 3600000).toISOString() : null,
    },
    {
      chapterId: 'c-control',
      chapterTitle: '제어문',
      totalQuizzes: 12,
      attemptedQuizzes: 0,
      correctCount: 0,
      wrongCount: 0,
      accuracy: 0,
      lastAttemptedAt: null,
    },
  ];

  return baseChapters;
}

/**
 * C 언어 OX 퀴즈 데이터 생성 (챕터별)
 */
function generateOXQuizzes(chapterId: string, withLastAttempt: boolean = false): StandaloneQuiz[] {
  const chapterData: Record<string, { title: string; quizzes: Array<{ question: string; answer: string; explanation: string; concepts: string[] }> }> = {
    'c-var': {
      title: '변수와 자료형',
      quizzes: [
        {
          question: 'int 자료형은 정수를 저장한다.',
          answer: 'true',
          explanation: 'int는 integer의 약자로 정수를 저장하는 자료형입니다.',
          concepts: ['int', '자료형', '정수'],
        },
        {
          question: 'C 언어에서 변수명은 숫자로 시작할 수 있다.',
          answer: 'false',
          explanation: '변수명은 문자 또는 밑줄(_)로 시작해야 하며, 숫자로 시작할 수 없습니다.',
          concepts: ['변수', '명명규칙'],
        },
        {
          question: 'float는 실수를 저장하는 자료형이다.',
          answer: 'true',
          explanation: 'float는 부동소수점(floating-point) 실수를 저장합니다.',
          concepts: ['float', '실수', '자료형'],
        },
        {
          question: 'char 자료형은 1바이트 크기이다.',
          answer: 'true',
          explanation: 'char는 문자 하나를 저장하며, 크기는 1바이트입니다.',
          concepts: ['char', '자료형', '메모리'],
        },
        {
          question: '변수 선언 시 반드시 초기값을 할당해야 한다.',
          answer: 'false',
          explanation: '변수 선언만 하고 나중에 값을 할당할 수 있습니다. 단, 초기화하지 않으면 쓰레기 값이 들어있습니다.',
          concepts: ['변수', '초기화'],
        },
        {
          question: 'double은 float보다 더 큰 범위의 실수를 저장할 수 있다.',
          answer: 'true',
          explanation: 'double은 8바이트로 float(4바이트)보다 두 배 큰 정밀도를 가집니다.',
          concepts: ['double', 'float', '정밀도'],
        },
        {
          question: 'sizeof 연산자로 자료형의 크기를 알 수 있다.',
          answer: 'true',
          explanation: 'sizeof는 자료형이나 변수의 바이트 크기를 반환하는 연산자입니다.',
          concepts: ['sizeof', '연산자'],
        },
        {
          question: 'const 키워드를 사용하면 변수의 값을 변경할 수 있다.',
          answer: 'false',
          explanation: 'const는 상수를 선언하며, 한 번 초기화하면 값을 변경할 수 없습니다.',
          concepts: ['const', '상수'],
        },
        {
          question: '전역 변수는 프로그램 전체에서 접근 가능하다.',
          answer: 'true',
          explanation: '전역 변수는 함수 밖에서 선언되며, 모든 함수에서 접근 가능합니다.',
          concepts: ['전역변수', 'scope'],
        },
        {
          question: 'auto 키워드는 지역 변수의 기본 저장 클래스이다.',
          answer: 'true',
          explanation: 'auto는 지역 변수의 기본 저장 클래스이지만, 명시적으로 쓰지 않아도 자동 적용됩니다.',
          concepts: ['auto', '저장클래스'],
        },
      ],
    },
    'c-operator': {
      title: '연산자',
      quizzes: [
        {
          question: '++ 연산자는 변수의 값을 1 증가시킨다.',
          answer: 'true',
          explanation: '증가 연산자 ++는 변수의 값을 1 증가시킵니다.',
          concepts: ['증가연산자', '연산자'],
        },
        {
          question: '% 연산자는 나머지를 구하는 연산자이다.',
          answer: 'true',
          explanation: '모듈로 연산자 %는 나눗셈의 나머지를 반환합니다.',
          concepts: ['모듈로', '산술연산자'],
        },
        {
          question: '&& 연산자는 논리 OR 연산이다.',
          answer: 'false',
          explanation: '&&는 논리 AND 연산자이며, ||가 논리 OR 연산자입니다.',
          concepts: ['논리연산자', 'AND'],
        },
        {
          question: '== 연산자는 값의 동등성을 비교한다.',
          answer: 'true',
          explanation: '== 연산자는 두 값이 같은지 비교하는 관계 연산자입니다.',
          concepts: ['비교연산자', '동등성'],
        },
        {
          question: '= 연산자는 값의 비교를 수행한다.',
          answer: 'false',
          explanation: '=는 할당 연산자이며, ==가 비교 연산자입니다.',
          concepts: ['할당연산자', '비교연산자'],
        },
        {
          question: '! 연산자는 논리 부정을 수행한다.',
          answer: 'true',
          explanation: '!는 NOT 연산자로 true를 false로, false를 true로 바꿉니다.',
          concepts: ['논리연산자', 'NOT'],
        },
        {
          question: '비트 AND 연산자는 &이다.',
          answer: 'true',
          explanation: '&는 비트 AND 연산자이며, &&는 논리 AND 연산자입니다.',
          concepts: ['비트연산자', 'AND'],
        },
        {
          question: '삼항 연산자의 형식은 조건 ? 참 : 거짓 이다.',
          answer: 'true',
          explanation: '삼항 연산자(? :)는 조건에 따라 두 값 중 하나를 선택합니다.',
          concepts: ['삼항연산자', '조건연산자'],
        },
      ],
    },
  };

  const chapter = chapterData[chapterId];
  if (!chapter) return [];

  return chapter.quizzes.map((quiz, idx) => ({
    id: `ox-${chapterId}-q${idx + 1}`,
    language: 'c',
    quizType: 'ox',
    chapterId,
    chapterTitle: chapter.title,
    question: quiz.question,
    options: null,
    answer: quiz.answer,
    explanation: quiz.explanation,
    concepts: quiz.concepts,
    difficulty: idx < 3 ? 'easy' : idx < 7 ? 'medium' : 'hard',
    orderNum: idx + 1,
    lastAttempt: withLastAttempt && idx < 3 ? {
      isCorrect: idx % 2 === 0,
      attemptNumber: idx + 1,
      createdAt: new Date(Date.now() - idx * 3600000).toISOString(),
    } : null,
  }));
}

/**
 * 취약 개념 데이터 생성
 */
function generateWeakConcepts(): WeakConcept[] {
  return [
    {
      concept: '포인터',
      totalAttempts: 15,
      wrongAttempts: 10,
      errorRate: 67,
      uniqueQuizzes: 8,
      relatedQuizzes: [
        {
          quizId: 'ox-c-ptr-q1',
          question: '포인터는 메모리 주소를 저장한다.',
          lastAttempt: {
            isCorrect: false,
            createdAt: new Date().toISOString(),
          },
        },
        {
          quizId: 'ox-c-ptr-q2',
          question: '*는 포인터 역참조 연산자이다.',
          lastAttempt: {
            isCorrect: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        },
      ],
    },
    {
      concept: '비트연산자',
      totalAttempts: 10,
      wrongAttempts: 6,
      errorRate: 60,
      uniqueQuizzes: 5,
      relatedQuizzes: [
        {
          quizId: 'ox-c-operator-q7',
          question: '비트 AND 연산자는 &이다.',
          lastAttempt: {
            isCorrect: false,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
        },
      ],
    },
    {
      concept: '논리연산자',
      totalAttempts: 12,
      wrongAttempts: 5,
      errorRate: 42,
      uniqueQuizzes: 6,
      relatedQuizzes: [
        {
          quizId: 'ox-c-operator-q3',
          question: '&& 연산자는 논리 OR 연산이다.',
          lastAttempt: {
            isCorrect: false,
            createdAt: new Date(Date.now() - 10800000).toISOString(),
          },
        },
      ],
    },
  ];
}

// === 모킹 시나리오 ===

/**
 * Standalone Quiz API를 모킹
 * @param page Playwright Page 객체
 * @param scenario 시나리오 타입
 */
export async function mockStandaloneQuizAPIs(
  page: Page,
  scenario: 'with-data' | 'no-data' | 'error' | 'loading' = 'with-data'
) {
  const baseUrl = '**/api/v1/standalone-quizzes';

  console.log(`[Quiz Mock] Setting up API mocks with scenario: ${scenario}`);

  // 1. GET /chapters - 챕터 통계 조회
  await page.route(`${baseUrl}/chapters*`, async (route) => {
    console.log(`[Quiz Mock] Intercepted chapters request: ${route.request().url()}`);
    if (scenario === 'error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to load chapters',
        }),
      });
      return;
    }

    const withData = scenario === 'with-data';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        chapters: generateChapterStatistics(withData),
      }),
    });
  });

  // 2. GET /quizzes - 퀴즈 목록 조회
  await page.route(`${baseUrl}?*`, async (route) => {
    if (scenario === 'error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to load quizzes',
        }),
      });
      return;
    }

    // URL에서 chapterId 파라미터 추출
    const url = new URL(route.request().url());
    const chapterId = url.searchParams.get('chapterId') || 'c-var';
    const withLastAttempt = scenario === 'with-data';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        quizzes: generateOXQuizzes(chapterId, withLastAttempt),
      }),
    });
  });

  // 3. POST /attempt - 퀴즈 시도 기록
  await page.route(`${baseUrl}/attempt`, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    if (scenario === 'error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to record attempt',
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: `attempt-${Date.now()}`,
        attemptNumber: 1,
        createdAt: new Date().toISOString(),
      }),
    });
  });

  // 4. GET /weak-concepts - 취약 개념 분석
  await page.route(`${baseUrl}/weak-concepts*`, async (route) => {
    if (scenario === 'error') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to analyze weak concepts',
        }),
      });
      return;
    }

    const weakConcepts = scenario === 'with-data' ? generateWeakConcepts() : [];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ weakConcepts }),
    });
  });
}
