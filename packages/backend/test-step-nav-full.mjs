import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🔍 Step Navigation Full Test for Python 10-4\n');

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  // Console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`🔴 Console Error: ${msg.text()}`);
    }
  });

  try {
    await page.goto(LESSON_URL);
    console.log('⏳ Waiting 15 seconds for simulation to complete...\n');
    await page.waitForTimeout(15000);

    // Take initial screenshot
    await page.screenshot({ path: '/tmp/step-nav-initial.png' });
    console.log('📸 Initial screenshot: /tmp/step-nav-initial.png');

    // Check page state
    const initialState = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const hasLoadingSpinner = !!document.querySelector('[class*="animate-spin"]');
      return { bodyText: bodyText.substring(0, 400), hasLoadingSpinner };
    });
    console.log(`\n📊 Initial State:`);
    console.log(`  Loading: ${initialState.hasLoadingSpinner}`);
    console.log(`  Body: ${initialState.bodyText.substring(0, 200)}...\n`);

    // Test step navigation 15 times
    console.log('🔄 Testing step navigation (15 clicks):\n');

    for (let i = 1; i <= 15; i++) {
      // Get current state
      const state = await page.evaluate(() => {
        // Find line badge (L1, L2, etc)
        const lineBadge = document.querySelector('[class*="badge"], .line-badge, [style*="badge"]');
        const lineBadgeText = lineBadge?.textContent || '?';

        // Find explanation text
        const explanation = document.querySelector('[class*="explanation"]');
        const explanationText = explanation?.textContent?.trim().substring(0, 80) || 'N/A';

        // Code editor line highlight
        const codeLines = document.querySelectorAll('[class*="cm-line"]');
        const highlightedLine = Array.from(codeLines).find(el =>
          el.classList.toString().includes('highlight') ||
          getComputedStyle(el).backgroundColor.includes('amber') ||
          getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'
        );

        return {
          lineBadge: lineBadgeText,
          explanation: explanationText
        };
      });

      console.log(`Step ${i}:`);
      console.log(`  Line: ${state.lineBadge}`);
      console.log(`  Explanation: ${state.explanation}...`);

      await page.screenshot({ path: `/tmp/step-nav-step${i}.png` });

      // Click next button (ArrowRight key)
      console.log(`  → Pressing ArrowRight`);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(1000);
    }

    console.log('\n✅ Test completed!');
    console.log('\n📸 Screenshots saved:');
    console.log('  /tmp/step-nav-initial.png');
    for (let i = 1; i <= 15; i++) {
      console.log(`  /tmp/step-nav-step${i}.png`);
    }

    console.log('\n⏱️ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/step-nav-error.png' });
  } finally {
    await browser.close();
  }
}

test();
