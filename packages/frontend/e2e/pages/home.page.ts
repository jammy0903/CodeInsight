/**
 * HomePage Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  // Locators
  readonly heroTitle: Locator;
  readonly playgroundButton: Locator;
  readonly startButton: Locator;
  readonly storyPanels: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.locator('text=코드가 어떻게');
    this.playgroundButton = page.getByRole('link', { name: /Playground/i }).first();
    this.startButton = page.getByRole('link', { name: /시작하기|코스/i }).first();
    this.storyPanels = page.locator('[class*="panel"], .story-panel');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickPlayground() {
    await this.playgroundButton.click();
  }

  async clickStart() {
    await this.startButton.click();
  }

  async isLoaded() {
    await this.heroTitle.waitFor({ state: 'visible', timeout: 10000 });
  }
}
