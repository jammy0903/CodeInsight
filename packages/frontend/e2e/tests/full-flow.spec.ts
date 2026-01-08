/**
 * CodeInsight 전체 플로우 E2E 테스트
 *
 * 사용자 시나리오 기반 통합 테스트:
 * 1. 홈페이지 → 코스 선택
 * 2. 챕터 선택 → 레슨 선택
 * 3. 레슨 학습 (스텝 이동)
 * 4. 퀴즈 풀기
 * 5. 완료 확인
 */

import { test, expect, TIMEOUTS } from '../fixtures/test-base';
import { HomePage, CoursesPage, LanguageCoursePage, LessonPage } from '../pages';

test.describe('Full User Journey', () => {
  test('비로그인 사용자 학습 플로우', async ({ page }) => {
    // === 1. 홈페이지 ===
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.isLoaded();

    await expect(page).toHaveTitle(/CodeInsight/i);
    await expect(homePage.heroTitle).toBeVisible();

    // 스크린샷: 홈페이지
    await page.screenshot({ path: 'test-results/flow-01-home.png', fullPage: true });

    // === 2. 코스 선택 페이지 ===
    const coursesPage = new CoursesPage(page);
    await coursesPage.goto();
    await coursesPage.isLoaded();

    await expect(page).toHaveURL(/\/courses$/);

    // 스크린샷: 코스 선택
    await page.screenshot({ path: 'test-results/flow-02-courses.png', fullPage: true });

    // C 언어 선택
    await coursesPage.selectLanguage('c');
    await expect(page).toHaveURL(/\/courses\/c$/);

    // === 3. 챕터/레슨 선택 ===
    const languagePage = new LanguageCoursePage(page);
    await languagePage.isLoaded();

    // 스크린샷: 챕터 목록
    await page.screenshot({ path: 'test-results/flow-03-chapters.png', fullPage: true });

    // 첫 번째 챕터 펼치기
    await languagePage.expandFirstChapter();
    await page.waitForTimeout(500);

    // 스크린샷: 챕터 펼침
    await page.screenshot({ path: 'test-results/flow-04-chapter-expanded.png', fullPage: true });

    // 첫 번째 레슨 선택
    const lessonCount = await languagePage.lessonItems.count();
    if (lessonCount > 0) {
      await languagePage.selectFirstLesson();
      await expect(page).toHaveURL(/\/courses\/c\/\d+\/\d+$/);

      // === 4. 레슨 학습 ===
      const lessonPage = new LessonPage(page);
      await lessonPage.isLoaded();

      // 스크린샷: 레슨 시작
      await page.screenshot({ path: 'test-results/flow-05-lesson-start.png', fullPage: true });

      // 코드 뷰어 확인
      await expect(lessonPage.codeViewer).toBeVisible();

      // 스텝 진행 (3단계)
      for (let step = 1; step <= 3; step++) {
        if (await lessonPage.nextButton.isVisible()) {
          await lessonPage.nextStep();
          await page.waitForTimeout(300);
        }
      }

      // 스크린샷: 스텝 진행 후
      await page.screenshot({ path: 'test-results/flow-06-lesson-steps.png', fullPage: true });

      // === 5. 퀴즈 ===
      // 모든 스텝 완료
      for (let i = 0; i < 10; i++) {
        if (await lessonPage.nextButton.isVisible()) {
          await lessonPage.nextStep();
        } else {
          break;
        }
      }

      // 퀴즈 버튼이 있으면 진행
      if (await lessonPage.quizButton.isVisible()) {
        await lessonPage.goToQuiz();

        // 스크린샷: 퀴즈
        await page.screenshot({ path: 'test-results/flow-07-quiz.png', fullPage: true });

        // 첫 번째 선택지 선택
        const optionCount = await lessonPage.quizOptions.count();
        if (optionCount > 0) {
          await lessonPage.selectQuizOption(0);
          await lessonPage.submitQuiz();

          // 스크린샷: 퀴즈 결과
          await page.screenshot({ path: 'test-results/flow-08-quiz-result.png', fullPage: true });
        }
      }
    }

    console.log('✅ Full flow test completed!');
  });

  test('빠른 네비게이션 테스트', async ({ page }) => {
    // URL 직접 접근 테스트
    await page.goto('/courses/c');
    await expect(page).toHaveURL(/\/courses\/c$/);

    await page.goto('/courses');
    await expect(page).toHaveURL(/\/courses$/);

    await page.goto('/');
    await expect(page).toHaveURL('/');
  });

  test('뒤로가기 네비게이션', async ({ page }) => {
    // 홈 → 코스 → 챕터
    await page.goto('/');
    await page.goto('/courses');
    await page.goto('/courses/c');

    // 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL(/\/courses$/);

    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('새로고침 상태 유지', async ({ page }) => {
    // 레슨 페이지로 이동
    await page.goto('/courses/c/1/1');

    // 새로고침
    await page.reload();

    // URL 유지 확인
    await expect(page).toHaveURL(/\/courses\/c\/1\/1$/);
  });
});

test.describe('Error Handling', () => {
  test('잘못된 URL 접근', async ({ page }) => {
    await page.goto('/courses/invalid-lang');

    // 에러 페이지 또는 리다이렉트 확인
    // 실제 앱 동작에 맞게 조정
  });

  test('존재하지 않는 레슨 접근', async ({ page }) => {
    await page.goto('/courses/c/999/999');

    // 에러 처리 확인
  });
});

test.describe('Performance', () => {
  test('페이지 로드 시간', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Homepage load time: ${loadTime}ms`);

    // 5초 이내 로드
    expect(loadTime).toBeLessThan(5000);
  });

  test('코스 페이지 로드 시간', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Courses page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(5000);
  });
});
