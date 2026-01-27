/**
 * AuthPage UI E2E 테스트 (Public Route)
 *
 * Routes:
 *   - /login (AuthPage)
 *   - /signup (AuthPage)
 * Auth: 로그인 불필요 (공개 페이지)
 * Fixture: page (비로그인)
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('AuthPage - 로그인/회원가입 UI', () => {
  test('로그인 페이지 접근', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('회원가입 페이지 접근', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
  });

  test('OAuth 버튼 표시', async ({ page }) => {
    await page.goto('/login');

    // OAuth 로그인 버튼들이 표시되어야 함
    const googleButton = page.locator('button').filter({ hasText: /Google|구글/i });
    const githubButton = page.locator('button').filter({ hasText: /GitHub|깃허브/i });
    const kakaoButton = page.locator('button').filter({ hasText: /Kakao|카카오/i });

    // 최소 하나 이상의 OAuth 버튼이 있어야 함
    const hasGoogle = await googleButton.isVisible();
    const hasGithub = await githubButton.isVisible();
    const hasKakao = await kakaoButton.isVisible();

    expect(hasGoogle || hasGithub || hasKakao).toBe(true);
  });

  test('로그인 페이지 UI 요소', async ({ page }) => {
    await page.goto('/login');

    // 제목 또는 로고
    const title = page.locator('h1, h2, [class*="title"]').first();
    await expect(title).toBeVisible();
  });
});

test.describe('Auth State - 비로그인 상태 확인', () => {
  test('로그아웃 상태에서 홈페이지 - 로그인 버튼 표시', async ({ page }) => {
    await page.goto('/');

    // 로그인 버튼이 표시되어야 함
    const loginButton = page.locator('text=로그인').first();
    await expect(loginButton).toBeVisible();
  });

  test('로그아웃 상태에서 코스 접근 가능', async ({ page }) => {
    // 비로그인 사용자도 코스 열람 가능 (Public Route)
    await page.goto('/courses');
    await expect(page).toHaveURL(/\/courses$/);

    // 언어 카드가 표시되어야 함
    const cards = page.locator('button.group');
    await cards.first().waitFor({ state: 'visible', timeout: 10000 });
  });

  test('로그아웃 상태에서 레슨 접근 가능', async ({ page }) => {
    // 비로그인 사용자도 레슨 열람 가능 (Public Route)
    // Note: 실제 레슨 ID는 DB에 따라 다를 수 있음
    await page.goto('/courses/c/1/c-1-1');

    // 페이지가 로드되고 리다이렉트 되지 않아야 함
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/courses\/c\/\d+\/[\w-]+$/);
  });
});
