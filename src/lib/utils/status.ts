import { i18n } from '../i18n/i18n.svelte';
import type { PublicReservation } from '../api/types';
import { parseThaiDateToISO, toLocalDateStr } from './date';

export type NormalizedStatus =
  | 'รอตรวจสอบผู้เข้าร่วม'
  | 'รอตรวจสอบวินัย'
  | 'รอชำระเงิน'
  | 'ชำระแล้ว'
  | 'เสร็จสิ้น'
  | 'ยกเลิก'
  | 'ไม่อนุมัติ';

const CANONICAL: NormalizedStatus[] = [
  'รอตรวจสอบผู้เข้าร่วม',
  'รอตรวจสอบวินัย',
  'รอชำระเงิน',
  'ชำระแล้ว',
  'เสร็จสิ้น',
  'ยกเลิก',
  'ไม่อนุมัติ',
];

/** Normalize a raw backend status string into one of the canonical statuses. */
export function normalizeStatus(status: string | null | undefined): NormalizedStatus {
  const v = String(status ?? '').trim();
  if ((CANONICAL as string[]).includes(v)) return v as NormalizedStatus;
  const low = v.toLowerCase();
  if (v === 'รอตรวจสอบ') return 'รอตรวจสอบวินัย';
  if (low === 'approved' || v === 'อนุมัติ') return 'รอชำระเงิน';
  if (low === 'rejected') return 'ไม่อนุมัติ';
  if (low === 'paid') return 'ชำระแล้ว';
  if (low === 'done') return 'เสร็จสิ้น';
  if (low === 'cancelled') return 'ยกเลิก';
  return 'รอตรวจสอบผู้เข้าร่วม';
}

/** i18n pill label for a normalized status. */
export function statusPillLabel(status: string | null | undefined): string {
  const s = normalizeStatus(status);
  switch (s) {
    case 'รอชำระเงิน':
      return i18n.t('statusPillApproved');
    case 'ชำระแล้ว':
      return i18n.t('statusPillPaid');
    case 'เสร็จสิ้น':
      return i18n.t('statusPillDone');
    case 'ยกเลิก':
      return i18n.t('statusPillCancelled');
    case 'ไม่อนุมัติ':
      return i18n.t('statusPillRejected');
    case 'รอตรวจสอบวินัย':
      return i18n.t('statusPillDiscipline');
    case 'รอตรวจสอบผู้เข้าร่วม':
      return i18n.t('statusPillParticipants');
    default:
      return i18n.t('statusPillPending');
  }
}

/** CSS modifier for the status pill (pending/approved/rejected/paid/cancelled). */
export function statusPillClass(status: string | null | undefined): string {
  const s = normalizeStatus(status);
  switch (s) {
    case 'รอชำระเงิน':
      return 'status-approved';
    case 'ชำระแล้ว':
      return 'status-paid';
    case 'เสร็จสิ้น':
      return 'status-paid';
    case 'ยกเลิก':
      return 'status-cancelled';
    case 'ไม่อนุมัติ':
      return 'status-rejected';
    default:
      return 'status-pending';
  }
}

/** Top-bar accent modifier on the result card. */
export function statusCardClass(status: string | null | undefined): string {
  const s = normalizeStatus(status);
  switch (s) {
    case 'รอชำระเงิน':
      return 'status-approved';
    case 'ชำระแล้ว':
      return 'status-paid';
    case 'เสร็จสิ้น':
      return 'status-paid';
    case 'ยกเลิก':
      return 'status-cancelled';
    case 'ไม่อนุมัติ':
      return 'status-rejected';
    default:
      return 'status-pending';
  }
}

/** Find the booking to display: exact ref match, or earliest upcoming for a prisoner. */
export function pickBooking(
  rows: PublicReservation[],
  query: string,
  mode: 'ref' | 'prisoner',
): PublicReservation | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const todayStr = toLocalDateStr(new Date());
  const cancelled = new Set(['ยกเลิก', 'cancelled']);
  const completed = new Set(['เสร็จสิ้น', 'done']);

  if (mode === 'ref') {
    return (
      rows.find(
        (r) =>
          String(r.ref ?? '')
            .trim()
            .toUpperCase() === query,
      ) ?? null
    );
  }

  const matches = rows.filter((r) => String(r.prisonerId ?? '').trim() === query);
  if (matches.length === 0) return null;

  const valid = matches
    .filter((r) => {
      const s = normalizeStatus(r.status);
      if (cancelled.has(s)) return false;
      if (completed.has(s)) {
        const iso = String(r.visitDateISO || parseThaiDateToISO(r.visitDate) || '').trim();
        return iso >= todayStr;
      }
      return true;
    })
    .sort((a, b) => {
      const d1 = String(a.visitDateISO || parseThaiDateToISO(a.visitDate) || '');
      const d2 = String(b.visitDateISO || parseThaiDateToISO(b.visitDate) || '');
      return d1.localeCompare(d2);
    });

  return valid[0] ?? null;
}

/** Parse the reference's extraVisitorNames payload into plain names. */
export function parseExtraVisitorNames(raw: string | null | undefined): string[] {
  if (!raw || !String(raw).trim()) return [];
  const s = String(raw);
  const isNew = s.includes(';;') || s.includes('|');
  if (isNew) {
    return s
      .split(';;')
      .map((e) => {
        const p = e.split('|');
        return (p[0] || '').trim();
      })
      .filter((n) => n);
  }
  return s
    .split(/,(?![^(]*\))/)
    .map((e) => {
      const m = e.trim().match(/^(.+?)\s*\(/);
      return m ? m[1].trim() : e.trim();
    })
    .filter((n) => n);
}

/** Individual approval state (yes/no/pending) for a visitor. */
export type ApprovalState = 'yes' | 'no' | 'pending';

export function approvalState(raw: string | null | undefined): ApprovalState {
  const v = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (v === 'yes') return 'yes';
  if (v === 'no') return 'no';
  return 'pending';
}

export function approvalLabel(state: ApprovalState): string {
  if (state === 'yes') return i18n.t('approveYes');
  if (state === 'no') return i18n.t('approveNo');
  return '';
}
