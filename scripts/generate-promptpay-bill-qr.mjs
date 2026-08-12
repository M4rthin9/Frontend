/* PromptPay Bill Payment QR generator — local runner.
 *
 * Builds the EMVCo Tag 30 payload for a hardcoded biller/booking and renders
 * the QR in-memory only: a terminal preview plus a transient base64 PNG
 * `data:` URL for display. Nothing is written to disk — the QR is regenerated
 * on demand whenever a booking becomes ready for payment.
 *
 * Usage:
 *   npm run qr:bill
 *   node scripts/generate-promptpay-bill-qr.mjs
 */

import QRCode from 'qrcode';
import { buildPromptPayBillPayment } from '../src/lib/utils/promptpay-emvco.js';
import { PROMPTPAY_DEFAULTS } from '../src/lib/utils/promptpay-biller.js';

/* ------------------------------------------------------------------ *
 * Test inputs — amount is the amount shown on the booking.
 * ------------------------------------------------------------------ */
const AMOUNT = '500.00'; // set to the amount shown on the booking

async function main() {
  const payload = buildPromptPayBillPayment({
    billerId: PROMPTPAY_DEFAULTS.billerId,
    ref1: PROMPTPAY_DEFAULTS.ref1,
    ref2: PROMPTPAY_DEFAULTS.ref2,
    ref3: PROMPTPAY_DEFAULTS.ref3,
    pointOfInitiation: '12', // dynamic — a specific amount is always set
    amount: AMOUNT,
  });

  console.log('PromptPay Bill Payment QR payload:');
  console.log(payload);
  console.log();

  const terminal = await QRCode.toString(payload, { type: 'terminal', small: true });
  console.log('Terminal preview:');
  console.log(terminal);
  console.log();

  // Transient PNG as a base64 data URL — display this in the UI when the
  // booking is ready for payment. No file is saved.
  const dataUrl = await QRCode.toDataURL(payload, { width: 600, margin: 2 });
  console.log('Base64 PNG data URL (for display only):');
  console.log(dataUrl.slice(0, 80) + `... (${dataUrl.length} chars, use as <img src=...>)`);
}

main().catch((error) => {
  console.error('Failed to generate PromptPay QR:', error);
  process.exit(1);
});
