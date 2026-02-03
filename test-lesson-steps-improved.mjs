#!/usr/bin/env node
/**
 * Playwright 테스트: py-10-3 레슨 스텝 네비게이션 (개선 버전)
 *
 * 실행: node test-lesson-steps-improved.mjs
 */

import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-3';

async function testLessonSteps() {
  console.log('🚀 Playwright 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    console.log(`📂 페이지 이동: ${LESSON_URL}`);
    await page.goto(LESSON_URL);

    console.log('⏳ 레슨 콘텐츠 로딩 대기...');

    // 로딩 스피너가 사라질 때까지 대기
    try {
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 });
      console.log('✅ 로딩 완료!');
    } catch {
      console.log('⚠️  로딩 스피너를 찾을 수 없음 (이미 로드됨?)');
    }

    // 코드 에디터가 나타날 때까지 대기
    await page.waitForSelector('pre, code, .monaco-editor, [class*="editor"]', { timeout: 10000 });
    console.log('✅ 코드 에디터 로드 완료!');

    await page.waitForTimeout(2000);

    // 초기 스크린샷
    await page.screenshot({ path: '/tmp/lesson-initial.png', fullPage: false });
    console.log('\n📸 초기 화면: /tmp/lesson-initial.png');

    // 현재 페이지 정보 출력
    const pageInfo = await page.evaluate(() => {
      const codeElement = document.querySelector('pre code, .lesson-code, [class*="code"]');
      const explanationElement = document.querySelector('[class*="explanation"], .step-explanation');

      return {
        url: window.location.href,
        title: document.title,
        hasCode: !!codeElement,
        codePreview: codeElement ? codeElement.textContent.substring(0, 100) : null,
        hasExplanation: !!explanationElement,
        explanationPreview: explanationElement ? explanationElement.textContent.substring(0, 100) : null,
      };
    });

    console.log('\n📊 페이지 정보:');
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   제목: ${pageInfo.title}`);
    console.log(`   코드 존재: ${pageInfo.hasCode ? '✅' : '❌'}`);
    if (pageInfo.codePreview) {
      console.log(`   코드 미리보기: ${pageInfo.codePreview.trim().substring(0, 50)}...`);
    }
    console.log(`   설명 존재: ${pageInfo.hasExplanation ? '✅' : '❌'}`);

    // 네비게이션 버튼 찾기 (여러 선택자 시도)
    const selectors = [
      'button:has-text("다음")',
      'button[aria-label*="다음"]',
      'button:has-text("Next")',
      'button svg[class*="arrow-right"]',
      '.step-navigation button:last-child',
      '[class*="navigation"] button:nth-child(2)',
    ];

    let nextButton = null;
    for (const selector of selectors) {
      const button = page.locator(selector).first();
      const count = await button.count();
      if (count > 0) {
        nextButton = button;
        console.log(`\n✅ 다음 버튼 찾음: ${selector}`);
        break;
      }
    }

    if (!nextButton) {
      console.log('\n⚠️  다음 버튼을 찾을 수 없음. 키보드 화살표 키 사용');
    }

    console.log('\n🔄 스텝 네비게이션 테스트 (10 스텝):\n');

    for (let i = 1; i <= 10; i++) {
      console.log(`📍 Step ${i}:`);

      // 현재 스텝 정보
      const stepInfo = await page.evaluate(() => {
        // 하이라이트된 라인 찾기
        const highlightedLine = document.querySelector('[class*="highlight"], .bg-yellow-200, [style*="background-color: yellow"]');

        // 설명 텍스트
        const explanation = document.querySelector('[class*="explanation"], .step-explanation');

        // 라인 번호 배지
        const lineBadge = document.querySelector('[class*="line"], .badge');

        return {
          line: lineBadge ? lineBadge.textContent : null,
          codeSnippet: highlightedLine ? highlightedLine.textContent.trim().substring(0, 60) : null,
          explanation: explanation ? explanation.textContent.trim().substring(0, 100) : null,
        };
      });

      if (stepInfo.line) {
        console.log(`   📌 라인: ${stepInfo.line}`);
      }
      if (stepInfo.codeSnippet) {
        console.log(`   💻 코드: ${stepInfo.codeSnippet}...`);
      }
      if (stepInfo.explanation) {
        console.log(`   📝 설명: ${stepInfo.explanation}...`);
      }

      // 스크린샷
      await page.screenshot({ path: `/tmp/lesson-step-${String(i).padStart(2, '0')}.png` });

      // 다음 스텝으로 이동
      if (i < 10) {
        try {
          if (nextButton) {
            await nextButton.click({ timeout: 2000 });
          } else {
            await page.keyboard.press('ArrowRight');
          }
          await page.waitForTimeout(500);
        } catch (err) {
          console.log(`   ⚠️  네비게이션 실패: ${err.message}`);
          // 키보드로 재시도
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(500);
        }
      }

      console.log('');
    }

    console.log('\n✅ 테스트 완료!');
    console.log('\n📸 스크린샷 저장 위치:');
    console.log('   /tmp/lesson-initial.png');
    for (let i = 1; i <= 10; i++) {
      console.log(`   /tmp/lesson-step-${String(i).padStart(2, '0')}.png`);
    }

    console.log('\n⏱️  5초 후 브라우저 종료...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ 에러 발생:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/lesson-error.png' });
    console.log('📸 에러 스크린샷: /tmp/lesson-error.png');
  } finally {
    await browser.close();
  }
}

testLessonSteps().catch(console.error);
