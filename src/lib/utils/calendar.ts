import { t, tc } from '../i18n/i18n.svelte';
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

const HOLIDAY_LABEL_KEYS: Record<string, string> = {
  วันขึ้นปีใหม่: 'bookingHoliday1',
  มาฆบูชา: 'bookingHoliday2',
  จักรี: 'bookingHoliday3',
  สงกรานต์: 'bookingHoliday4',
  แรงงาน: 'bookingHoliday5',
  ฉัตรมงคล: 'bookingHoliday6',
  วิสาขบูชา: 'bookingHoliday7',
  วันพระราชินี: 'bookingHoliday8',
  'วันเฉลิม ร.10': 'bookingHoliday9',
  อาสาฬหบูชา: 'bookingHoliday10',
  หยุดชดเชย: 'bookingHoliday11',
  วันแม่: 'bookingHoliday12',
  'วันสวรรคต ร.9': 'bookingHoliday13',
  'หยุดพิเศษ กทม.': 'bookingHoliday14',
  จุฬาลงกรณ์: 'bookingHoliday15',
  วันพ่อ: 'bookingHoliday16',
  ชดเชยวันพ่อ: 'bookingHoliday17',
  รัฐธรรมนูญ: 'bookingHoliday18',
  วันสิ้นปี: 'bookingHoliday19',
  ชดเชยมาฆบูชา: 'bookingHoliday20',
  ชดเชยแรงงาน: 'bookingHoliday21',
  เข้าพรรษา: 'bookingHoliday22',
  ชดเชยจุฬาลงกรณ์: 'bookingHoliday23',
  ปิดจอง: 'bookingHoliday24',
  เต็ม: 'bookingHoliday25',
  เยี่ยมญาติใกล้ชิด: 'bookingHoliday26',
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
  /** Dates that open only from a set instant (ISO, UTC) — admin_settings.scheduledOpenings. */
  openAt?: Record<string, string>;
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

/** HH:MM in Bangkok time, whatever the device zone. */
export function bangkokTime(at: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
}

/** The next regular 07:00 Bangkok roll that opens a bookable date. */
function nextRoll(now: Date, overrides: DateOverrides): { dates: string[]; at: Date } | null {
  let prev = lastOpenDate(bookingDay(now));
  for (let k = 1; k <= 31; k++) {
    const day = bookingDay(now, k);
    const last = lastOpenDate(day);
    for (let d = addDays(parseLocalDate(prev), 1); toLocalDateStr(d) <= last; d = addDays(d, 1)) {
      const date = toLocalDateStr(d);
      // A date with its own opening time opens then, not at the roll.
      if (!isShut(date, overrides) && !overrides.openAt?.[date]) {
        return {
          dates: [date],
          at: new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())),
        };
      }
    }
    if (last > prev) prev = last;
  }
  return null;
}

/**
 * The next opening and the dates it opens: the 07:00 roll (mornings that only
 * open a holiday or closed date are skipped) or a scheduled opening such as a
 * Sunday at 12:00 — whichever comes first. Null if nothing opens in a month.
 */
export function nextOpening(
  now: Date,
  overrides: DateOverrides = NO_OVERRIDES,
): { dates: string[]; at: Date } | null {
  let best = nextRoll(now, overrides);
  for (const [date, iso] of Object.entries(overrides.openAt ?? {})) {
    const at = new Date(iso);
    if (!(at > now) || isShut(date, overrides)) continue;
    if (!best || at < best.at) best = { dates: [date], at };
    else if (at.getTime() === best.at.getTime()) best = { dates: [...best.dates, date].sort(), at };
  }
  return best;
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
    // A scheduled opening (e.g. 12:00) keeps the date shut until then, labelled with the time.
    const opensAt = overrides.openAt?.[dateStr];
    const opensLater =
      opensAt && today < new Date(opensAt)
        ? `เปิด ${bangkokTime(new Date(opensAt))} น.`
        : undefined;
    const isHol =
      closedNote !== undefined
        ? closedNote || 'ปิดจอง'
        : opensLater
          ? opensLater
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
      label:
        closedNote !== undefined
          ? closedNote || t('bookingCalendarClosed')
          : opensLater
            ? tc('bookingCalendarOpens', { time: bangkokTime(new Date(opensAt!)) })
            : isHol
              ? t(HOLIDAY_LABEL_KEYS[isHol] ?? isHol)
              : undefined,
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
