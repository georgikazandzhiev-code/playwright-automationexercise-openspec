import { expect, Locator, Page } from '@playwright/test';
import type { PaymentDetails } from '@data-providers/checkout.data';
import { DOWNLOAD_INVOICE_LABEL, ORDER_CONFIRMATION_TEXT } from '@utils/constants';
import { BasePage } from './base.page';

/**
 * `/payment` — card details + order confirmation.
 */
export class PaymentPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Locators (top) ── (testIdAttribute = data-qa; name-attribute fallback for robustness)
  get nameOnCardInput(): Locator {
    return this.page
      .getByTestId('name-on-card')
      .or(this.page.locator('input[name="name_on_card"]'));
  }

  get cardNumberInput(): Locator {
    return this.page.getByTestId('card-number').or(this.page.locator('input[name="card_number"]'));
  }

  get cvcInput(): Locator {
    return this.page.getByTestId('cvc').or(this.page.locator('input[name="cvc"]'));
  }

  get expiryMonthInput(): Locator {
    return this.page
      .getByTestId('expiry-month')
      .or(this.page.locator('input[name="expiry_month"]'));
  }

  get expiryYearInput(): Locator {
    return this.page.getByTestId('expiry-year').or(this.page.locator('input[name="expiry_year"]'));
  }

  get payButton(): Locator {
    return this.page
      .getByTestId('pay-button')
      .or(this.page.getByRole('button', { name: 'Pay and Confirm Order' }));
  }

  get orderConfirmationMessage(): Locator {
    return this.page.getByText(ORDER_CONFIRMATION_TEXT);
  }

  get downloadInvoiceButton(): Locator {
    return this.page.getByRole('link', { name: DOWNLOAD_INVOICE_LABEL });
  }

  // ── Methods (below) ──
  /**
   * Fill dummy card details and submit the payment.
   * @param payment - Non-real card data for the demo checkout.
   */
  fillAndPay = async (payment: PaymentDetails): Promise<void> => {
    await this.nameOnCardInput.fill(payment.nameOnCard);
    await this.cardNumberInput.fill(payment.cardNumber);
    await this.cvcInput.fill(payment.cvc);
    await this.expiryMonthInput.fill(payment.expiryMonth);
    await this.expiryYearInput.fill(payment.expiryYear);
    await this.payButton.click();
    await this.settleOverlaysAfterAction();
  };

  /**
   * Assert the order was confirmed and an invoice can be downloaded.
   */
  assertOrderConfirmed = async (): Promise<void> => {
    await expect(this.orderConfirmationMessage).toBeVisible();
    await expect(this.downloadInvoiceButton).toBeVisible();
  };
}
