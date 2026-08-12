import { callAction, callGet, assertOk } from './client';
import { rebuildPrisonerObjects } from '../utils/helpers';
import { PROMPTPAY_DEFAULTS } from '../utils/promptpay-biller';
import type {
  ApiResult,
  Note,
  Prisoner,
  PromptPayConfig,
  PublicReservation,
  SaveReservationPayload,
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

/** Upload a slip image (base64 data URI) for a booking ref. */
export async function uploadSlip(input: {
  ref: string;
  fileName: string;
  mimeType: string;
  base64Data: string;
}): Promise<string> {
  const data = await callAction<{ status: string; url?: string; message?: string }>(
    'uploadSlip',
    input as unknown as Record<string, unknown>,
    { timeoutMs: 120000 },
  );
  assertOk(data);
  return data.url ?? '';
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

/** Public PromptPay biller config saved from the Dashboard (admin_settings.promptpay). */
export async function getPromptPayConfig(): Promise<PromptPayConfig> {
  const data = await callAction<{ status: string; config?: PromptPayConfig }>(
    'getPromptPayConfig',
  );
  assertOk(data);
  return data.config ?? { ...PROMPTPAY_DEFAULTS };
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
