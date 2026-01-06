import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  /* 테스트 타임아웃 */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },

  /* 병렬 실행 설정 */
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,

  /* 리포터 설정 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* 모든 프로젝트 공통 설정 */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:5174',

    /* 스크린샷/비디오 설정 */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  /* 프로젝트별 브라우저 설정 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 개발 서버 설정 (필요시 자동 실행) */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5174',
  //   reuseExistingServer: !process.env.CI,
  // },
});
