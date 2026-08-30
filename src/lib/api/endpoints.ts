import { callAction, callGet, assertOk } from './client';
import { rebuildPrisonerObjects } from '../utils/helpers';
import type {
  ApiResult,
  Note,
  PaymentQrResponse,
  Prisoner,
  PublicReservation,
  SaveReservationPayload,
  SaveTableReservationPayload,
  TableCounts,
  SlipVerifyResult,
  SlipVerifyStatus,
} from './types';

export async function ping(): Promise<{ status: string; pong?: boolean; timestamp?: string }> {
  return callAction<{ status: string; pong?: boolean; timestamp?: string }>('ping');
}

export async function testConnection(): Promise<{
  status: string;
  message?: string;
  reservationCount?: number;
}> {
  return callAction<{ status: string; message?: string; reservationCount?: number }>(
    'testConnection',
  );
}

/** Full prisoner master (minified rows) via GET /api/prisoners. */
export async function getPrisoners(): Promise<Prisoner[]> {
  const data = await callGet<{ status: string; prisoners: string[][] | Prisoner[] }>(
    '/api/prisoners',
  );
  assertOk(data);
  return rebuildPrisonerObjects(data.prisoners ?? []);
}

/** Active booking counts per visitDateISO — drives the calendar quota. */
export async function getCountsByDate(): Promise<Record<string, number>> {
  const data = await callAction<{ status: string; counts?: Record<string, number> }>(
    'getCountsByDate',
  );
  assertOk(data);
  return data.counts ?? {};
}

/**
 * Availability for the parallel no-prisoner table flow: used slots per date plus
 * the day's capacity. Deliberately separate from getCountsByDate — the two pools
 * are independent.
 */
export async function getTableCountsByDate(): Promise<TableCounts> {
  const data = await callAction<{ status: string } & Partial<TableCounts>>('getTableCountsByDate');
  assertOk(data);
  return {
    counts: data.counts ?? {},
    perDay: data.perDay ?? 10,
    holdMinutes: data.holdMinutes ?? 60,
    enabled: data.enabled !== false,
  };
}

/** Public status lookup by ref number or prisoner ID. */
export async function lookupByRef(query: {
  ref?: string;
  prisonerId?: string;
}): Promise<PublicReservation[]> {
  const data = await callAction<{ status: string; rows?: PublicReservation[] }>(
    'lookupByRef',
    query,
  );
  assertOk(data);
  return data.rows ?? [];
}

/** Submit a new booking (Turnstile token required). */
export async function saveReservation(payload: SaveReservationPayload): Promise<{ ref: string }> {
  const data = await callAction<{ status: string; ref?: string; message?: string }>(
    'saveReservation',
    payload as unknown as Record<string, unknown>,
    { timeoutMs: 45000 },
  );
  assertOk(data);
  return { ref: data.ref ?? '' };
}

/**
 * Submit a no-prisoner table booking (Turnstile token required). The server
 * assigns the ref (TBL- prefix) and creates the booking directly in 'รอชำระเงิน',
 * held for `holdMinutes` while the visitor pays.
 */
export async function saveTableReservation(
  payload: SaveTableReservationPayload,
): Promise<{ ref: string; holdExpiresAt?: string; holdMinutes?: number }> {
  const data = await callAction<{
    status: string;
    ref?: string;
    holdExpiresAt?: string;
    holdMinutes?: number;
    message?: string;
  }>('saveTableReservation', payload as unknown as Record<string, unknown>, { timeoutMs: 45000 });
  assertOk(data);
  return { ref: data.ref ?? '', holdExpiresAt: data.holdExpiresAt, holdMinutes: data.holdMinutes };
}

/** Upload a slip image (base64 data URI) for a booking ref. */
export async function uploadSlip(input: {
  ref: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
}): Promise<{ url: string; verify?: SlipVerifyResult }> {
  const data = await callAction<{
    status: string;
    url?: string;
    verify?: SlipVerifyResult;
    message?: string;
  }>('uploadSlip', input as unknown as Record<string, unknown>, { timeoutMs: 120000 });
  assertOk(data);
  return { url: data.url ?? '', verify: data.verify };
}

/** Mark a booking as paid with the uploaded slip image. */
export async function updateSlipAndStatus(input: {
  ref: string;
  status: string;
  slipImage: string;
}): Promise<void> {
  const data = await callAction<{ status: string; message?: string }>(
    'updateSlipAndStatus',
    input as unknown as Record<string, unknown>,
    { timeoutMs: 600000 },
  );
  assertOk(data);
}

/** Public self-service cancellation. */
export async function publicCancelBooking(ref: string): Promise<void> {
  const data = await callAction<{ status: string; message?: string }>('publicCancelBooking', {
    ref,
  });
  assertOk(data);
}

/** Cancellation notes for a ref (shown on cancelled bookings). */
export async function getNotes(ref: string): Promise<Note[]> {
  const data = await callAction<{ status: string; notes?: Note[] }>('getNotes', { ref });
  assertOk(data);
  return data.notes ?? [];
}

export interface PublicSettings {
  paymentEnabled: boolean;
  paymentClosedMessage: string;
}

/** Public read of the booking-site settings. Fails open: if the backend is
 *  unreachable we must never wrongly tell a visitor that payment is closed. */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const data = await callGet<{
      status: string;
      paymentEnabled?: boolean;
      paymentClosedMessage?: string;
    }>('/api/public-settings', {});
    if (data.status !== 'ok') return { paymentEnabled: true, paymentClosedMessage: '' };
    return {
      paymentEnabled: data.paymentEnabled !== false,
      paymentClosedMessage: data.paymentClosedMessage ?? '',
    };
  } catch {
    return { paymentEnabled: true, paymentClosedMessage: '' };
  }
}

/** Per-booking PromptPay Bill Payment QR (rendered server-side, Pillar 1).
 *  The worker mints this booking's ref1 on first call and renders the QR, so
 *  the client never touches the biller config or EMVCo payloads. */
export async function getPaymentQr(ref: string): Promise<PaymentQrResponse> {
  const data = await callGet<{
    status: string;
    payload?: string;
    qrDataUrl?: string;
    qrCardSvg?: string;
    amount?: number;
    additionalData?: Record<string, string> | null;
    message?: string;
  }>('/api/promptpay/qr', { ref });
  assertOk(data);
  if (!data.payload || !data.qrDataUrl) {
    throw new Error(data.message || 'QR generation failed');
  }
  return {
    payload: data.payload,
    qrDataUrl: data.qrDataUrl,
    qrCardSvg: data.qrCardSvg,
    amount: data.amount ?? 0,
    additionalData: data.additionalData ?? null,
  };
}

/** Scan + parse the slip QR and compare it against the booking's expected
 *  biller/refs/amount. Passes the freshly uploaded base64 so the result is
 *  returned immediately without re-fetching the stored slip. */
export async function verifySlip(input: {
  ref: string;
  base64Data: string;
}): Promise<SlipVerifyResult> {
  const data = await callAction<{
    status: string;
    result?: SlipVerifyResult;
    message?: string;
  }>('verifySlip', input as unknown as Record<string, unknown>, { timeoutMs: 30000 });
  assertOk(data);
  return data.result ?? { status: 'unreadable', kind: 'none', qrCount: 0, at: '' };
}

export type { ApiResult, SlipVerifyResult, SlipVerifyStatus };
