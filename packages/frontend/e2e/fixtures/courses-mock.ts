/**
 * Courses API 모킹 Fixture
 * 레슨 및 챕터 데이터 제공
 *
 * Zod 스키마 검증을 통과하는 데이터 구조 사용
 */

import { Page } from '@playwright/test';

/**
 * Courses API 모킹 설정
 * - GET /api/v1/courses/chapters/{chapterId}
 * - GET /api/v1/courses/lessons/{lessonId}
 */
export async function mockCoursesAPIs(page: Page) {
  console.log('[Courses Mock] Setting up API mocks');

  const now = new Date().toISOString();

  // =============================================
  // Lesson 데이터 (LessonFull 스키마)
  // =============================================
  const lessons = {
    'c-1-1': {
      // Lesson 필드 (필수)
      id: 'c-1-1',
      chapterId: 'c-1',
      title: '정수형 변수',
      description: 'int, long, short 등 정수형 변수 학습',
      difficulty: 'basic' as const, // ✅ "basic", "intermediate", "advanced" 중 하나
      order: 1, // ✅ 필수
      isActive: true, // ✅ 필수
      createdAt: now, // ✅ ISO 날짜 필수
      updatedAt: now, // ✅ ISO 날짜 필수

      // LessonContent 객체 (✅ 수정: 문자열 → 객체)
      content: {
        id: 'content-c-1-1',
        lessonId: 'c-1-1',
        code: `#include <stdio.h>

int main() {
    int x = 5;
    int y = 10;
    int sum = x + y;

    printf("x = %d\\n", x);
    printf("y = %d\\n", y);
    printf("sum = %d\\n", sum);

    return 0;
}`,
        language: 'c',
        steps: [
          {
            line: 6, // ✅ 라인 번호 (단일)
            explanation: '변수 x에 5를 할당합니다.',
            highlight: [6],
            keyInsight: '정수형 변수 선언과 초기화',
          },
          {
            line: 7,
            explanation: '변수 y에 10을 할당합니다.',
            highlight: [7],
            keyInsight: '다중 변수 초기화',
          },
          {
            line: 8,
            explanation: 'x + y의 결과를 sum에 할당합니다.',
            highlight: [8],
            keyInsight: '산술 연산 결과 저장',
          },
          {
            line: 10,
            explanation: 'printf로 변수 x의 값을 출력합니다.',
            highlight: [10],
            stdout: 'x = 5',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },

      // 퀴즈 배열 (✅ 수정: 필수 필드)
      quizzes: [
        {
          id: 'quiz-c-1-1-1',
          lessonId: 'c-1-1',
          type: 'multiple_choice' as const,
          question: '위 코드의 실행 결과로 출력되는 sum 값은?',
          options: ['5', '10', '15', '25'],
          answer: '15',
          explanation: 'x(5) + y(10) = 15입니다.',
          order: 1,
          createdAt: now,
        },
      ],
    },

    'c-1-2': {
      // Lesson 필드 (필수)
      id: 'c-1-2',
      chapterId: 'c-1',
      title: '실수형 변수',
      description: 'float, double 등 실수형 변수 학습',
      difficulty: 'intermediate' as const,
      order: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,

      // LessonContent 객체
      content: {
        id: 'content-c-1-2',
        lessonId: 'c-1-2',
        code: `#include <stdio.h>

int main() {
    float pi = 3.14f;
    double e = 2.71828;

    printf("pi = %.2f\\n", pi);
    printf("e = %.5f\\n", e);

    return 0;
}`,
        language: 'c',
        steps: [
          {
            line: 5,
            explanation: 'float 타입의 pi 변수에 3.14를 할당합니다.',
            highlight: [5],
            keyInsight: '실수형 변수의 float 타입',
          },
          {
            line: 6,
            explanation: 'double 타입의 e 변수에 2.71828을 할당합니다.',
            highlight: [6],
            keyInsight: '더 정밀한 실수형 변수의 double 타입',
          },
          {
            line: 8,
            explanation: 'pi 값을 소수점 2자리까지 출력합니다.',
            highlight: [8],
            stdout: 'pi = 3.14',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },

      // 퀴즈 배열 (선택사항으로 빈 배열도 가능)
      quizzes: [
        {
          id: 'quiz-c-1-2-1',
          lessonId: 'c-1-2',
          type: 'predict_output' as const,
          question: '위 코드를 실행했을 때 출력되는 e의 값은?',
          answer: 'e = 2.71828',
          explanation: 'double 타입은 float보다 더 많은 소수 자리를 정확히 표현할 수 있습니다.',
          order: 1,
          createdAt: now,
        },
      ],
    },
  };

  // =============================================
  // Chapter 데이터 (ChapterWithLessons 스키마)
  // =============================================
  const chapters = {
    'c-1': {
      // Chapter 필드 (필수)
      id: 'c-1',
      languageId: 'c',
      title: '변수와 자료형',
      description: 'C 언어의 기본 변수와 자료형 학습',
      order: 1, // ✅ 필수
      isActive: true, // ✅ 필수
      createdAt: now, // ✅ ISO 날짜 필수
      updatedAt: now, // ✅ ISO 날짜 필수

      // 📌 lessons: 문자열 배열 → Lesson 객체 배열로 수정!
      lessons: [
        lessons['c-1-1'],
        lessons['c-1-2'],
      ],
    },
  };

  // =============================================
  // API 라우트 설정
  // =============================================

  // GET /api/v1/courses/chapters/{chapterId}
  await page.route('**/api/v1/courses/chapters/**', (route) => {
    const url = new URL(route.request().url());
    const chapterId = url.pathname.split('/').pop();
    const chapter = chapters[chapterId as keyof typeof chapters];

    if (chapter) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(chapter),
      });
    } else {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Chapter not found' }),
      });
    }
  });

  // GET /api/v1/courses/lessons/{lessonId}
  await page.route('**/api/v1/courses/lessons/**', (route) => {
    const url = new URL(route.request().url());
    const lessonId = url.pathname.split('/').pop();
    const lesson = lessons[lessonId as keyof typeof lessons];

    if (lesson) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(lesson),
      });
    } else {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Lesson not found' }),
      });
    }
  });

  console.log('[Courses Mock] API mocks configured');
}
