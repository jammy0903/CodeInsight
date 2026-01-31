import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🔍 Step Content Test for Python 10-4\n');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('goToNextStep') || text.includes('step')) {
      console.log(`📟 ${text}`);
    }
  });

  try {
    await page.goto(LESSON_URL + '?t=' + Date.now());
    console.log('⏳ Waiting 10 seconds...\n');
    await page.waitForTimeout(10000);

    // Get the steps array info
    const stepsInfo = await page.evaluate(() => {
      // Try to access React state (this may not work directly)
      const root = document.getElementById('root');
      if (!root) return null;

      // Get current visible state
      const explanationEl = document.body.querySelector('[class*="explanation"]') ||
                           document.body.querySelector('.step-explanation');
      const lineBadgeEl = document.body.querySelector('[class*="badge"]') ||
                         document.body.querySelector('.line-badge');

      // Check page content for step info
      const bodyText = document.body.innerText;

      return {
        explanation: explanationEl?.textContent?.trim().substring(0, 100) || 'N/A',
        lineBadge: lineBadgeEl?.textContent || 'N/A',
        pageContent: bodyText.substring(0, 600)
      };
    });

    console.log('📊 Initial state:');
    console.log(`  LineBadge: ${stepsInfo?.lineBadge}`);
    console.log(`  Explanation: ${stepsInfo?.explanation}`);

    // Test clicking and observe console logs
    console.log('\n🔄 Testing step navigation (10 clicks):\n');

    for (let i = 1; i <= 10; i++) {
      // Click next
      await page.click('button:has-text("다음")');
      await page.waitForTimeout(800);

      // Get current state
      const state = await page.evaluate(() => {
        // Find line indicator (L1, L2, etc)
        const allText = document.body.innerText;
        const lineMatch = allText.match(/L(\d+)/);

        // Find explanation in the lower section
        const sections = document.body.innerText.split('\n');
        let explanation = '';
        for (const s of sections) {
          if (s.includes('asyncio') || s.includes('await') ||
              s.includes('코루틴') || s.includes('함수') ||
              s.includes('모듈') || s.includes('import')) {
            if (s.length > 20 && s.length < 200) {
              explanation = s;
              break;
            }
          }
        }

        return {
          lineIndicator: lineMatch ? `L${lineMatch[1]}` : '?',
          explanation: explanation.substring(0, 80)
        };
      });

      console.log(`Click ${i}: ${state.lineIndicator} - "${state.explanation}..."`);
    }

    console.log('\n✅ Test completed!');
    await page.waitForTimeout(3000);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

test();
