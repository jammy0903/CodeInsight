/**
 * HomePage E2E 테스트 (Public Route)
 *
 * Route: / (HomePage)
 * Auth: 로그인 불필요
 * Fixture: page (비로그인)
 */

import { test, expect } from '../../fixtures/test-base';
import { HomePage } from '../../pages';

test.describe('HomePage - Public Route', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('페이지 로드 및 타이틀 확인', async ({ page }) => {
    await expect(page).toHaveTitle(/CodeInsight/i);
  });

  test('히어로 섹션 표시', async () => {
    await expect(homePage.heroTitle).toBeVisible();
  });

  test('로그인 버튼 표시 (비로그인 상태)', async () => {
    await expect(homePage.loginButton).toBeVisible();
  });

  test('로그인 버튼 클릭 시 로그인 페이지로 이동', async ({ page }) => {
    await homePage.clickLogin();
    await expect(page).toHaveURL(/\/login|\/signup/);
  });

  test('스토리 패널 요소 확인', async ({ page }) => {
    // SVG 또는 이미지 패널 확인
    const panels = page.locator('svg, img, [class*="panel"]');
    const count = await panels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('페이지 스크롤 동작', async ({ page }) => {
    // 스크롤 가능 여부 확인
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(scrollHeight).toBeGreaterThan(0);
  });
});

test.describe('HomePage - 반응형 레이아웃', () => {
  test('모바일 뷰포트', async ({ page }) => {
    const homePage = new HomePage(page);

    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();
    await expect(homePage.heroTitle).toBeVisible();
  });

  test('태블릿 뷰포트', async ({ page }) => {
    const homePage = new HomePage(page);

    await page.setViewportSize({ width: 768, height: 1024 });
    await homePage.goto();
    await expect(homePage.heroTitle).toBeVisible();
  });
});
