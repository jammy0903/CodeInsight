import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🐍 Python 챕터 10 - 레슨 4 테스트');
  console.log('📂 URL:', LESSON_URL, '\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  try {
    await page.goto(LESSON_URL, { waitUntil: 'domcontentloaded' });
    console.log('⏳ 페이지 로딩...');
    
    // 로딩 완료 대기
    await page.waitForTimeout(5000);
    
    // 초기 스크린샷
    await page.screenshot({ path: '/tmp/py-10-4-initial.png' });
    console.log('📸 초기 화면 캡처\n');
    
    // 페이지 정보
    const info = await page.evaluate(() => ({
      title: document.title,
      hasCode: !!document.querySelector('code, pre, [class*="code"]'),
      url: location.href
    }));
    
    console.log('📊 페이지 정보:');
    console.log('  제목:', info.title);
    console.log('  코드:', info.hasCode ? '✅' : '❌');
    console.log('  URL:', info.url);
    
    console.log('\n🔄 스텝 네비게이션 시작:\n');
    
    for (let i = 1; i <= 8; i++) {
      const stepInfo = await page.evaluate(() => {
        const lineEl = document.querySelector('[class*="L"], .line-badge, [style*="badge"]');
        const explEl = document.querySelector('[class*="explanation"], .step-explanation');
        const codeEl = document.querySelector('code, pre');
        
        return {
          line: lineEl?.textContent?.match(/\d+/)?.[0] || '?',
          explanation: explEl?.textContent?.trim().substring(0, 60) || 'N/A',
          hasContent: !!codeEl
        };
      });
      
      console.log(`Step ${i}: Line ${stepInfo.line}`);
      if (stepInfo.explanation !== 'N/A') {
        console.log(`  📝 ${stepInfo.explanation}...`);
      }
      
      await page.screenshot({ path: `/tmp/py-10-4-step${i}.png` });
      
      if (i < 8) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(800);
      }
    }
    
    console.log('\n✅ 테스트 완료!');
    console.log('\n📸 저장된 스크린샷:');
    console.log('  /tmp/py-10-4-initial.png');
    for (let i = 1; i <= 8; i++) {
      console.log(`  /tmp/py-10-4-step${i}.png`);
    }
    
    console.log('\n⏱️  10초 후 종료...');
    await page.waitForTimeout(10000);
    
  } catch (err) {
    console.error('\n❌ 에러:', err.message);
    await page.screenshot({ path: '/tmp/py-10-4-error.png' });
    console.log('📸 에러 스크린샷: /tmp/py-10-4-error.png');
  } finally {
    await browser.close();
  }
}

test();
