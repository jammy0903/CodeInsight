/**
 * E2E 테스트 기본 설정
 * Playwright test 확장
 */

import { test as base, expect, Page } from '@playwright/test';
import { mockFirebaseAuth } from './auth-mock';
import { mockStandaloneQuizAPIs } from './quiz-mock';

// 테스트 확장: 공통 설정 + 커스텀 fixture
export const test = base.extend<{
  authenticatedPage: Page;
  quizWithData: Page;
  quizNoData: Page;
}>({
  // 기본 페이지 설정
  page: async ({ page }, use) => {
    // 콘솔 모든 메시지 로깅 (디버깅용)
    page.on('console', (msg) => {
      console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`);
    });

    // 네트워크 실패 로깅
    page.on('requestfailed', (request) => {
      console.log(`[Request Failed]: ${request.url()}`);
    });

    // 모든 API 요청 로깅 (디버깅용)
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`[API Request]: ${request.method()} ${request.url()}`);
      }
    });

    await use(page);
  },

  // 인증된 페이지 (API 요청에 Authorization 헤더 자동 추가)
  authenticatedPage: async ({ page }, use) => {
    await mockFirebaseAuth(page);
    await use(page);
  },

  // 퀴즈 데이터가 있는 인증된 페이지
  quizWithData: async ({ page }, use) => {
    await mockFirebaseAuth(page);
    await mockStandaloneQuizAPIs(page, 'with-data');
    await use(page);
  },

  // 퀴즈 데이터가 없는 인증된 페이지
  quizNoData: async ({ page }, use) => {
    await mockFirebaseAuth(page);
    await mockStandaloneQuizAPIs(page, 'no-data');
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
