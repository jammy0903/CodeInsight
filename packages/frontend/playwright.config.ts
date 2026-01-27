import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 *
 * 테스트 구조:
 * e2e/
 * ├── fixtures/    # 공통 설정
 * ├── pages/       # Page Object Models
 * ├── tests/       # 테스트 파일
 * └── utils/       # 헬퍼 함수
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e/tests',

  /* 테스트 타임아웃 */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },

  /* 병렬 실행 설정 */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /* 리포터 설정 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  /* 결과 저장 디렉토리 */
  outputDir: 'test-results',

  /* 모든 프로젝트 공통 설정 */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:5174',

    /* 스크린샷/비디오 설정 */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    /* 브라우저 옵션 */
    headless: true,
    viewport: { width: 1280, height: 720 },
  },

  /* 프로젝트별 브라우저 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],

  /* 개발 서버 자동 실행 */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
