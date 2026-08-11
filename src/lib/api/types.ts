export type BookingStatus =
  | 'รอตรวจสอบผู้เข้าร่วม'
  | 'รอตรวจสอบวินัย'
  | 'รอชำระเงิน'
  | 'ชำระแล้ว'
  | 'เสร็จสิ้น'
  | 'ไม่อนุมัติ'
  | 'ยกเลิก';

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
