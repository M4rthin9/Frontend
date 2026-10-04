import { toLocalDateStr, addDays, parseLocalDate } from './date';

/** Default maximum number of bookings (tables) per day for the prisoner-visit
 *  flow. The parallel no-prisoner table flow supplies its own, smaller quota
 *  from the server (admin_settings.tableBooking.perDay). */
export const QUOTA = 20;

/** Furthest bookable date, counted in weekdays from today (tomorrow is the first;
 *  Saturday and Sunday don't count). The next date opens at 07:00 Bangkok; the
 *  backend enforces the same rule (lastOpenDateISO). */
export const BOOKING_MAX_DAYS_AHEAD = 14;

/**
 * Fixed public holidays & special blocked dates. 2026 was ported verbatim from
 * booking.js; 16 Oct and 7 Dec 2026 and all of 2027 follow the official
 * announcements (Bank of Thailand notice 37/2569 for 2027, Royal Gazette
 * vol. 143 special part 202 ง). One-off closures belong in the dashboard's
 * booking-window calendar, not here.
 */
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
  // Cabinet special holiday for Bangkok government offices (IMF–World Bank meetings).
  '2026-10-16': 'หยุดพิเศษ กทม.',
  '2026-10-23': 'จุฬาลงกรณ์',
  '2026-12-05': 'วันพ่อ',
  '2026-12-07': 'ชดเชยวันพ่อ',
  '2026-12-10': 'รัฐธรรมนูญ',
  '2026-12-31': 'วันสิ้นปี',
  // ── 2027 (พ.ศ. 2570) ──
  '2027-01-01': 'วันขึ้นปีใหม่',
  '2027-02-21': 'มาฆบูชา',
  '2027-02-22': 'ชดเชยมาฆบูชา',
  '2027-04-06': 'จักรี',
  '2027-04-13': 'สงกรานต์',
  '2027-04-14': 'สงกรานต์',
  '2027-04-15': 'สงกรานต์',
  '2027-05-01': 'แรงงาน',
  '2027-05-03': 'ชดเชยแรงงาน',
  '2027-05-04': 'ฉัตรมงคล',
  '2027-05-20': 'วิสาขบูชา',
  '2027-06-03': 'วันพระราชินี',
  '2027-07-18': 'อาสาฬหบูชา',
  '2027-07-19': 'เข้าพรรษา',
  '2027-07-28': 'วันเฉลิม ร.10',
  '2027-08-12': 'วันแม่',
  '2027-10-13': 'วันสวรรคต ร.9',
  '2027-10-23': 'จุฬาลงกรณ์',
  '2027-10-25': 'ชดเชยจุฬาลงกรณ์',
  '2027-12-05': 'วันพ่อ',
  '2027-12-06': 'ชดเชยวันพ่อ',
  '2027-12-10': 'รัฐธรรมนูญ',
  '2027-12-31': 'วันสิ้นปี',
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

/** Admin per-date overrides from the server (admin_settings.bookingWindow). */
export interface DateOverrides {
  /** Date → reason; always blocked. */
  closedDates: Record<string, string>;
  /** Opened despite being a weekend or holiday. */
  openDates: string[];
}

const NO_OVERRIDES: DateOverrides = { closedDates: {}, openDates: [] };

/** The booking day, which rolls at 07:00 Bangkok = UTC midnight, whatever the device zone. */
function bookingDay(now: Date, plusDays = 0): Date {
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + plusDays);
}

/** Last bookable date: BOOKING_MAX_DAYS_AHEAD weekdays after `day`, weekends not counted. */
function lastOpenDate(day: Date): string {
  const d = new Date(day);
  for (let n = 0; n < BOOKING_MAX_DAYS_AHEAD; ) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  return toLocalDateStr(d);
}

/** Weekend, holiday or admin-closed, unless an admin opened it. */
function isShut(date: string, overrides: DateOverrides): boolean {
  if (date in overrides.closedDates) return true;
  if (overrides.openDates.includes(date)) return false;
  const dow = parseLocalDate(date).getDay();
  return dow === 0 || dow === 6 || !!HOLIDAYS[date];
}

/**
 * The next bookable date to open and when (a 07:00 Bangkok roll). Mornings that
 * only open a holiday or closed date are skipped; null if nothing opens in a month.
 */
export function nextOpening(
  now: Date,
  overrides: DateOverrides = NO_OVERRIDES,
): { date: string; at: Date } | null {
  let prev = lastOpenDate(bookingDay(now));
  for (let k = 1; k <= 31; k++) {
    const day = bookingDay(now, k);
    const last = lastOpenDate(day);
    for (let d = addDays(parseLocalDate(prev), 1); toLocalDateStr(d) <= last; d = addDays(d, 1)) {
      const date = toLocalDateStr(d);
      if (!isShut(date, overrides)) {
        return { date, at: new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())) };
      }
    }
    if (last > prev) prev = last;
  }
  return null;
}

/** Build one month of cells mirroring renderCalendar() in booking.js. */
export function buildCalendarCells(
  year: number,
  month: number,
  selectedDate: string | null,
  bookings: Record<string, number>,
  perDay: number = QUOTA,
  overrides: DateOverrides = NO_OVERRIDES,
): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const todayStr = toLocalDateStr(today);
  const minAllowedStr = toLocalDateStr(addDays(today, 1)); // พรุ่งนี้
  const maxAllowedStr = lastOpenDate(bookingDay(today));

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ date: '', day: 0, kind: 'outside', quota: 0, blocked: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toLocalDateStr(new Date(year, month, d));
    const dow = new Date(year, month, d).getDay();
    const isPast = dateStr < todayStr;
    // An admin-opened date drops the weekend/holiday block; an admin-closed one
    // is treated like a holiday so it shows its reason on the calendar.
    const forcedOpen = overrides.openDates.includes(dateStr);
    const closedNote = overrides.closedDates[dateStr];
    const isWknd = !forcedOpen && (dow === 0 || dow === 6);
    const isHol =
      closedNote !== undefined
        ? closedNote || 'ปิดจอง'
        : forcedOpen
          ? undefined
          : HOLIDAYS[dateStr];
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
