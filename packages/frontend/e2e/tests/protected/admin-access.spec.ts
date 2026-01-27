/**
 * Admin Route 접근 제어 E2E 테스트 (Protected + Admin Route)
 *
 * Route: /admin (AdminPage)
 * Auth: 로그인 필요 + 관리자 권한 필요 (ProtectedRoute + AdminRoute)
 * Fixture: page (비로그인), authenticatedPage (일반 사용자)
 *
 * Coverage:
 * - 비로그인 사용자 접근 제한
 * - 일반 사용자 접근 제한
 * - 관리자 사용자 접근 허용 (TODO: 관리자 role 모킹 필요)
 */

import { test, expect } from '../../fixtures/test-base';

test.describe('Admin Route - 접근 제어', () => {
  test('비로그인 시 Admin 페이지 접근 제한', async ({ page }) => {
    await page.goto('/admin');

    // ProtectedRoute에 의해 홈 또는 로그인 페이지로 리다이렉트
    // (ProtectedRoute.tsx L28-29: return <Navigate to="/" replace />)
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).toMatch(/\/(login)?$/);
  });

  test('일반 사용자 로그인 후 Admin 페이지 접근 제한', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');

    // AdminRoute에 의해 일반 사용자는 리다이렉트
    // (실제 AdminRoute 구현에 따라 조정 필요)
    await authenticatedPage.waitForTimeout(2000);

    const url = authenticatedPage.url();

    // admin 페이지에 머물지 않아야 함
    // 예상 리다이렉트: /dashboard, /profile, / 등
    expect(url).toMatch(/\/(dashboard|profile|)?$/);
    expect(url).not.toMatch(/\/admin/);
  });

  test.skip('관리자 로그인 후 Admin 페이지 접근 가능', async ({ page }) => {
    // TODO: 관리자 role 모킹 필요
    // 현재 auth-mock.ts의 mockFirebaseAuth는 userId만 받고 role을 지원하지 않음
    // 확장 필요:
    // await mockFirebaseAuth(page, 'admin-user', { role: 'admin' });
    // await page.goto('/admin');
    // await expect(page).toHaveURL(/\/admin/);
    //
    // 또는 백엔드 API 모킹:
    // await page.route('**/api/v1/users/me', async (route) => {
    //   await route.fulfill({
    //     status: 200,
    //     contentType: 'application/json',
    //     body: JSON.stringify({
    //       id: 'admin-user',
    //       email: 'admin@test.com',
    //       role: 'admin',
    //       nickname: 'Admin User',
    //     }),
    //   });
    // });
  });
});

test.describe('Admin Route - UI 요소 (관리자 전용)', () => {
  test.skip('관리자 로그인 후 Admin 대시보드 표시', async ({ page }) => {
    // TODO: 관리자 role 모킹 필요
    // await mockFirebaseAuth(page, 'admin-user', { role: 'admin' });
    // await page.goto('/admin');
    //
    // // Admin 대시보드 UI 확인
    // const title = page.locator('h1, h2').filter({ hasText: /Admin|관리자/i });
    // await expect(title).toBeVisible();
  });

  test.skip('관리자 메뉴 항목 표시', async ({ page }) => {
    // TODO: 관리자 role 모킹 필요
    // await mockFirebaseAuth(page, 'admin-user', { role: 'admin' });
    // await page.goto('/admin');
    //
    // // 관리자 메뉴 확인 (예: 사용자 관리, 콘텐츠 관리 등)
    // const userManagement = page.locator('text=사용자 관리');
    // const contentManagement = page.locator('text=콘텐츠 관리');
    //
    // await expect(userManagement).toBeVisible();
    // await expect(contentManagement).toBeVisible();
  });
});
