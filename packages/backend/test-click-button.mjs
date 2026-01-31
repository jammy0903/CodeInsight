import { chromium } from 'playwright';

const LESSON_URL = 'http://localhost:5174/courses/python/python-ch10/py-10-4';

async function test() {
  console.log('🔍 Button Click Test for Python 10-4\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.text().includes('step') || msg.text().includes('Step')) {
      console.log(`📟 Console: ${msg.text()}`);
    }
  });

  try {
    await page.goto(LESSON_URL);
    console.log('⏳ Waiting 10 seconds for page to load...\n');
    await page.waitForTimeout(10000);

    // Get page state and check number of steps
    const pageState = await page.evaluate(() => {
      const badges = document.querySelectorAll('[class*="badge"]');
      const buttons = document.querySelectorAll('button');
      const nextButton = Array.from(buttons).find(btn =>
        btn.textContent?.includes('다음') || btn.textContent?.includes('Next')
      );

      return {
        badgeCount: badges.length,
        badgeTexts: Array.from(badges).map(b => b.textContent),
        hasNextButton: !!nextButton,
        nextButtonText: nextButton?.textContent,
        allButtonTexts: Array.from(buttons).map(b => b.textContent?.trim()).filter(Boolean)
      };
    });

    console.log('📊 Page State:');
    console.log(`  Badges: ${JSON.stringify(pageState.badgeTexts)}`);
    console.log(`  Has Next Button: ${pageState.hasNextButton}`);
    console.log(`  Next Button Text: ${pageState.nextButtonText}`);
    console.log(`  All Buttons: ${JSON.stringify(pageState.allButtonTexts.slice(0, 10))}`);

    await page.screenshot({ path: '/tmp/click-test-initial.png' });

    // Try to click the "다음" button
    console.log('\n🔄 Testing button clicks (5 times):\n');

    for (let i = 1; i <= 5; i++) {
      // Get current line number
      const lineBadge = await page.evaluate(() => {
        const badge = document.querySelector('[class*="badge"]');
        return badge?.textContent || '?';
      });

      console.log(`Step ${i}: Line ${lineBadge}`);

      // Find and click the "다음" button
      const clicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const nextButton = Array.from(buttons).find(btn =>
          btn.textContent?.includes('다음') ||
          btn.textContent?.includes('Next') ||
          btn.textContent?.includes('→')
        );
        if (nextButton) {
          nextButton.click();
          return true;
        }
        return false;
      });

      console.log(`  → Clicked: ${clicked}`);
      await page.screenshot({ path: `/tmp/click-test-step${i}.png` });
      await page.waitForTimeout(1000);
    }

    console.log('\n✅ Test completed!');
    console.log('\n⏱️ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/click-test-error.png' });
  } finally {
    await browser.close();
  }
}

test();
