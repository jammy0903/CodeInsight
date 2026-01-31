import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🔍 Full Debug Test for Python 10-4\n');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  // Capture ALL console logs
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Simulation') || text.includes('fallback') ||
        text.includes('steps') || text.includes('error') ||
        text.includes('Step') || text.includes('step') ||
        text.includes('Python')) {
      console.log(`📟 ${msg.type().toUpperCase()}: ${text}`);
    }
  });

  try {
    // Force hard reload to get latest code
    await page.goto(LESSON_URL + '?t=' + Date.now());
    console.log('⏳ Waiting 15 seconds for simulation...\n');
    await page.waitForTimeout(15000);

    // Get detailed state
    const state = await page.evaluate(() => {
      // Check for steps in React state (if accessible)
      const reactRoot = document.getElementById('root');
      const allElements = document.body.querySelectorAll('*');

      // Look for any element containing step info
      let stepCount = 0;
      let explanationText = '';

      allElements.forEach(el => {
        if (el.textContent?.includes('모듈') && el.textContent.length < 100) {
          explanationText = el.textContent;
        }
      });

      // Check navigation buttons
      const buttons = document.querySelectorAll('button');
      const nextBtn = Array.from(buttons).find(b => b.textContent?.includes('다음'));
      const prevBtn = Array.from(buttons).find(b => b.textContent?.includes('이전'));

      return {
        hasCode: !!document.querySelector('code, pre, [class*="cm-"]'),
        explanationText: explanationText,
        hasNextBtn: !!nextBtn,
        hasPrevBtn: !!prevBtn,
        bodySnippet: document.body.innerText.substring(0, 500)
      };
    });

    console.log('📊 Page State:');
    console.log(`  hasCode: ${state.hasCode}`);
    console.log(`  explanation: ${state.explanationText}`);
    console.log(`  hasNextBtn: ${state.hasNextBtn}`);
    console.log(`  hasPrevBtn: ${state.hasPrevBtn}`);
    console.log(`  bodySnippet: ${state.bodySnippet.substring(0, 200)}...`);

    await page.screenshot({ path: '/tmp/debug-full.png' });

    // Test clicking 5 times
    console.log('\n🔄 Testing clicks:\n');
    for (let i = 1; i <= 5; i++) {
      const beforeClick = await page.evaluate(() => {
        const exp = document.body.innerText.match(/(`[^`]+`[^가-힣]*가져옵니다|import.*)/)?.[0] || '?';
        return exp.substring(0, 60);
      });

      console.log(`Before click ${i}: ${beforeClick}`);

      await page.click('button:has-text("다음")');
      await page.waitForTimeout(1000);

      const afterClick = await page.evaluate(() => {
        const exp = document.body.innerText.match(/(코루틴|함수|모듈|비동기|gather)[^\.]*\./)?.[0] || '?';
        return exp.substring(0, 60);
      });

      console.log(`After click ${i}: ${afterClick}\n`);
    }

    await page.screenshot({ path: '/tmp/debug-full-after.png' });

    console.log('\n⏱️ Waiting 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/debug-full-error.png' });
  } finally {
    await browser.close();
  }
}

test();
