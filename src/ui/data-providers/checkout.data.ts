export type PaymentDetails = {
  nameOnCard: string;
  cardNumber: string;
  cvc: string;
  expiryMonth: string;
  expiryYear: string;
};

/**
 * Dummy (non-real) card details for the demo checkout — never a real card.
 */
export const getDummyPayment = (): PaymentDetails => ({
  nameOnCard: 'QA Tester',
  cardNumber: '4111111111111111',
  cvc: '123',
  expiryMonth: '12',
  expiryYear: '2030',
});

/**
 * Comment placed in the "Review Your Order" box before placing the order.
 */
export const getOrderComment = (): string => 'Automated E2E checkout — please ignore (test order).';
