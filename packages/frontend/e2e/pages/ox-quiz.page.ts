/**
 * OXQuizPage - Page Object Model
 * OX 퀴즈 페이지의 모든 UI 요소와 인터랙션을 캡슐화
 *
 * WHY: 3개 뷰 상태(chapters, quiz, result)를 하나의 POM으로 관리
 * - 재사용 가능한 메서드
 * - 테스트 코드 가독성 향상
 * - UI 변경 시 유지보수 용이
 */

import { Page, Locator, expect } from '@playwright/test';

export class OXQuizPage {
  readonly page: Page;

  // === Chapters View (챕터 선택 화면) ===
  readonly pageTitle: Locator;
  readonly languageInfo: Locator;
  readonly backToQuizButton: Locator;
  readonly chapterCards: Locator;
  readonly firstChapter: Locator;
  readonly loadingSpinner: Locator;
  readonly noDataMessage: Locator;

  // === Quiz View (퀴즈 풀이 화면) ===
  readonly questionText: Locator;
  readonly oButton: Locator;
  readonly xButton: Locator;
  readonly nextButton: Locator;
  readonly timer: Locator;
  readonly scoreCorrect: Locator;
  readonly scoreWrong: Locator;
  readonly progressBar: Locator;
  readonly questionCounter: Locator;
  readonly explanationBox: Locator;
  readonly conceptTags: Locator;
  readonly lastAttemptBadge: Locator;

  // === Result View (결과 화면) ===
  readonly resultPercentage: Locator;
  readonly resultMessage: Locator;
  readonly resultSummary: Locator;
  readonly restartButton: Locator;
  readonly backToChaptersButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Chapters View
    this.pageTitle = page.locator('h1:has-text("OX 퀴즈")');
    this.languageInfo = page.locator('p').filter({ hasText: /C/ }).first();
    this.backToQuizButton = page.locator('a[href="/quiz"]');
    this.chapterCards = page.locator('button:has(h3)').filter({ has: page.locator('svg') });
    this.firstChapter = this.chapterCards.first();
    this.loadingSpinner = page.locator('svg.animate-spin');
    this.noDataMessage = page.locator('text=아직 퀴즈가 없습니다');

    // Quiz View
    this.questionText = page.locator('p.text-lg').filter({ hasText: /.+/ });
    this.oButton = page.locator('button:has-text("O")').filter({ hasText: /^O$/i });
    this.xButton = page.locator('button:has-text("X")').filter({ hasText: /^X$/i });
    this.nextButton = page.locator('button:has-text("다음 문제"), button:has-text("결과 보기")');
    this.timer = page.locator('span').filter({ hasText: /\d+s/ });
    this.scoreCorrect = page.locator('span:has-text("맞춤")').locator('span.font-bold');
    this.scoreWrong = page.locator('span:has-text("틀림")').locator('span.font-bold');
    this.progressBar = page.locator('div.bg-blue-500.rounded-full').first();
    this.questionCounter = page.locator('div.font-mono').filter({ hasText: /\d+\s*\/\s*\d+/ });
    this.explanationBox = page.locator('div').filter({ hasText: /정답!|오답!/ }).filter({ has: page.locator('svg') });
    this.conceptTags = page.locator('span').filter({ hasText: /^#/ });
    this.lastAttemptBadge = page.locator('div').filter({ hasText: /이전에 맞힌 문제|이전에 틀린 문제/ });

    // Result View
    this.resultPercentage = page.locator('span.text-3xl.font-bold').filter({ hasText: /%$/ });
    this.resultMessage = page.locator('h2.text-2xl.font-bold').filter({ hasText: /훌륭해요|잘했어요|다시 도전해보세요/ });
    this.resultSummary = page.locator('p').filter({ hasText: /문제 중/ });
    this.restartButton = page.locator('button:has-text("다시 풀기")');
    this.backToChaptersButton = page.locator('button:has-text("챕터 선택")');
  }

  // === 네비게이션 ===

  async goto(language: string = 'c') {
    await this.page.goto(`/quiz/ox/${language}`);
  }

  // === Chapters View 메서드 ===

  async waitForChaptersToLoad() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 5000 });
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
  }

  async getChapterCount(): Promise<number> {
    return await this.chapterCards.count();
  }

  async selectChapter(index: number = 0) {
    await this.chapterCards.nth(index).click();
  }

  async selectFirstChapter() {
    await this.firstChapter.click();
  }

  async getChapterTitle(index: number = 0): Promise<string> {
    return await this.chapterCards.nth(index).locator('h3').textContent() || '';
  }

  async getChapterStatistics(index: number = 0): Promise<{ total: string; attempted?: string; accuracy?: string }> {
    const card = this.chapterCards.nth(index);
    const statsText = await card.locator('div.text-sm').textContent() || '';

    // "10문제" 형식 추출
    const totalMatch = statsText.match(/(\d+)문제/);
    const attemptedMatch = statsText.match(/(\d+)개 시도/);
    const accuracyMatch = statsText.match(/정답률 (\d+)%/);

    return {
      total: totalMatch ? totalMatch[1] : '0',
      attempted: attemptedMatch ? attemptedMatch[1] : undefined,
      accuracy: accuracyMatch ? accuracyMatch[1] : undefined,
    };
  }

  // === Quiz View 메서드 ===

  async waitForQuizToLoad() {
    await this.questionText.waitFor({ state: 'visible', timeout: 5000 });
    await this.oButton.waitFor({ state: 'visible', timeout: 3000 });
  }

  async getQuestionText(): Promise<string> {
    return await this.questionText.textContent() || '';
  }

  async answerO() {
    await this.oButton.click();
  }

  async answerX() {
    await this.xButton.click();
  }

  async answer(isTrue: boolean) {
    if (isTrue) {
      await this.answerO();
    } else {
      await this.answerX();
    }
  }

  async waitForAnswerFeedback(timeout: number = 3000) {
    await this.explanationBox.waitFor({ state: 'visible', timeout });
  }

  async isAnswerCorrect(): Promise<boolean> {
    const feedbackText = await this.explanationBox.textContent() || '';
    return feedbackText.includes('정답!');
  }

  async getExplanation(): Promise<string> {
    const explanationText = await this.explanationBox.locator('p.text-sm').textContent() || '';
    return explanationText;
  }

  async getConcepts(): Promise<string[]> {
    const concepts: string[] = [];
    const count = await this.conceptTags.count();
    for (let i = 0; i < count; i++) {
      const text = await this.conceptTags.nth(i).textContent() || '';
      concepts.push(text.replace('#', '').trim());
    }
    return concepts;
  }

  async hasLastAttemptBadge(): Promise<boolean> {
    return await this.lastAttemptBadge.isVisible().catch(() => false);
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async getScore(): Promise<{ correct: number; wrong: number }> {
    const correctText = await this.scoreCorrect.textContent() || '0';
    const wrongText = await this.scoreWrong.textContent() || '0';
    return {
      correct: parseInt(correctText),
      wrong: parseInt(wrongText),
    };
  }

  async getCurrentProgress(): Promise<{ current: number; total: number }> {
    const counterText = await this.questionCounter.textContent() || '0 / 0';
    const [current, total] = counterText.split('/').map(s => parseInt(s.trim()));
    return { current, total };
  }

  async getTimerValue(): Promise<number> {
    const timerText = await this.timer.textContent() || '0s';
    return parseInt(timerText.replace('s', ''));
  }

  /**
   * 퀴즈 전체를 푸는 헬퍼 메서드
   * @param answers boolean 배열 (true = O, false = X)
   */
  async completeAllQuestions(answers: boolean[]) {
    for (let i = 0; i < answers.length; i++) {
      await this.waitForQuizToLoad();
      await this.answer(answers[i]);
      await this.waitForAnswerFeedback();
      await this.clickNext();

      // 마지막 문제가 아니면 잠시 대기 (애니메이션)
      if (i < answers.length - 1) {
        await this.page.waitForTimeout(300);
      }
    }
  }

  // === Result View 메서드 ===

  async waitForResultView() {
    await this.resultPercentage.waitFor({ state: 'visible', timeout: 5000 });
  }

  async getResultPercentage(): Promise<number> {
    const percentText = await this.resultPercentage.textContent() || '0%';
    return parseInt(percentText.replace('%', ''));
  }

  async getResultMessage(): Promise<string> {
    return await this.resultMessage.textContent() || '';
  }

  async getResultSummary(): Promise<{ correct: number; wrong: number; total: number }> {
    const summaryText = await this.resultSummary.textContent() || '';

    // "10문제 중 5문제 정답, 5문제 오답" 형식 파싱
    const totalMatch = summaryText.match(/(\d+)문제 중/);
    const correctMatch = summaryText.match(/(\d+)문제 정답/);
    const wrongMatch = summaryText.match(/(\d+)문제 오답/);

    return {
      total: totalMatch ? parseInt(totalMatch[1]) : 0,
      correct: correctMatch ? parseInt(correctMatch[1]) : 0,
      wrong: wrongMatch ? parseInt(wrongMatch[1]) : 0,
    };
  }

  async clickRestart() {
    await this.restartButton.click();
  }

  async clickBackToChapters() {
    await this.backToChaptersButton.click();
  }

  // === 검증 헬퍼 ===

  async expectChaptersViewVisible() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.languageInfo).toBeVisible();
  }

  async expectQuizViewVisible() {
    await expect(this.questionText).toBeVisible();
    await expect(this.oButton).toBeVisible();
    await expect(this.xButton).toBeVisible();
  }

  async expectResultViewVisible() {
    await expect(this.resultPercentage).toBeVisible();
    await expect(this.resultMessage).toBeVisible();
  }

  async expectCorrectFeedback() {
    await expect(this.explanationBox).toContainText('정답!');
  }

  async expectIncorrectFeedback() {
    await expect(this.explanationBox).toContainText('오답!');
  }
}
