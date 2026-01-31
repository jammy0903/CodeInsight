import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🎯 Final Verification Test for Python 10-4\n');

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  try {
    await page.goto(LESSON_URL + '?t=' + Date.now());
    console.log('⏳ Waiting 12 seconds for simulation...\n');
    await page.waitForTimeout(12000);

    await page.screenshot({ path: '/tmp/final-step0.png' });
    console.log('📸 Step 0: /tmp/final-step0.png\n');

    // Click through steps
    console.log('🔄 Navigation test (8 clicks):\n');

    for (let i = 1; i <= 8; i++) {
      await page.click('button:has-text("다음")');
      await page.waitForTimeout(800);

      // Get current line from page
      const lineMatch = await page.evaluate(() => {
        const text = document.body.innerText;
        const match = text.match(/L(\d+)/);
        return match ? `L${match[1]}` : '?';
      });

      await page.screenshot({ path: `/tmp/final-step${i}.png` });
      console.log(`📸 Step ${i} (${lineMatch}): /tmp/final-step${i}.png`);
    }

    console.log('\n✅ Test completed!');
    console.log('\n📁 Screenshots saved to /tmp/final-step*.png');
    console.log('\n⏱️ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/final-error.png' });
  } finally {
    await browser.close();
  }
}

test();
