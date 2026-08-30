import { toLocalDateStr, addDays } from './date';

/** Default maximum number of bookings (tables) per day for the prisoner-visit
 *  flow. The parallel no-prisoner table flow supplies its own, smaller quota
 *  from the server (admin_settings.tableBooking.perDay). */
export const QUOTA = 20;

/** Fixed 2026 holidays & special blocked dates (ported verbatim from booking.js). */
export const HOLIDAYS: Record<string, string> = {
  '2026-01-01': 'วันขึ้นปีใหม่',
  '2026-02-13': 'มาฆบูชา',
  '2026-04-06': 'จักรี',
  '2026-04-13': 'สงกรานต์',
  '2026-04-14': 'สงกรานต์',
  '2026-04-15': 'สงกรานต์',
  '2026-05-01': 'แรงงาน',
  '2026-05-04': 'ฉัตรมงคล',
  '2026-05-11': 'วิสาขบูชา',
  '2026-06-03': 'วันพระราชินี',
  '2026-07-28': 'วันเฉลิม ร.10',
  '2026-07-29': 'อาสาฬหบูชา',
  '2026-07-30': 'หยุดชดเชย',
  '2026-08-12': 'วันแม่',
  '2026-10-13': 'วันสวรรคต ร.9',
  '2026-10-23': 'จุฬาลงกรณ์',
  '2026-12-05': 'วันพ่อ',
  '2026-12-10': 'รัฐธรรมนูญ',
  '2026-12-31': 'วันสิ้นปี',
  '2026-05-25': 'ปิดจอง',
  '2026-06-01': 'หยุดชดเชย',
  '2026-06-29': 'เต็ม',
  '2026-08-11': 'เยี่ยมญาติใกล้ชิด',
  '2026-08-13': 'เยี่ยมญาติใกล้ชิด',
  '2026-08-14': 'เยี่ยมญาติใกล้ชิด',
  '2026-08-17': 'เยี่ยมญาติใกล้ชิด',
  '2026-08-18': 'เยี่ยมญาติใกล้ชิด',
};

export type CalendarCellKind =
  | 'outside'
  | 'past'
  | 'holiday'
  | 'weekend'
  | 'full'
  | 'available'
  | 'selected';

export interface CalendarCell {
  date: string;
  day: number;
  kind: CalendarCellKind;
  quota: number;
  label?: string;
  blocked: boolean;
}

/** Build one month of cells mirroring renderCalendar() in booking.js. */
export function buildCalendarCells(
  year: number,
  month: number,
  selectedDate: string | null,
  bookings: Record<string, number>,
  perDay: number = QUOTA,
): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const todayStr = toLocalDateStr(today);
  const minAllowedStr = toLocalDateStr(addDays(today, 1)); // พรุ่งนี้
  const maxAllowedStr = toLocalDateStr(addDays(today, 16)); // 14 วันล่วงหน้า

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: '', day: 0, kind: 'outside', quota: 0, blocked: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toLocalDateStr(new Date(year, month, d));
    const dow = new Date(year, month, d).getDay();
    const isPast = dateStr < todayStr;
    const isWknd = dow === 0 || dow === 6;
    const isHol = HOLIDAYS[dateStr];
    const used = bookings[dateStr] || 0;
    const isFull = used >= perDay;
    const isNotWithinWindow = dateStr < minAllowedStr || dateStr > maxAllowedStr;

    let kind: CalendarCellKind = 'available';
    if (dateStr === selectedDate) kind = 'selected';
    else if (isPast || isNotWithinWindow) kind = 'past';
    else if (isHol) kind = 'holiday';
    else if (isWknd) kind = 'weekend';
    else if (isFull) kind = 'full';

    cells.push({
      date: dateStr,
      day: d,
      kind,
      quota: used,
      label: isHol,
      blocked: isPast || isNotWithinWindow || !!isHol || isWknd || isFull,
    });
  }
  return cells;
}

export function calendarTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
  });
}
