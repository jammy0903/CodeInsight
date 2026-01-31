#!/usr/bin/env node
/**
 * Playwright 테스트: py-10-3 레슨 스텝 네비게이션
 *
 * 실행: node test-lesson-steps.mjs
 */

import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-3';

async function testLessonSteps() {
  console.log('🚀 Playwright 테스트 시작...\n');

  // 브라우저 실행
  const browser = await chromium.launch({
    headless: false,  // 브라우저 화면 보기
    slowMo: 500       // 동작을 천천히 (0.5초 딜레이)
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log(`📂 페이지 로드: ${LESSON_URL}`);
    await page.goto(LESSON_URL, { waitUntil: 'networkidle' });

    // 페이지 로드 대기
    await page.waitForTimeout(2000);

    console.log('\n✅ 페이지 로드 완료!');

    // 제목 확인
    const title = await page.textContent('h1, h2, .lesson-title').catch(() => null);
    if (title) {
      console.log(`📚 레슨 제목: ${title.trim()}`);
    }

    // 스크린샷 1: 초기 상태
    await page.screenshot({ path: '/tmp/lesson-step-01-initial.png' });
    console.log('📸 스크린샷 저장: /tmp/lesson-step-01-initial.png');

    // 네비게이션 버튼 찾기
    const nextButton = page.locator('button:has-text("다음"), button[aria-label*="다음"], button:has(svg)').first();
    const prevButton = page.locator('button:has-text("이전"), button[aria-label*="이전"]').first();

    console.log('\n🔄 스텝 네비게이션 테스트 시작...\n');

    // 5번 다음 버튼 클릭
    for (let i = 1; i <= 5; i++) {
      console.log(`   Step ${i}: 다음 버튼 클릭`);

      // 다음 버튼 클릭 시도
      try {
        await nextButton.click({ timeout: 3000 });
      } catch (err) {
        // 버튼이 없으면 키보드 화살표 사용
        console.log('   → 버튼이 없어서 키보드 사용 (ArrowRight)');
        await page.keyboard.press('ArrowRight');
      }

      await page.waitForTimeout(800);

      // 현재 라인 확인
      const currentLine = await page.locator('[class*="highlight"], .bg-yellow-200, [style*="background"]').first().textContent().catch(() => null);
      if (currentLine) {
        console.log(`   → 현재 코드: ${currentLine.trim().substring(0, 50)}...`);
      }

      // 스크린샷
      await page.screenshot({ path: `/tmp/lesson-step-0${i + 1}.png` });
    }

    console.log('\n📸 스크린샷 저장 완료:');
    for (let i = 1; i <= 6; i++) {
      console.log(`   /tmp/lesson-step-0${i}.png`);
    }

    // 설명 패널 확인
    const explanation = await page.locator('[class*="explanation"], .step-explanation, p').first().textContent().catch(() => null);
    if (explanation) {
      console.log(`\n📝 현재 설명: ${explanation.trim().substring(0, 100)}...`);
    }

    console.log('\n✅ 테스트 완료! 브라우저를 5초 후 종료합니다...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ 에러 발생:', error.message);
    await page.screenshot({ path: '/tmp/lesson-error.png' });
    console.log('📸 에러 스크린샷: /tmp/lesson-error.png');
  } finally {
    await browser.close();
  }
}

// 실행
testLessonSteps().catch(console.error);
