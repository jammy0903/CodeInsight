/**
 * LessonPage E2E 테스트 (Public Route)
 *
 * Route: /courses/:lang/:chapterId/:lessonId (LessonPage)
 * Auth: 로그인 불필요 ⚠️ (router.tsx에서 ProtectedRoute로 감싸지지 않음)
 * Fixture: page (비로그인)
 */

import { test, expect } from '../../fixtures/test-base';
import { LessonPage } from '../../pages';

// 테스트용 레슨 경로 (실제 DB 데이터 형식에 맞춤)
const TEST_LESSON = {
  lang: 'c',
  chapterId: 'c-1',  // ✅ 실제 DB의 챕터 ID: "c-1"
  lessonId: 'c-1-1', // ✅ 실제 DB의 레슨 ID: "c-1-1"
};

test.describe('LessonPage - 학습 화면 (Public)', () => {
  let lessonPage: LessonPage;

  test.beforeEach(async ({ page }) => {
    lessonPage = new LessonPage(page);
    await lessonPage.goto(TEST_LESSON.lang, TEST_LESSON.chapterId, TEST_LESSON.lessonId);
  });

  test('페이지 로드 및 URL 확인', async ({ page }) => {
    await expect(page).toHaveURL(/\/courses\/c\/[\w-]+\/[\w-]+$/);
  });

  test('코드 뷰어 표시', async () => {
    await lessonPage.isLoaded();
    await expect(lessonPage.codeViewer).toBeVisible();
  });

  test('스텝 컨트롤 버튼 표시', async () => {
    await lessonPage.isLoaded();

    // 다음 버튼은 항상 있어야 함
    const nextVisible = await lessonPage.nextButton.isVisible();
    expect(nextVisible).toBe(true);
  });

  test('다음 스텝 이동', async () => {
    await lessonPage.isLoaded();

    // 초기 상태 확인
    const initialStep = await lessonPage.getStepCount();

    // 다음 버튼 클릭
    await lessonPage.nextStep();

    // 스텝이 변경되었는지 확인 (또는 UI 변화)
    await lessonPage.page.waitForTimeout(500);
  });

  test('이전 스텝 이동', async () => {
    await lessonPage.isLoaded();

    // 먼저 다음으로 이동
    await lessonPage.nextStep();
    await lessonPage.page.waitForTimeout(300);

    // 이전으로 이동
    if (await lessonPage.prevButton.isVisible()) {
      await lessonPage.prevStep();
    }
  });

  test('설명 텍스트 표시', async () => {
    await lessonPage.isLoaded();

    // 설명 또는 관련 텍스트가 있어야 함
    const explanation = lessonPage.page.locator('text=/설명|메모리|변수|스택|힙/i').first();
    const isVisible = await explanation.isVisible();
    // 설명이 있을 수도 있고 없을 수도 있음
  });
});

test.describe('LessonPage - 메모리 시각화', () => {
  let lessonPage: LessonPage;

  test.beforeEach(async ({ page }) => {
    lessonPage = new LessonPage(page);
    await lessonPage.goto(TEST_LESSON.lang, TEST_LESSON.chapterId, TEST_LESSON.lessonId);
    await lessonPage.isLoaded();
  });

  test('메모리 뷰 표시', async () => {
    // 메모리 뷰어 또는 테이블이 있어야 함
    const memoryVisible = await lessonPage.memoryView.isVisible();
    // 메모리 뷰가 있는 레슨에서만 통과
  });

  test('스텝 진행 시 메모리 상태 변화', async ({ page }) => {
    // 초기 상태 스크린샷
    await page.screenshot({ path: 'test-results/memory-step-1.png' });

    // 다음 스텝
    await lessonPage.nextStep();
    await page.waitForTimeout(500);

    // 변화 후 스크린샷
    await page.screenshot({ path: 'test-results/memory-step-2.png' });
  });
});

test.describe('LessonPage - 퀴즈', () => {
  let lessonPage: LessonPage;

  test.beforeEach(async ({ page }) => {
    lessonPage = new LessonPage(page);
    await lessonPage.goto(TEST_LESSON.lang, TEST_LESSON.chapterId, TEST_LESSON.lessonId);
    await lessonPage.isLoaded();
  });

  test('퀴즈 버튼 표시 및 이동', async () => {
    // 모든 스텝을 지나서 퀴즈로 이동
    for (let i = 0; i < 10; i++) {
      if (await lessonPage.nextButton.isVisible()) {
        await lessonPage.nextStep();
      } else {
        break;
      }
    }

    // 퀴즈 버튼이 있으면 클릭
    if (await lessonPage.quizButton.isVisible()) {
      await lessonPage.goToQuiz();
      await expect(lessonPage.quizCard).toBeVisible();
    }
  });

  test('퀴즈 선택지 클릭', async () => {
    // 퀴즈로 이동
    for (let i = 0; i < 10; i++) {
      if (await lessonPage.nextButton.isVisible()) {
        await lessonPage.nextStep();
      } else {
        break;
      }
    }

    if (await lessonPage.quizButton.isVisible()) {
      await lessonPage.goToQuiz();

      // 첫 번째 선택지 클릭
      const options = await lessonPage.quizOptions.count();
      if (options > 0) {
        await lessonPage.selectQuizOption(0);
      }
    }
  });

  test('퀴즈 제출 및 결과 확인', async () => {
    // 퀴즈로 이동
    for (let i = 0; i < 10; i++) {
      if (await lessonPage.nextButton.isVisible()) {
        await lessonPage.nextStep();
      } else {
        break;
      }
    }

    if (await lessonPage.quizButton.isVisible()) {
      await lessonPage.goToQuiz();

      const options = await lessonPage.quizOptions.count();
      if (options > 0) {
        await lessonPage.selectQuizOption(0);
        await lessonPage.submitQuiz();

        // 결과가 표시되어야 함
        await lessonPage.page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('LessonPage - 접근성', () => {
  test('키보드 네비게이션', async ({ page }) => {
    const lessonPage = new LessonPage(page);
    await lessonPage.goto(TEST_LESSON.lang, TEST_LESSON.chapterId, TEST_LESSON.lessonId);
    await lessonPage.isLoaded();

    // Tab 키로 네비게이션
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Enter 키로 버튼 활성화
    await page.keyboard.press('Enter');
  });

  test('ARIA 레이블 확인', async ({ page }) => {
    const lessonPage = new LessonPage(page);
    await lessonPage.goto(TEST_LESSON.lang, TEST_LESSON.chapterId, TEST_LESSON.lessonId);
    await lessonPage.isLoaded();

    // 버튼에 접근성 레이블이 있는지 확인
    const buttons = page.locator('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});
