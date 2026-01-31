import { chromium } from 'playwright';

const PYTHON_CH4_CODE = `# 1. 함수 정의
def greet(name):
    print(f"Hello, {name}!")

# 2. 함수 호출
greet("Alice")
greet("Bob")

# 3. Docstring (문서화)
def square(n):
    """숫자를 받아서 제곱을 반환합니다"""
    return n * n

print(square(5))`;

async function test() {
  console.log('🐍 Python 챕터 4 테스트: Playground\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  
  try {
    await page.goto('http://localhost:5174/playground');
    console.log('⏳ Playground 로딩...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Python 선택
    console.log('📝 Python 선택...');
    await page.click('button:has-text("Python"), select option:has-text("Python")');
    await page.waitForTimeout(500);
    
    // 코드 입력
    console.log('💻 챕터 4 코드 입력...');
    const editor = await page.locator('textarea, .monaco-editor, [contenteditable]').first();
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(PYTHON_CH4_CODE.substring(0, 100));  // 처음 100자만
    await page.waitForTimeout(1000);
    
    // 실행 버튼 클릭
    console.log('▶️  실행 버튼 클릭...');
    await page.click('button:has-text("실행"), button:has-text("Run"), button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // 결과 확인
    const hasOutput = await page.locator('text="Alice"').count() > 0;
    console.log(`\n결과: ${hasOutput ? '✅ 출력 확인됨' : '❌ 출력 없음'}`);
    
    await page.screenshot({ path: '/tmp/python-ch4-playground.png' });
    console.log('📸 스크린샷: /tmp/python-ch4-playground.png');
    
    console.log('\n⏱️  5초 후 종료...');
    await page.waitForTimeout(5000);
    
  } catch (err) {
    console.error('❌ 에러:', err.message);
    await page.screenshot({ path: '/tmp/python-error.png' });
  } finally {
    await browser.close();
  }
}

test();
