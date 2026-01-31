import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🐍 Python 10-4 디버그 테스트\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 600 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  try {
    await page.goto(LESSON_URL);
    console.log('⏳ 페이지 로딩 대기 (10초)...');
    await page.waitForTimeout(10000);  // 충분히 대기
    
    await page.screenshot({ path: '/tmp/debug-initial.png' });
    
    console.log('\n🔄 스텝 네비게이션 테스트 (10회):\n');
    
    for (let i = 1; i <= 10; i++) {
      // 현재 상태 확인
      const state = await page.evaluate(() => {
        // 라인 번호 배지
        const lineBadge = document.querySelector('[class*="badge"]');
        // 설명 텍스트
        const explanation = document.querySelector('[class*="explanation"]');
        // 하이라이트된 라인
        const highlightedLine = document.querySelector('[style*="background"]');
        
        return {
          lineBadge: lineBadge?.textContent || 'N/A',
          explanation: explanation?.textContent?.trim().substring(0, 80) || 'N/A',
          pageText: document.body.innerText.substring(0, 200)
        };
      });
      
      console.log(`Step ${i}:`);
      console.log(`  라인: ${state.lineBadge}`);
      console.log(`  설명: ${state.explanation}`);
      
      await page.screenshot({ path: `/tmp/debug-step${i}.png` });
      
      // 다음 버튼 클릭
      console.log('  → ArrowRight 키 입력');
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1500);  // 충분한 대기
    }
    
    console.log('\n✅ 테스트 완료');
    console.log('⏱️ 15초 후 종료...');
    await page.waitForTimeout(15000);
    
  } catch (err) {
    console.error('❌ 에러:', err.message);
    await page.screenshot({ path: '/tmp/debug-error.png' });
  } finally {
    await browser.close();
  }
}

test();
