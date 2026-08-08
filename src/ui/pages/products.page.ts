import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * `/products` listing + search results.
 */
export class ProductsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (top) ──
  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search Product');
  }

  // Submit button has no accessible name / testid — CSS id is the only stable hook (last resort).
  get searchSubmit(): Locator {
    return this.page.locator('#submit_search');
  }

  get productInfoBlocks(): Locator {
    return this.page.locator('.features_items .productinfo');
  }

  get searchedProductsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Searched Products' });
  }

  get viewProductLinks(): Locator {
    return this.page.getByRole('link', { name: 'View Product' });
  }

  // ── Methods (below) ──
  /**
   * Run a product search from the products page.
   * @param keyword - Query string.
   */
  searchFor = async (keyword: string): Promise<void> => {
    await this.searchInput.fill(keyword);
    await this.searchSubmit.click();
    await this.settleOverlaysAfterAction();
  };

  /**
   * Assert every visible product card title matches the keyword (case-insensitive).
   * Hyphens / spaces are ignored so e.g. `Tshirt` matches `t-shirt` in titles.
   * @param keyword - Expected substring in each card.
   */
  assertAllVisibleResultsContainKeyword = async (keyword: string): Promise<void> => {
    await expect(this.searchedProductsHeading).toBeVisible();
    const titles = this.productInfoBlocks.locator('p');
    const count = await titles.count();
    expect(count, 'Expected at least one search result').toBeGreaterThan(0);
    const foldedKeyword = foldProductTitleForMatch(keyword);
    for (let i = 0; i < count; i += 1) {
      const text = await titles.nth(i).innerText();
      const foldedTitle = foldProductTitleForMatch(text);
      expect(foldedTitle.includes(foldedKeyword), `Result ${i} should mention keyword`).toBe(true);
    }
  };

  /**
   * Assert the search results view rendered at all (REQ-SEC-10).
   *
   * Needed by the payload case: "no results" is only meaningful if the page came back.
   * A blank page would satisfy `assertNoSearchResultsRendered` while telling us nothing.
   */
  assertSearchResultsPageRendered = async (): Promise<void> => {
    await expect(this.searchedProductsHeading).toBeVisible();
  };

  /**
   * Assert no product cards are rendered for the current search view.
   */
  assertNoSearchResultsRendered = async (): Promise<void> => {
    await expect(this.productInfoBlocks).toHaveCount(0);
  };

  /**
   * Open the first "View Product" link from the current listing.
   */
  openFirstViewProduct = async (): Promise<void> => {
    await this.viewProductLinks.first().click();
    await this.settleOverlaysAfterAction();
  };
}

const foldProductTitleForMatch = (value: string): string =>
  value.toLowerCase().replace(/[\s\-_]+/g, '');
