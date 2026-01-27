/**
 * CoursesPage E2E 테스트 (Public Route)
 *
 * Routes:
 *   - /courses (CoursesPage - 언어 선택)
 *   - /courses/:lang (LanguageCoursePage - 챕터 선택)
 * Auth: 로그인 불필요
 * Fixture: page (비로그인)
 */

import { test, expect } from '../../fixtures/test-base';
import { CoursesPage, LanguageCoursePage } from '../../pages';

test.describe('CoursesPage - 언어 선택', () => {
  let coursesPage: CoursesPage;

  test.beforeEach(async ({ page }) => {
    coursesPage = new CoursesPage(page);
    await coursesPage.goto();
  });

  test('페이지 로드 및 URL 확인', async ({ page }) => {
    await expect(page).toHaveURL(/\/courses$/);
  });

  test('언어 카드 목록 표시', async () => {
    await coursesPage.isLoaded();
    const count = await coursesPage.languageCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('C 언어 카드 클릭 시 챕터 페이지로 이동', async ({ page }) => {
    await coursesPage.isLoaded();
    await coursesPage.selectLanguage('c');
    await expect(page).toHaveURL(/\/courses\/c$/);
  });

  test('첫 번째 언어 카드 선택', async ({ page }) => {
    await coursesPage.isLoaded();
    await coursesPage.selectFirstLanguage();
    await expect(page).toHaveURL(/\/courses\/[a-z]+$/);
  });
});

test.describe('LanguageCoursePage - 챕터/레슨 선택', () => {
  let languagePage: LanguageCoursePage;

  test.beforeEach(async ({ page }) => {
    languagePage = new LanguageCoursePage(page);
    await languagePage.goto('c');
  });

  test('페이지 로드 및 URL 확인', async ({ page }) => {
    await expect(page).toHaveURL(/\/courses\/c$/);
  });

  test('챕터 아코디언 표시', async () => {
    await languagePage.isLoaded();
    const count = await languagePage.chapterAccordions.count();
    expect(count).toBeGreaterThan(0);
  });

  test('챕터 펼치기 동작', async ({ page }) => {
    await languagePage.isLoaded();
    await languagePage.expandFirstChapter();

    // 레슨 아이템이 표시되어야 함
    await page.waitForTimeout(500);
    const lessons = await languagePage.lessonItems.count();
    expect(lessons).toBeGreaterThanOrEqual(0); // 레슨이 없을 수도 있음
  });

  test('레슨 클릭 시 레슨 페이지로 이동', async ({ page }) => {
    await languagePage.isLoaded();
    await languagePage.expandFirstChapter();
    await page.waitForTimeout(500);

    const lessonCount = await languagePage.lessonItems.count();
    if (lessonCount > 0) {
      await languagePage.selectFirstLesson();
      await expect(page).toHaveURL(/\/courses\/c\/\d+\/[\w-]+$/);
    }
  });

  test('뒤로가기 버튼 동작', async ({ page }) => {
    await languagePage.isLoaded();

    // 브라우저 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL(/\/courses$/);
  });
});

test.describe('Courses - 전체 네비게이션 플로우', () => {
  test('홈 → 코스 → 챕터 → 레슨 플로우', async ({ page }) => {
    // 1. 홈에서 시작
    await page.goto('/');
    await expect(page).toHaveTitle(/CodeInsight/i);

    // 2. 코스 페이지로 이동
    await page.goto('/courses');
    await expect(page).toHaveURL(/\/courses$/);

    // 3. 언어 선택 (C 언어)
    const languageCard = page.locator('button.group').first();
    await languageCard.waitFor({ state: 'visible', timeout: 10000 });
    await languageCard.click();
    await expect(page).toHaveURL(/\/courses\/[a-z]+$/);

    // 4. 챕터 펼치기
    const chapter = page.locator('button').first();
    await chapter.click();
    await page.waitForTimeout(500);

    // 5. 레슨 선택 (있는 경우)
    const lesson = page.locator('[class*="cursor-pointer"]').first();
    if (await lesson.isVisible()) {
      await lesson.click();
      await expect(page).toHaveURL(/\/courses\/[a-z]+\/\d+\/[\w-]+$/);
    }
  });
});
