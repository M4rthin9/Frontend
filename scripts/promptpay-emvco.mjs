/* PromptPay Bill Payment — EMVCo Tag 30 payload builder.
 *
 * Pure, dependency-free ES module. Implements the EMVCo Merchant-Presented
 * QR Code standard as used by Thai PromptPay Bill Payment (Biller/Corporate
 * QR). Verified against a real decoded PromptPay payload:
 *
 *   0002010102113070...5802TH6208070400006304968B
 *
 * Structure produced (root tags, EMVCo order):
 *   00 Payload Format Indicator  = 01
 *   01 Point of Initiation      = 11 (static) / 12 (dynamic)
 *   30 Merchant Account Info     -> 00 AID, 01 Biller ID, 02 Ref 1, 03 Ref 2
 *   53 Transaction Currency      = 764 (THB)
 *   [54 Transaction Amount]      only when an amount is supplied
 *   58 Country Code              = TH
 *   62 Additional Data           -> 07 Ref 3 (default "0000")
 *   63 Checksum                  = CRC-16/CCITT-FALSE over the full payload,
 *                                 INCLUDING the literal "6304" tag+length
 *
 * NOTE on the checksum: the Thai PromptPay QR spec computes the CRC over the
 * entire string including the "6304" marker (crc16(data + "6304")). This is
 * the convention the fielded PromptPay validators use, so it is what we must
 * match — verified byte-for-byte against the real decoded payload above.
 */

const PROMPTPAY_AID = 'A000000677010112';

/**
 * CRC-16/CCITT-FALSE checksum (poly 0x1021, init 0xFFFF, no reflection).
 * Returns the checksum as 4 upper-case hex characters as required by EMVCo.
 *
 * @param {string} data ASCII payload to checksum (PromptPay includes the
 *   trailing "6304" marker in the checksum input — see module notes)
 * @returns {string} e.g. "968B"
 */
export function crc16(data) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Build a single EMVCo TLV segment: 2-digit tag + 2-digit zero-padded
 * decimal length + value.
 *
 * @param {string} tag 2-character tag id, e.g. "30"
 * @param {string} value TLV value
 * @returns {string} encoded TLV segment
 */
export function buildTlv(tag, value) {
  if (!/^\d{2}$/.test(tag)) {
    throw new Error(`Invalid EMVCo tag "${tag}" (must be exactly 2 digits).`);
  }
  const length = String(value.length).padStart(2, '0');
  return `${tag}${length}${value}`;
}

/**
 * Build a complete PromptPay Bill Payment QR payload.
 *
 * @param {object} options
 * @param {string} options.billerId 15-digit Biller ID (Tax ID + Suffix)
 * @param {string} options.ref1 Reference 1 (invoice/reference string)
 * @param {string} [options.ref2] Reference 2 (e.g. "CIDA"); optional
 * @param {string} [options.ref3] Reference 3 inside Tag 62; default "0000"
 * @param {string|number} [options.amount] Transaction amount; when omitted
 *   no Tag 54 is emitted and the QR is an amount-free promptpay payload
 * @param {'11'|'12'} [options.pointOfInitiation] "11" static / "12" dynamic;
 *   default "11" (matches the verified original payload)
 * @returns {string} full EMVCo QR payload including the "6304" CRC suffix
 */
export function buildPromptPayBillPayment({
  billerId,
  ref1,
  ref2,
  ref3 = '0000',
  amount,
  pointOfInitiation = '11',
}) {
  if (!/^\d{15}$/.test(billerId)) {
    throw new Error(
      `Invalid Biller ID "${billerId}" (must be exactly 15 digits: Tax ID + suffix).`,
    );
  }
  if (typeof ref1 !== 'string' || ref1.length === 0) {
    throw new Error('Reference 1 (ref1) is required and must be a non-empty string.');
  }
  if (pointOfInitiation !== '11' && pointOfInitiation !== '12') {
    throw new Error(`Invalid point of initiation "${pointOfInitiation}" (use "11" or "12").`);
  }

  const format = buildTlv('00', '01'); // Payload Format Indicator
  const poi = buildTlv('01', pointOfInitiation); // Point of Initiation

  // Tag 30 — Merchant Account Information (Biller QR).
  const merchantFields = [
    buildTlv('00', PROMPTPAY_AID), // AID identifying PromptPay Bill Payment
    buildTlv('01', billerId), // Biller ID (15 digits)
    buildTlv('02', ref1), // Reference 1
    ref2 ? buildTlv('03', ref2) : null, // Reference 2 (optional)
  ]
    .filter(Boolean)
    .join('');
  const merchantInfo = buildTlv('30', merchantFields);

  const currency = buildTlv('53', '764'); // THB
  const amountTlv =
    amount !== undefined && amount !== null && amount !== ''
      ? buildTlv('54', Number(amount).toFixed(2))
      : ''; // Tag 54 only when a real amount is provided

  const country = buildTlv('58', 'TH');

  // Tag 62 — Additional Data (sub-tag 07 = Reference 3, default "0000").
  const additionalData = buildTlv('62', buildTlv('07', ref3));

  const withoutCrc = format + poi + merchantInfo + currency + amountTlv + country + additionalData;
  // Thai PromptPay checksum input includes the literal "6304" tag+length.
  const withCrcMarker = `${withoutCrc}6304`;
  return `${withCrcMarker}${crc16(withCrcMarker)}`;
}
