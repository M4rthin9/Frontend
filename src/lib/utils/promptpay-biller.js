/* PromptPay Bill Payment — fixed institution biller configuration.
 *
 * Single source of truth for the CIDA biller QR identity, shared by the
 * Svelte app (PaymentForm.svelte) and the CLI runner
 * (scripts/generate-promptpay-bill-qr.mjs) so the two can't drift apart.
 */

export const BILLER_ID = '010753700088205';
export const REF_1 = 'ML099400ZO0160208VX';
export const REF_2 = 'CIDA';
