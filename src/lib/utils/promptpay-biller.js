/* PromptPay Bill Payment — fixed institution biller configuration.
 *
 * Single source of truth for the CIDA biller QR identity, shared by the
 * Svelte app (PaymentForm.svelte) and the CLI runner
 * (scripts/generate-promptpay-bill-qr.mjs) so the two can't drift apart.
 *
 * The live payment QR is built from the PromptPay settings saved in the
 * Dashboard (admin_settings.promptpay, fetched via getPromptPayConfig). These
 * values are the fallback defaults used when the server config is unreachable.
 */

/**
 * @typedef {{
 *   billerId: string;
 *   ref1: string;
 *   ref2: string;
 *   ref3: string;
 *   pointOfInitiation: '11' | '12';
 * }} PromptPayDefaults
 */

/** @type {PromptPayDefaults} */
export const PROMPTPAY_DEFAULTS = {
  billerId: '010753700088205',
  ref1: 'ML099400ZO0160208VX',
  ref2: 'CIDA',
  ref3: '0000',
  pointOfInitiation: '11',
};

// Legacy aliases kept for the CLI runner.
export const BILLER_ID = PROMPTPAY_DEFAULTS.billerId;
export const REF_1 = PROMPTPAY_DEFAULTS.ref1;
export const REF_2 = PROMPTPAY_DEFAULTS.ref2;
