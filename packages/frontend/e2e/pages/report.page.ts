/**
 * ReportPage - Page Object Model
 * 리포트 페이지의 퀴즈 취약 개념 섹션
 *
 * WHY: Standalone Quiz 결과 분석
 * - 취약 개념 Top 5 표시
 * - 언어별 탭 전환
 * - "이 개념 다시 풀기" 버튼으로 퀴즈로 이동
 */

import { Page, Locator, expect } from '@playwright/test';

export class ReportPage {
  readonly page: Page;

  // 퀴즈 섹션
  readonly quizSectionTitle: Locator;
  readonly languageTabs: Locator;
  readonly languageTabC: Locator;
  readonly languageTabJava: Locator;
  readonly languageTabPython: Locator;
  readonly languageTabJavaScript: Locator;

  // 취약 개념 카드
  readonly weakConceptCards: Locator;
  readonly noDataMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // 퀴즈 섹션 (스크롤 필요)
    this.quizSectionTitle = page.locator('h3').filter({ hasText: '퀴즈 취약 개념' });
    this.languageTabs = page.locator('button').filter({ hasText: /C|Java|Python|JavaScript/ });
    this.languageTabC = page.locator('button:has-text("C")');
    this.languageTabJava = page.locator('button:has-text("Java")');
    this.languageTabPython = page.locator('button:has-text("Python")');
    this.languageTabJavaScript = page.locator('button:has-text("JavaScript")');

    // 취약 개념 카드 (bg-white 배경에 "오답률" 텍스트 포함)
    this.weakConceptCards = page.locator('div').filter({ hasText: /오답률/ }).filter({ has: page.locator('span.font-bold') });
    this.noDataMessage = page.locator('p').filter({ hasText: /아직 데이터가 없습니다|퀴즈를 풀어보세요/ });
    this.loadingSpinner = page.locator('svg.animate-spin');
  }

  // === 네비게이션 ===

  async goto() {
    await this.page.goto('/report');
  }

  async scrollToQuizSection() {
    await this.quizSectionTitle.scrollIntoViewIfNeeded();
  }

  // === 언어 탭 전환 ===

  async selectLanguage(language: 'C' | 'Java' | 'Python' | 'JavaScript') {
    const tabMap = {
      'C': this.languageTabC,
      'Java': this.languageTabJava,
      'Python': this.languageTabPython,
      'JavaScript': this.languageTabJavaScript,
    };

    const tab = tabMap[language];
    await tab.click();
  }

  async selectLanguageC() {
    await this.languageTabC.click();
  }

  // === 취약 개념 데이터 ===

  async waitForWeakConceptsToLoad() {
    await this.quizSectionTitle.waitFor({ state: 'visible', timeout: 5000 });
    // 로딩이 끝날 때까지 대기 (spinner가 사라질 때까지)
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // spinner가 없으면 바로 통과
    });
  }

  async getWeakConceptsCount(): Promise<number> {
    return await this.weakConceptCards.count();
  }

  async hasNoData(): Promise<boolean> {
    return await this.noDataMessage.isVisible().catch(() => false);
  }

  /**
   * 특정 인덱스의 취약 개념 정보 추출
   */
  async getWeakConceptInfo(index: number = 0): Promise<{
    concept: string;
    errorRate: string;
    attempts: string;
  }> {
    const card = this.weakConceptCards.nth(index);
    const text = await card.textContent() || '';

    // "포인터 오답률 67% • 15회 시도" 형식 파싱
    const conceptMatch = text.match(/^(.+?)\s*오답률/);
    const errorRateMatch = text.match(/오답률\s*(\d+)%/);
    const attemptsMatch = text.match(/(\d+)회 시도/);

    return {
      concept: conceptMatch ? conceptMatch[1].trim() : '',
      errorRate: errorRateMatch ? errorRateMatch[1] : '0',
      attempts: attemptsMatch ? attemptsMatch[1] : '0',
    };
  }

  /**
   * "이 개념 다시 풀기" 버튼 클릭
   */
  async clickRetryConceptButton(index: number = 0) {
    const card = this.weakConceptCards.nth(index);
    const retryButton = card.locator('a, button').filter({ hasText: '이 개념 다시 풀기' });
    await retryButton.click();
  }

  // === 검증 헬퍼 ===

  async expectQuizSectionVisible() {
    await expect(this.quizSectionTitle).toBeVisible();
  }

  async expectWeakConceptsDisplayed(expectedCount: number) {
    await expect(this.weakConceptCards).toHaveCount(expectedCount);
  }

  async expectNoDataMessageVisible() {
    await expect(this.noDataMessage).toBeVisible();
  }
}
