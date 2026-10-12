import { untrack } from 'svelte';
import { getCountsByDate } from '../api/endpoints';
import { buildCalendarCells, type CalendarCell } from '../utils/calendar';
import { PRICE_CHILD_5_8, PRICE_CHILD_UNDER_5, PRICE_PER_PERSON } from './booking.svelte';
import { ui } from './ui.svelte';

/** The prisoner-visit form offers 1 to 10 visitors; the plan never exceeds it. */
export const MAX_VISITORS = 10;

export interface FreeDay {
  date: string;
  left: number;
}

/**
 * The visit the home page is helping someone plan: the date they picked in the
 * date rail and the party they set on the ticket. It outlives the sections so a
 * choice made in one shows up in the other, and it is handed to the booking
 * form when the ticket is torn off.
 */
class VisitPlan {
  date = $state<string | null>(null);
  adults = $state(1);
  kids58 = $state(0);
  kidsUnder5 = $state(0);

  counts = $state<Record<string, number> | null>(null);
  countsState = $state<'idle' | 'loading' | 'ready' | 'error'>('idle');
  updatedAt = $state<number | null>(null);
  refreshing = $state(false);

  get visitors(): number {
    return this.adults + this.kids58 + this.kidsUnder5;
  }

  /** Same rule the booking form applies: every visitor plus the prisoner, children discounted. */
  get total(): number {
    return (
      (this.adults + 1) * PRICE_PER_PERSON +
      this.kids58 * PRICE_CHILD_5_8 +
      this.kidsUnder5 * PRICE_CHILD_UNDER_5
    );
  }

  get perDay(): number {
    return ui.publicSettings.publicBooking.perDay;
  }

  /**
   * Bookable days from the same cell builder the booking calendar uses, so the
   * page can never offer a day the calendar would refuse. The window is at most
   * BOOKING_MAX_DAYS_AHEAD days, so two months always cover it.
   */
  get openDays(): CalendarCell[] {
    if (!this.counts) return [];
    // Rebuild when counts/settings refresh, without replaying the date rail's
    // entrance animation on each clock tick.
    const now = new Date(untrack(() => ui.now));
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(now);
    const [year, monthNumber] = today.split('-').map(Number);
    const days: CalendarCell[] = [];
    for (const offset of [0, 1]) {
      const month = new Date(year, monthNumber - 1 + offset, 1);
      for (const cell of buildCalendarCells(
        month.getFullYear(),
        month.getMonth(),
        null,
        this.counts,
        this.perDay,
        ui.publicSettings.bookingWindow,
        now,
      )) {
        if (cell.date > today && (cell.kind === 'available' || cell.kind === 'full'))
          days.push(cell);
      }
    }
    return days;
  }

  get freeDays(): FreeDay[] {
    return this.openDays
      .filter((cell) => !cell.blocked)
      .map((cell) => ({
        date: cell.date,
        left: Math.max(this.perDay - cell.quota, 0),
      }));
  }

  /** `refresh` refetches in place (no skeleton, keeps old counts on failure), e.g. when a new date opens. */
  loadCounts(refresh = false): void {
    if (
      this.refreshing ||
      this.countsState === 'loading' ||
      (this.countsState === 'ready' && !refresh)
    )
      return;
    this.refreshing = true;
    if (!refresh) this.countsState = 'loading';
    getCountsByDate()
      .then((c) => {
        this.counts = c;
        this.countsState = 'ready';
        this.updatedAt = Date.now();
      })
      .catch(() => {
        this.countsState = 'error';
      })
      .finally(() => {
        this.refreshing = false;
      });
  }

  toggleDate(date: string): void {
    this.date = this.date === date ? null : date;
  }

  /** Clamp a party change to the form's limits: at least one adult, at most MAX_VISITORS. */
  adjust(field: 'adults' | 'kids58' | 'kidsUnder5', delta: number): void {
    const next = this[field] + delta;
    const min = field === 'adults' ? 1 : 0;
    if (next < min) return;
    if (delta > 0 && this.visitors >= MAX_VISITORS) return;
    this[field] = next;
  }
}

export const visitPlan = new VisitPlan();
