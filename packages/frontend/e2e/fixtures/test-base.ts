/**
 * E2E 테스트 기본 설정
 * Playwright test 확장
 */

import { test as base, expect } from '@playwright/test';

// 테스트 확장: 공통 설정
export const test = base.extend<{
  // 필요시 커스텀 fixture 추가
}>({
  // 기본 페이지 설정
  page: async ({ page }, use) => {
    // 콘솔 에러 로깅
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[Browser Error]: ${msg.text()}`);
      }
    });

    // 네트워크 실패 로깅
    page.on('requestfailed', (request) => {
      console.log(`[Request Failed]: ${request.url()}`);
    });

    await use(page);
  },
});

export { expect };

// 공통 상수
export const BASE_URL = 'http://localhost:5174';
export const API_URL = 'http://localhost:3002';

// 공통 타임아웃
export const TIMEOUTS = {
  short: 3000,
  medium: 5000,
  long: 10000,
  api: 15000,
};
