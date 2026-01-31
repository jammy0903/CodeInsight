import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🔍 Network Debug Test for Python 10-4\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  // Network request logging
  page.on('request', (req) => {
    if (req.url().includes('lessons') || req.url().includes('courses')) {
      console.log(`📤 REQ: ${req.method()} ${req.url()}`);
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('lessons') || res.url().includes('courses')) {
      console.log(`📥 RES: ${res.status()} ${res.url()}`);
      if (res.status() !== 200) {
        try {
          const body = await res.text();
          console.log(`   Body: ${body.substring(0, 200)}`);
        } catch (e) {}
      }
    }
  });

  // Console logging
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`🔴 Console Error: ${msg.text()}`);
    }
  });

  try {
    await page.goto(LESSON_URL);
    console.log('\n⏳ Waiting for page to settle...\n');
    await page.waitForTimeout(5000);

    // Get page state
    const state = await page.evaluate(() => {
      const errorEl = document.querySelector('[class*="NotFound"]');
      const loadingEl = document.querySelector('[class*="animate-spin"]');
      const codeEl = document.querySelector('code, pre');
      const bodyText = document.body.innerText.substring(0, 300);

      return {
        hasError: !!errorEl,
        isLoading: !!loadingEl,
        hasCode: !!codeEl,
        bodyText: bodyText
      };
    });

    console.log('📊 Page State:');
    console.log(`  hasError: ${state.hasError}`);
    console.log(`  isLoading: ${state.isLoading}`);
    console.log(`  hasCode: ${state.hasCode}`);
    console.log(`  bodyText: ${state.bodyText}`);

    await page.screenshot({ path: '/tmp/network-debug.png' });
    console.log('\n📸 Screenshot: /tmp/network-debug.png');

    console.log('\n⏱️ Waiting 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/network-debug-error.png' });
  } finally {
    await browser.close();
  }
}

test();
