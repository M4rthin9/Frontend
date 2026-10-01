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

export interface TableBookingPublicConfig {
  enabled: boolean;
  perDay: number;
  holdMinutes: number;
  seatsPerTable: number;
  /** When true the booking page blocks table booking behind a maintenance popup. */
  maintenance: boolean;
}

/** Admin open/close switch plus per-date overrides (admin_settings.bookingWindow). */
export interface BookingWindow {
  open: boolean;
  closedMessage: string;
  /** Date → short reason shown on the calendar. */
  closedDates: Record<string, string>;
  /** Dates opened even though the calendar blocks them by default (weekend/holiday). */
  openDates: string[];
}

export interface PromoAd {
  id: string;
  title: string;
  link: string;
  url: string;
}

export interface Promo {
  popupEnabled: boolean;
  ads: PromoAd[];
  notice: { enabled: boolean; title: string; body: string };
}

/** Cookie-banner policy version (a change re-asks the visitor) and DPO contact. */
export interface PdpaPublic {
  policyVersion: string;
  contact: string;
}

export interface PublicSettings {
  paymentEnabled: boolean;
  paymentClosedMessage: string;
  tableBooking: TableBookingPublicConfig;
  /** Daily cap on public prisoner-visit bookings (admin_settings.publicBooking). */
  publicBooking: { perDay: number };
  bookingWindow: BookingWindow;
  promo: Promo;
  pdpa: PdpaPublic;
}

export const DEFAULT_PDPA: PdpaPublic = { policyVersion: '1', contact: '' };

export const DEFAULT_PUBLIC_BOOKING = { perDay: 20 };

export const DEFAULT_BOOKING_WINDOW: BookingWindow = {
  open: true,
  closedMessage: '',
  closedDates: {},
  openDates: [],
};

export const EMPTY_PROMO: Promo = {
  popupEnabled: false,
  ads: [],
  notice: { enabled: false, title: '', body: '' },
};

const DEFAULT_TABLE_BOOKING: TableBookingPublicConfig = {
  enabled: true,
  perDay: 10,
  holdMinutes: 60,
  seatsPerTable: 5,
  maintenance: true,
};

/** Public read of the booking-site settings. Fails open: if the backend is
 *  unreachable we must never wrongly tell a visitor that payment is closed. */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const data = await callGet<{
      status: string;
      paymentEnabled?: boolean;
      paymentClosedMessage?: string;
      tableBooking?: Partial<TableBookingPublicConfig>;
      publicBooking?: { perDay?: number };
      bookingWindow?: Partial<BookingWindow>;
      promo?: Partial<Promo>;
      pdpa?: Partial<PdpaPublic>;
    }>('/api/public-settings', {});
    if (data.status !== 'ok') {
      return {
        paymentEnabled: true,
        paymentClosedMessage: '',
        tableBooking: DEFAULT_TABLE_BOOKING,
        publicBooking: DEFAULT_PUBLIC_BOOKING,
        bookingWindow: DEFAULT_BOOKING_WINDOW,
        promo: EMPTY_PROMO,
        pdpa: DEFAULT_PDPA,
      };
    }
    const bw = data.bookingWindow;
    const promo = data.promo;
    return {
      paymentEnabled: data.paymentEnabled !== false,
      paymentClosedMessage: data.paymentClosedMessage ?? '',
      tableBooking: {
        enabled: data.tableBooking?.enabled !== false,
        perDay: data.tableBooking?.perDay ?? DEFAULT_TABLE_BOOKING.perDay,
        holdMinutes: data.tableBooking?.holdMinutes ?? DEFAULT_TABLE_BOOKING.holdMinutes,
        seatsPerTable: data.tableBooking?.seatsPerTable ?? DEFAULT_TABLE_BOOKING.seatsPerTable,
        maintenance: data.tableBooking?.maintenance !== false,
      },
      publicBooking: { perDay: data.publicBooking?.perDay || DEFAULT_PUBLIC_BOOKING.perDay },
      bookingWindow: {
        open: bw?.open !== false,
        closedMessage: bw?.closedMessage ?? '',
        closedDates: bw?.closedDates ?? {},
        openDates: bw?.openDates ?? [],
      },
      promo: {
        popupEnabled: promo?.popupEnabled !== false,
        ads: promo?.ads ?? [],
        notice: promo?.notice ?? EMPTY_PROMO.notice,
      },
      pdpa: {
        policyVersion: data.pdpa?.policyVersion || DEFAULT_PDPA.policyVersion,
        contact: data.pdpa?.contact ?? '',
      },
    };
  } catch {
    return {
      paymentEnabled: true,
      paymentClosedMessage: '',
      tableBooking: DEFAULT_TABLE_BOOKING,
      publicBooking: DEFAULT_PUBLIC_BOOKING,
      bookingWindow: DEFAULT_BOOKING_WINDOW,
      promo: EMPTY_PROMO,
      pdpa: DEFAULT_PDPA,
    };
  }
}

export interface CookieConsentRecord {
  consentId: string;
  policyVersion: string;
  choice: 'accept_all' | 'reject_all' | 'custom';
  preferences: boolean;
  analytics: boolean;
  lang: string;
}

/** Log a cookie-banner decision server-side as PDPA consent evidence. */
export async function recordCookieConsent(record: CookieConsentRecord): Promise<void> {
  const data = await callAction<{ status: string; message?: string }>('recordCookieConsent', { ...record });
  assertOk(data);
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
