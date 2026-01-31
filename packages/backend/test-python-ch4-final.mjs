import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch4/py-4-1';

async function test() {
  console.log('🐍 Python 챕터 4 - 레슨 1 테스트\n');
  console.log('📂 URL:', LESSON_URL);
  
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  try {
    await page.goto(LESSON_URL);
    console.log('⏳ 로딩...');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/tmp/python-ch4-initial.png' });
    console.log('📸 초기: /tmp/python-ch4-initial.png\n');
    
    console.log('🔄 스텝 네비게이션 (5회):\n');
    
    for (let i = 1; i <= 5; i++) {
      const info = await page.evaluate(() => {
        const badge = document.querySelector('[class*="badge"], .line-number, [style*="L"]');
        const explanation = document.querySelector('[class*="explanation"]');
        return {
          line: badge?.textContent || '?',
          explanation: explanation?.textContent?.trim().substring(0, 50) || 'N/A'
        };
      });
      
      console.log(`Step ${i}: L${info.line}`);
      console.log(`  ${info.explanation}...`);
      
      await page.screenshot({ path: `/tmp/python-ch4-step${i}.png` });
      
      if (i < 5) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(700);
      }
    }
    
    console.log('\n✅ 테스트 완료!');
    console.log('\n📸 스크린샷:');
    for (let i = 0; i <= 5; i++) {
      const file = i === 0 ? '/tmp/python-ch4-initial.png' : `/tmp/python-ch4-step${i}.png`;
      console.log(`  ${file}`);
    }
    
    console.log('\n⏱️  5초 후 종료...');
    await page.waitForTimeout(5000);
    
  } catch (err) {
    console.error('❌ 에러:', err.message);
    await page.screenshot({ path: '/tmp/python-ch4-error.png' });
  } finally {
    await browser.close();
  }
}

test();
