/**
 * LessonPage Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class LessonPage {
  readonly page: Page;

  // Header
  readonly lessonTitle: Locator;
  readonly backButton: Locator;

  // Code Viewer
  readonly codeViewer: Locator;
  readonly codeLines: Locator;
  readonly highlightedLine: Locator;

  // Step Controls
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly stepIndicator: Locator;

  // Explanation
  readonly explanation: Locator;

  // Memory View
  readonly memoryView: Locator;
  readonly stackSection: Locator;
  readonly heapSection: Locator;

  // Quiz
  readonly quizButton: Locator;
  readonly quizCard: Locator;
  readonly quizOptions: Locator;
  readonly submitButton: Locator;
  readonly quizResult: Locator;

  // Completion
  readonly completeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.lessonTitle = page.locator('h1, h2').first();
    this.backButton = page.getByRole('button', { name: /뒤로|back|←/i });

    // Code Viewer (Monaco or fallback editor panel)
    this.codeViewer = page
      .locator(
        '.monaco-editor:visible, pre:visible, code:visible, .code-viewer:visible, [role="textbox"]:visible, [class*="editor"]:visible',
      )
      .first();
    this.codeLines = page.locator('.view-line, .code-line, [class*="line"]');
    this.highlightedLine = page.locator('.current-line, [class*="highlight"], [class*="active"]');

    // Step Controls
    this.prevButton = page.getByRole('button', { name: /이전|prev|←/i });
    this.nextButton = page.getByRole('button', { name: /다음|next|→/i });
    this.stepIndicator = page.getByText(/\d+\s*\/\s*\d+/).first();

    // Explanation
    this.explanation = page.locator('[class*="explanation"], [class*="step-text"]');

    // Memory View
    this.memoryView = page.locator('[class*="memory"], table').first();
    this.stackSection = page.locator('text=Stack').first();
    this.heapSection = page.locator('text=Heap').first();

    // Quiz
    this.quizButton = page.getByRole('button', { name: /퀴즈|quiz|문제/i });
    this.quizCard = page.locator('[class*="quiz"], [class*="question"], [role="dialog"]').first();
    this.quizOptions = page.locator('[class*="option"], button[class*="choice"]');
    this.submitButton = page.getByRole('button', { name: /제출|확인|submit|check/i });
    this.quizResult = page.locator('[class*="result"], [class*="feedback"]');

    // Completion
    this.completeButton = page.getByRole('button', { name: /완료|complete|finish/i });
  }

  async goto(lang: string, chapterId: string, lessonId: string) {
    await this.page.goto(`/courses/${lang}/${chapterId}/${lessonId}`);
  }

  async nextStep() {
    await this.nextButton.click();
    await this.page.waitForTimeout(300);
  }

  async prevStep() {
    await this.prevButton.click();
    await this.page.waitForTimeout(300);
  }

  async goToQuiz() {
    if (await this.quizButton.isVisible()) {
      await this.quizButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async selectQuizOption(index: number) {
    await this.quizOptions.nth(index).click();
  }

  async submitQuiz() {
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async isLoaded() {
    // Wait for either Monaco or the current editor fallback to be visible.
    await this.codeViewer.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(500);
  }

  async getStepCount(): Promise<{ current: number; total: number }> {
    const text = await this.stepIndicator.textContent();
    const match = text?.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return { current: 0, total: 0 };
  }
}
