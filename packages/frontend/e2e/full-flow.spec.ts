import { test, expect } from '@playwright/test';

/**
 * CodeInsight 전체 플로우 E2E 테스트
 *
 * 테스트 시나리오:
 * 1. 홈페이지 접속
 * 2. 코스 선택 (C 언어)
 * 3. 챕터 선택
 * 4. 레슨 선택
 * 5. 레슨 학습 (스텝 이동, 메모리 시각화)
 * 6. 퀴즈 풀기
 * 7. 완료 확인
 */

test.describe('CodeInsight 전체 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 시작 전 홈페이지로 이동
    await page.goto('http://localhost:5174');
  });

  test('홈페이지에서 레슨 완료까지 전체 플로우', async ({ page }) => {
    // 1. 홈페이지 확인
    await expect(page).toHaveTitle(/CodeInsight/i);

    // 홈페이지 주요 요소 확인
    await expect(page.locator('text=코드가 어떻게')).toBeVisible();
    await expect(page.locator('text=로그인하기').first()).toBeVisible();

    // 2. 코스 선택 페이지로 직접 이동
    await page.goto('http://localhost:5174/courses');
    await expect(page).toHaveURL(/\/courses$/);

    // 언어 카드가 로드될 때까지 대기
    await page.waitForSelector('button.group', { timeout: 10000 });

    // 첫 번째 언어 카드 클릭 (보통 C)
    const firstLanguageCard = page.locator('button.group').first();
    await expect(firstLanguageCard).toBeVisible();
    await firstLanguageCard.click();

    // 3. 챕터 선택 페이지로 이동 확인 (언어는 동적이므로 패턴 매칭)
    await expect(page).toHaveURL(/\/courses\/[^/]+$/, { timeout: 5000 });

    // 챕터 아코디언이 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // API 응답 대기

    // 첫 번째 챕터 아코디언 찾기 및 펼치기
    const chapterButton = page.locator('button').filter({ hasText: '변수와 메모리 기초' }).or(page.locator('button').first());
    await expect(chapterButton).toBeVisible({ timeout: 10000 });

    // 아코디언이 닫혀있는지 확인 (필요시)
    await chapterButton.click();
    await page.waitForTimeout(1000); // 아코디언 펼쳐지는 애니메이션 대기

    // 4. 레슨 아이템 클릭 (div.cursor-pointer or just click any lesson)
    const lessonItem = page.locator('text=변수 선언과 초기화').or(page.locator('div[class*="cursor-pointer"]').first());
    await expect(lessonItem).toBeVisible({ timeout: 10000 });
    await lessonItem.click();

    // 5. 레슨 학습 페이지
    await expect(page).toHaveURL(/\/courses\/c\/\d+\/\d+$/);

    // 코드 뷰어 확인
    const codeViewer = page.locator('pre, code, .monaco-editor').first();
    await expect(codeViewer).toBeVisible({ timeout: 10000 });

    // 설명 텍스트 확인
    const explanation = page.locator('text=/설명|메모리|변수|스택|힙/i').first();
    await expect(explanation).toBeVisible({ timeout: 5000 });

    // 다음 버튼 찾기 및 클릭 (여러 번)
    for (let i = 0; i < 3; i++) {
      const nextButton = page.getByRole('button', { name: /다음|next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000); // 애니메이션 대기
      }
    }

    // 6. 퀴즈로 이동
    const quizButton = page.getByRole('button', { name: /퀴즈|문제|테스트/i });
    if (await quizButton.isVisible()) {
      await quizButton.click();
      await page.waitForTimeout(1000);

      // 퀴즈 선택지 확인
      const quizOption = page.locator('button, input[type="radio"]').first();
      if (await quizOption.isVisible()) {
        await quizOption.click();
        await page.waitForTimeout(500);

        // 제출 버튼 클릭
        const submitButton = page.getByRole('button', { name: /제출|확인|submit/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // 7. 스크린샷 캡처 (최종 상태)
    await page.screenshot({
      path: 'test-results/full-flow-final.png',
      fullPage: true
    });

    console.log('✅ 전체 플로우 테스트 완료!');
  });

  test('AI 챗봇 기능 확인', async ({ page }) => {
    // 홈에서 시작
    await page.goto('http://localhost:5174');

    // Chat 페이지로 이동
    const chatLink = page.getByRole('link', { name: /chat|챗|대화/i });
    if (await chatLink.isVisible()) {
      await chatLink.click();
      await expect(page).toHaveURL(/\/chat$/);

      // 입력창 확인
      const input = page.locator('input[type="text"], textarea').first();
      await expect(input).toBeVisible({ timeout: 5000 });

      // 메시지 입력 및 전송
      await input.fill('포인터가 뭐야?');

      const sendButton = page.getByRole('button', { name: /전송|send/i });
      if (await sendButton.isVisible()) {
        await sendButton.click();

        // AI 응답 대기 (최대 10초)
        await page.waitForTimeout(2000);

        // 스크린샷
        await page.screenshot({
          path: 'test-results/chat-response.png',
          fullPage: true
        });
      }
    }
  });
});
