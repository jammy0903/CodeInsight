/**
 * CoursesPage Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class CoursesPage {
  readonly page: Page;

  // Locators
  readonly pageTitle: Locator;
  readonly languageCards: Locator;
  readonly cLanguageCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').first();
    this.languageCards = page.locator('button.group, [class*="language-card"]');
    this.cLanguageCard = page.locator('button').filter({ hasText: /^C$|C 언어/ }).first();
  }

  async goto() {
    await this.page.goto('/courses');
  }

  async selectLanguage(lang: 'c' | 'java' | 'python') {
    const langMap = {
      c: /^C$|C 언어/,
      java: /Java/,
      python: /Python/,
    };
    const card = this.page.locator('button').filter({ hasText: langMap[lang] }).first();
    await card.click();
  }

  async selectFirstLanguage() {
    await this.languageCards.first().click();
  }

  async isLoaded() {
    await this.languageCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }
}

export class LanguageCoursePage {
  readonly page: Page;

  // Locators
  readonly chapterAccordions: Locator;
  readonly lessonItems: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chapterAccordions = page.locator('[data-state], button[class*="accordion"]');
    this.lessonItems = page.locator('[class*="cursor-pointer"], [class*="lesson-item"]');
    this.backButton = page.getByRole('link', { name: /뒤로|back/i });
  }

  async goto(lang: string) {
    await this.page.goto(`/courses/${lang}`);
  }

  async expandChapter(chapterName: string) {
    const chapter = this.page.locator('button').filter({ hasText: chapterName });
    await chapter.click();
    await this.page.waitForTimeout(500); // 아코디언 애니메이션
  }

  async expandFirstChapter() {
    await this.chapterAccordions.first().click();
    await this.page.waitForTimeout(500);
  }

  async selectLesson(lessonName: string) {
    const lesson = this.page.locator('div, button').filter({ hasText: lessonName }).first();
    await lesson.click();
  }

  async selectFirstLesson() {
    await this.lessonItems.first().click();
  }

  async isLoaded() {
    await this.chapterAccordions.first().waitFor({ state: 'visible', timeout: 10000 });
  }
}
