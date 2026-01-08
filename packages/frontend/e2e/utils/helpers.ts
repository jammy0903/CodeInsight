/**
 * E2E 테스트 헬퍼 함수
 */

import { Page } from '@playwright/test';

/**
 * 네트워크 요청 완료 대기
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * API 응답 대기
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * 요소가 사라질 때까지 대기
 */
export async function waitForElementToDisappear(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * 로딩 스피너 대기
 */
export async function waitForLoading(page: Page) {
  // 로딩 인디케이터가 있으면 사라질 때까지 대기
  const spinner = page.locator('[class*="loading"], [class*="spinner"]');
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

/**
 * 스크롤하여 요소 표시
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * 랜덤 딜레이 (봇 감지 방지)
 */
export async function randomDelay(min = 100, max = 500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * 콘솔 에러 수집
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * 스크린샷 저장 (타임스탬프 포함)
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/${name}-${timestamp}.png`,
    fullPage: true,
  });
}
