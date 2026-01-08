/**
 * HomePage Page Object Model
 */

import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  // Locators
  readonly heroTitle: Locator;
  readonly loginButton: Locator;
  readonly startButton: Locator;
  readonly storyPanels: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroTitle = page.locator('text=코드가 어떻게');
    this.loginButton = page.locator('text=로그인하기').first();
    this.startButton = page.getByRole('link', { name: /시작하기|코스/i }).first();
    this.storyPanels = page.locator('[class*="panel"], .story-panel');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async clickStart() {
    await this.startButton.click();
  }

  async isLoaded() {
    await this.heroTitle.waitFor({ state: 'visible', timeout: 10000 });
  }
}
