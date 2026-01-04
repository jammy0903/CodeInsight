/**
 * Browser Test Script
 * Puppeteer로 localhost:5174 접속 및 스크린샷 촬영
 */

import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

async function testBrowser() {
  console.log('🚀 Starting browser test...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📡 Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('✅ Page loaded successfully!\n');

    // 페이지 제목 확인
    const title = await page.title();
    console.log(`📄 Page Title: ${title}`);

    // URL 확인
    const url = page.url();
    console.log(`🔗 Current URL: ${url}\n`);

    // 스크린샷 저장
    const screenshotDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotDir, `homepage-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}\n`);

    // 페이지 텍스트 확인 (로그인 상태 체크)
    const bodyText = await page.$eval('body', (el: any) => el.textContent || '');

    if (bodyText.includes('로그인') || bodyText.includes('Login')) {
      console.log('🔐 Login page detected - User not logged in');
    } else if (bodyText.includes('CodeInsight') || bodyText.includes('코스')) {
      console.log('🏠 Main page detected - Page loaded successfully');
    }

    console.log('\n✅ Browser test completed!');
  } catch (error) {
    console.error('❌ Browser test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

testBrowser()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
