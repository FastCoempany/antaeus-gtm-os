/*
 * AE Hiring Brief commerce config (master spec §7.2).
 *
 * Deliberately separate from the Antaeus app commerce config: no $299/year,
 * no app plan metadata, no /purchase/success/, no signup or onboarding.
 *
 * checkoutEndpoint is the serverless endpoint that creates a Stripe Checkout
 * Session (spec §7.3: POST /api/ae-hire/create-checkout). It stays null until
 * that endpoint exists. While it is null the landing page shows an explicit
 * "checkout is not connected" notice instead of silently doing nothing
 * (spec §2.9). No Stripe secret ever belongs in this file.
 */
window.AE_HIRE_COMMERCE = {
  productCode: 'ae-hiring-brief-v1',
  priceLabel: '$149',
  currency: 'USD',
  checkoutEndpoint: null,
  intakePath: '/ae-hire/intake/',
  confirmationPath: '/ae-hire/confirmation/',
  supportEmail: 'hello@antaeus.app'
};
