import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/c/c-1/c-1-1';

async function test() {
  console.log('🚀 C 레슨 테스트: ' + LESSON_URL + '\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  
  try {
    await page.goto(LESSON_URL);
    console.log('⏳ 로딩 대기...');
    
    // 로딩 완료 대기
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/c-lesson-initial.png' });
    console.log('📸 초기: /tmp/c-lesson-initial.png\n');
    
    // 페이지 정보
    const info = await page.evaluate(() => ({
      title: document.title,
      hasCode: !!document.querySelector('code, pre'),
      url: location.href
    }));
    
    console.log('📊 정보:');
    console.log('   제목:', info.title);
    console.log('   URL:', info.url);
    console.log('   코드:', info.hasCode ? '✅' : '❌');
    
    console.log('\n🔄 스텝 네비게이션 (5회):\n');
    
    for (let i = 1; i <= 5; i++) {
      console.log(`Step ${i}:`);
      
      const stepInfo = await page.evaluate(() => {
        const badge = document.querySelector('[class*="badge"], .line-number, [style*="badge"]');
        const explanation = document.querySelector('[class*="explanation"]');
        return {
          line: badge?.textContent || '?',
          explanation: explanation?.textContent?.trim().substring(0, 60) || 'N/A'
        };
      });
      
      console.log(`  L${stepInfo.line}: ${stepInfo.explanation}...`);
      
      await page.screenshot({ path: `/tmp/c-step-${i}.png` });
      
      if (i < 5) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(600);
      }
    }
    
    console.log('\n✅ 완료! 스크린샷:');
    console.log('   /tmp/c-lesson-initial.png');
    for (let i = 1; i <= 5; i++) {
      console.log(`   /tmp/c-step-${i}.png`);
    }
    
    console.log('\n⏱️  5초 후 종료...');
    await page.waitForTimeout(5000);
    
  } catch (err) {
    console.error('❌ 에러:', err.message);
    await page.screenshot({ path: '/tmp/c-error.png' });
  } finally {
    await browser.close();
  }
}

test();
