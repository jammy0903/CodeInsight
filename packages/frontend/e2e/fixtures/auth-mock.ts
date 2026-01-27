/**
 * Firebase 인증 모킹 Fixture
 * E2E 테스트에서 실제 Firebase 로그인 없이 인증된 상태를 시뮬레이션
 *
 * WHY: Firebase SDK를 우회하여 API 레벨에서만 인증 처리
 * - page.route()로 Authorization 헤더 자동 주입
 * - 비로그인 상태도 쉽게 테스트 가능
 */

import { Page } from '@playwright/test';

/**
 * 인증된 사용자로 API 요청 모킹
 * Authorization 헤더를 자동으로 추가
 */
export async function mockFirebaseAuth(page: Page, userId: string = 'mock-user-e2e') {
  await page.route('**/api/v1/**', async (route) => {
    const headers = {
      ...route.request().headers(),
      'Authorization': `Bearer mock-token-${userId}`,
    };
    await route.continue({ headers });
  });
}

/**
 * 비로그인 상태 모킹
 * Authorization 헤더 없이 요청 (401 에러 예상)
 */
export async function mockUnauthenticated(page: Page) {
  // Authorization 헤더 제거
  await page.route('**/api/v1/**', async (route) => {
    const headers = { ...route.request().headers() };
    delete headers['authorization'];
    delete headers['Authorization'];
    await route.continue({ headers });
  });
}

/**
 * Firebase 인증 에러 시뮬레이션
 * 401 Unauthorized 응답 반환
 */
export async function mockAuthError(page: Page, errorMessage: string = '로그인이 필요합니다') {
  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Unauthorized',
        message: errorMessage,
      }),
    });
  });
}
