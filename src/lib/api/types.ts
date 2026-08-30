export type BookingStatus =
  | 'รอตรวจสอบผู้เข้าร่วม'
  | 'รอตรวจสอบวินัย'
  | 'รอชำระเงิน'
  | 'ชำระแล้ว'
  | 'เสร็จสิ้น'
  | 'ไม่อนุมัติ'
  | 'ยกเลิก';

export type SlipVerifyStatus = 'ok' | 'mismatch' | 'slip_verify' | 'unreadable' | 'duplicate';

/** Result of scanning + parsing the slip QR against the booking. */
export interface SlipVerifyResult {
  status: SlipVerifyStatus;
  kind: 'paymentQr' | 'slipVerify' | 'trueMoneySlipVerify' | 'none';
  qrCount: number;
  at: string;
  detail?: Record<string, unknown> | null;
  match?: Record<string, unknown> | null;
  mismatch?: string[];
  duplicateOfRef?: string;
}

/** Per-booking PromptPay Bill Payment QR rendered server-side (Pillar 1). */
export interface PaymentQrResponse {
  payload: string;
  qrDataUrl: string;
  /** Branded SVG card (Thai QR Payment header + caption), server-rendered. */
  qrCardSvg?: string;
  amount: number;
  /** Tag-62 sub-fields (billNumber, storeLabel, …) carried by the payload. */
  additionalData?: Record<string, string> | null;
  billerId?: string;
  ref1?: string;
  ref2?: string;
  ref3?: string;
}

export interface ApiResult {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export interface Prisoner {
  prisonerName: string;
  prisonerId: string;
  wing: string;
  status: string;
  vinaiDate: string;
}

/** Fields exposed by the public lookupByRef endpoint (masked row). */
export interface PublicReservation {
  ref: string;
  timestamp?: string;
  status?: string;
  visitDate?: string;
  visitDateISO?: string;
  prisonerName?: string;
  prisonerId?: string;
  wing?: string;
  visitorName?: string;
  visitorApproved?: string;
  extraVisitorNames?: string;
  extraVisitorApproved?: string;
  visitorCount?: number | string;
  totalPersons?: number | string;
  total?: number | string;
  cancelReason?: string;
  archivedAt?: string;
}

export interface Note {
  text: string;
  user: string;
  timestamp: string;
}

export interface ExtraVisitor {
  name: string;
  id: string;
  relation: string;
  religion: string;
  allergy: string;
  age: string;
}

/** Main visitor fields collected on step 1. */
export interface VisitorInfo {
  name: string;
  id: string;
  phone: string;
  relation: string;
  religion: string;
  allergy: string;
}

export interface SaveReservationPayload {
  ref: string;
  timestamp: string;
  visitorName: string;
  visitorId: string;
  visitorPhone: string;
  relation: string;
  religion: string;
  allergy: string;
  visitorAge: string;
  extraVisitorReligions: string;
  extraVisitorAllergies: string;
  extraVisitorNames: string;
  prisonerName: string;
  prisonerId: string;
  wing: string;
  visitDate: string;
  visitDateISO: string;
  visitorCount: number;
  totalPersons: number;
  total: number;
  adultCount: number;
  child5to8Count: number;
  childUnder5Count: number;
  status: string;
  slipImage: string;
  turnstileToken: string;
  ip: string;
}

/**
 * A no-prisoner table booking. Structurally the same wire shape as a visit
 * booking; `ref` may be blank (the server mints a TBL- one) and the prisoner
 * fields are ignored by the server's table field whitelist.
 */
export type SaveTableReservationPayload = Omit<SaveReservationPayload, 'ref'> & { ref?: string };

export interface TableCounts {
  counts: Record<string, number>;
  /** Tables sellable per visit date. */
  perDay: number;
  /** Minutes an unpaid booking holds its slot. */
  holdMinutes: number;
  enabled: boolean;
}

export interface CostSummary {
  total: number;
  extraFees: number;
  discountNotes: string[];
  numVisitors: number;
  numExtras: number;
  adults: number;
  kids5_8: number;
  kidsUnder5: number;
  kids5_8Names: string[];
  kidsUnder5Names: string[];
}
