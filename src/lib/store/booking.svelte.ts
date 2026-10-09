import { t, tc } from '../i18n/i18n.svelte';
import {
  getPrisoners,
  getCountsByDate,
  getTableCountsByDate,
  lookupByRef,
  saveReservation,
  saveTableReservation,
} from '../api/endpoints';
import { ApiError } from '../api/errors';
import type { CostSummary, Prisoner } from '../api/types';
import {
  debounce,
  generateUniqueRef,
  maskPrisonerName,
  rebuildPrisonerObjects,
} from '../utils/helpers';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage';
import { toThaiLong } from '../utils/date';
import { validateIdFormat, validatePhone } from '../utils/validation';
import { buildCalendarCells, calendarTitle, QUOTA } from '../utils/calendar';
import { ui } from './ui.svelte';
import { TABLE_AGREEMENT_VERSION } from '../utils/tableAgreement';
import { navigate } from '../router.svelte';
import {
  loadTurnstileScript,
  renderTurnstile as renderTurnstileWidget,
  resetTurnstile as resetTurnstileWidget,
  getTurnstileResponse,
} from '../utils/turnstile';

export const TURNSTILE_SITEKEY =
  (import.meta.env.VITE_TURNSTILE_SITEKEY as string | undefined) || '0x4AAAAAAELr-p6jZh9efERD';

export const ACTIVE_STATUSES = [
  'รอตรวจสอบวินัย',
  'รอตรวจสอบผู้เข้าร่วม',
  'รอชำระเงิน',
  'ชำระแล้ว',
  'เสร็จสิ้น',
];

export const RESTRICTED_STATUS = 'ติดวินัย งดเยี่ยม';
export const CHILD_RELATIONS = ['บุตร / ธิดา', 'Child', '子女', 'Son/Daughter'];

export const RELIGION_OPTIONS = ['-- เลือก --', 'พุทธ', 'อิสลาม', 'คริสต์', 'อื่น ๆ'];

export const PRICE_PER_PERSON = 1000;
export const PRICE_CHILD_5_8 = 500;
export const PRICE_CHILD_UNDER_5 = 0;

const PRISONER_CACHE_KEY = 'cc_prisoner_cache';
const PRISONER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_PRISONER_SUGGESTIONS = 8;

export interface ExtraVisitor {
  name: string;
  id: string;
  relation: string;
  age: string;
  religion: string;
  allergy: string;
}

export interface ConfirmData {
  visitDate: string;
  visitDateISO: string;
  totalPersons: number;
  prisonerName: string;
  prisonerId: string;
  wing: string;
}

export interface SuccessData {
  ref: string;
  visitDate: string;
  visitorCount: number;
  totalPersons: number;
  prisonerName: string;
  prisonerId: string;
  wing: string;
  visitorName: string;
  extras: ExtraVisitor[];
}

/** Replicates calculateTotal() in booking.js (main visitor may be a child too). */
export function calcCost(
  count: number,
  extras: ExtraVisitor[],
  mainRelation = '',
  mainAge = '',
  /** False for a no-prisoner table booking — mirrors applyServerPricing's
   *  includePrisonerFee on the backend so the quote matches the charge. */
  includePrisonerFee = true,
  /** Table bookings have no prisoner, so no relationship (and no child
   *  discount) applies — everyone pays the standard adult price. */
  allowChildDiscount = true,
): CostSummary {
  let extraFees = 0;
  const discountNotes: string[] = [];
  let adults = 0;
  let kids5_8 = 0;
  let kidsUnder5 = 0;
  const kids5_8Names: string[] = [];
  const kidsUnder5Names: string[] = [];

  // Main visitor (person #1) — child discount applies when relation is child.
  let mainFee = PRICE_PER_PERSON;
  if (allowChildDiscount && CHILD_RELATIONS.includes(mainRelation)) {
    const a = parseInt(mainAge, 10);
    if (!isNaN(a)) {
      if (a < 5) {
        mainFee = PRICE_CHILD_UNDER_5;
        kidsUnder5++;
        kidsUnder5Names.push(t('bookingMainVisitor'));
      } else if (a <= 8) {
        mainFee = PRICE_CHILD_5_8;
        kids5_8++;
        kids5_8Names.push(t('bookingMainVisitor'));
      }
    }
  }
  if (mainFee === PRICE_PER_PERSON) adults = 1;
  if (allowChildDiscount && CHILD_RELATIONS.includes(mainRelation) && mainFee < PRICE_PER_PERSON) {
    discountNotes.push(
      tc('bookingMainDiscount', {
        fee: mainFee === 0 ? t('textbookingMessage1') : tc('bookingFee', { fee: mainFee }),
      }),
    );
  }

  extras.forEach((v, idx) => {
    let fee = PRICE_PER_PERSON;
    let isChild = false;
    if (allowChildDiscount && CHILD_RELATIONS.includes(v.relation)) {
      const a = parseInt(v.age, 10);
      if (!isNaN(a)) {
        if (a < 5) {
          fee = PRICE_CHILD_UNDER_5;
          isChild = true;
          kidsUnder5++;
          kidsUnder5Names.push(v.name);
        } else if (a <= 8) {
          fee = PRICE_CHILD_5_8;
          isChild = true;
          kids5_8++;
          kids5_8Names.push(v.name);
        }
      }
    }
    extraFees += fee;
    if (!isChild) adults++;
    if (allowChildDiscount && CHILD_RELATIONS.includes(v.relation) && fee < PRICE_PER_PERSON) {
      discountNotes.push(
        tc('bookingExtraDiscount', {
          n: idx + 2,
          fee: fee === 0 ? t('textbookingMessage2') : tc('bookingFee', { fee }),
        }),
      );
    }
  });

  // ผู้จอง + ผู้ต้องขัง (เฉพาะการจองเยี่ยม) + เพิ่มเติม
  const total = mainFee + (includePrisonerFee ? PRICE_PER_PERSON : 0) + extraFees;
  return {
    total,
    extraFees,
    discountNotes,
    numVisitors: count,
    numExtras: extras.length,
    adults,
    kids5_8,
    kidsUnder5,
    kids5_8Names,
    kidsUnder5Names,
  };
}

/**
 * 'prisoner' — the original visit flow: pick a prisoner, then participant and
 *              discipline checks before payment.
 * 'table'    — the parallel no-prisoner seating flow: book straight into payment,
 *              capped at a small number of tables per day.
 */
export type BookingMode = 'prisoner' | 'table';

class BookingStoreImpl {
  readonly mode: BookingMode;

  constructor(mode: BookingMode = 'prisoner') {
    this.mode = mode;
  }

  get isTable(): boolean {
    return this.mode === 'table';
  }

  step = $state(1); // 1=form, 2=confirm, 3=success

  // ——— Visitor form ———
  visitorName = $state('');
  visitorId = $state('');
  visitorPhone = $state('');
  relation = $state('');
  religion = $state('');
  allergy = $state('');
  visitorAge = $state('');
  visitorCount = $state(1);
  consent = $state(false);
  tableAgreementAccepted = $state(false);
  extras = $state<ExtraVisitor[]>([]);

  // ——— Prisoner ———
  prisoner = $state<Prisoner | null>(null);
  search = $state('');
  suggestions = $state<Prisoner[]>([]);
  showSuggestions = $state(false);
  prisonerMaster = $state<Prisoner[]>([]);
  prisonerLoadState = $state<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  prisonerLoadMsg = $state('');

  // ——— Calendar ———
  calYear = $state(new Date().getFullYear());
  calMonth = $state(new Date().getMonth());
  selectedDate = $state<string | null>(null);
  bookings = $state<Record<string, number>>({});
  /** Tables sellable per day. Overwritten from the server in table mode. */
  perDay = $state(QUOTA);
  /** Minutes an unpaid table booking holds its slot (table mode only). */
  holdMinutes = $state(60);
  countsState = $state<'loading' | 'ready' | 'error'>('loading');
  countsMsg = $state('');

  // ——— Errors ———
  errors = $state<Record<string, string>>({});
  inlineError = $state('');

  // ——— Confirm / submit ———
  submitting = $state(false);
  confirmData = $state<ConfirmData | null>(null);
  turnstileToken = $state('');
  turnstileWidgetId = $state('');
  turnstileError = $state('');
  success = $state<SuccessData | null>(null);
  copied = $state(false);

  // ——— Derived ———
  get cells() {
    return buildCalendarCells(
      this.calYear,
      this.calMonth,
      this.selectedDate,
      this.bookings,
      this.perDay,
      ui.publicSettings.bookingWindow,
    );
  }
  get calTitle(): string {
    return calendarTitle(this.calYear, this.calMonth);
  }
  get cost(): CostSummary {
    return calcCost(
      this.visitorCount,
      this.extras,
      this.relation,
      this.visitorAge,
      !this.isTable,
      !this.isTable,
    );
  }

  /** Seats on the booking: a table booking has no prisoner occupying one. */
  get totalPersons(): number {
    return this.isTable ? this.visitorCount : this.visitorCount + 1;
  }

  private debouncedFilter = debounce(() => this.filterSuggestions(), 250);

  // ——— Init (called on mount) ———
  init(): void {
    // No prisoner on a table booking, so the (large) prisoner master is not fetched.
    const tasks = this.isTable
      ? [this.loadBookingCounts()]
      : [this.loadBookingCounts(), this.loadPrisonerMaster()];
    void Promise.allSettled(tasks);
  }

  // ===== CALENDAR =====
  changeMonth(d: number): void {
    this.calMonth += d;
    if (this.calMonth > 11) {
      this.calMonth = 0;
      this.calYear++;
    }
    if (this.calMonth < 0) {
      this.calMonth = 11;
      this.calYear--;
    }
  }

  selectDate(dateStr: string, blocked: boolean): void {
    if (blocked) return;
    this.selectedDate = dateStr;
    this.errors = { ...this.errors };
  }

  async loadBookingCounts(): Promise<void> {
    this.countsState = 'loading';
    this.countsMsg = t('textbookingMessage3');
    try {
      // The two pools are independent: table availability must not be affected by
      // prisoner-visit volume, so each mode reads its own counts endpoint.
      let counts: Record<string, number>;
      if (this.isTable) {
        const res = await getTableCountsByDate();
        counts = res.counts;
        this.perDay = res.perDay;
        this.holdMinutes = res.holdMinutes;
      } else {
        counts = await getCountsByDate();
      }
      this.bookings = {};
      for (const [dk, v] of Object.entries(counts)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dk)) this.bookings[dk] = Number(v) || 0;
      }
      this.countsState = 'ready';
      this.countsMsg = '';
    } catch (err) {
      console.error('[Booking] loadBookingCounts failed:', err);
      this.countsState = 'error';
      this.countsMsg = t('textbookingMessage4');
    }
  }

  // ===== EXTRA VISITORS =====
  updateVisitorCount(n: number): void {
    this.visitorCount = n;
    const target = Math.max(0, n - 1);
    const extras = this.extras.slice(0, target);
    while (extras.length < target) {
      extras.push({ name: '', id: '', relation: '', age: '', religion: '', allergy: '' });
    }
    this.extras = extras;
  }

  // ===== PRISONER =====
  private loadPrisonerFromCache(): Prisoner[] | null {
    const raw = safeGetItem(localStorage, PRISONER_CACHE_KEY);
    if (!raw) return null;
    try {
      const cached = JSON.parse(raw) as { data: string[][] | Prisoner[]; timestamp: number };
      if (Date.now() - cached.timestamp > PRISONER_CACHE_TTL) {
        safeRemoveItem(localStorage, PRISONER_CACHE_KEY);
        return null;
      }
      return rebuildPrisonerObjects(cached.data);
    } catch {
      return null;
    }
  }

  private savePrisonerToCache(data: Prisoner[]): void {
    safeSetItem(localStorage, PRISONER_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  }

  async loadPrisonerMaster(): Promise<void> {
    const cached = this.loadPrisonerFromCache();
    if (cached) {
      this.prisonerMaster = cached;
      this.prisonerLoadState = 'loaded';
      this.prisonerLoadMsg = tc('textbookingMessage5', { p1: cached.length });
    } else {
      this.prisonerLoadState = 'loading';
      this.prisonerLoadMsg = t('textbookingMessage6');
    }

    try {
      const prisoners = await getPrisoners();
      this.prisonerMaster = prisoners;
      this.savePrisonerToCache(prisoners);
      this.prisonerLoadState = 'loaded';
      this.prisonerLoadMsg = tc('textbookingMessage7', { p1: prisoners.length });
    } catch (err) {
      if (cached) {
        console.warn('[Booking] background refresh failed, using cached data:', err);
        return;
      }
      console.error('[Booking] prisoner master fetch failed:', err);
      this.prisonerLoadState = 'error';
      let detail = err instanceof ApiError ? err.message : '';
      if (/failed to fetch|network|load failed|abort/i.test(String(err)))
        detail = t('textbookingMessage8');
      this.prisonerLoadMsg = tc('textbookingMessage9', { p1: detail ? ` (${detail})` : '' });
    }
  }

  filterSuggestions(): void {
    const q = this.search.trim().toLowerCase();
    if (!q || this.prisonerMaster.length === 0) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    const matches: Prisoner[] = [];
    for (
      let i = 0;
      i < this.prisonerMaster.length && matches.length < MAX_PRISONER_SUGGESTIONS;
      i++
    ) {
      const p = this.prisonerMaster[i];
      if (
        p.prisonerId.toLowerCase().indexOf(q) !== -1 ||
        p.prisonerName.toLowerCase().indexOf(q) !== -1
      ) {
        matches.push(p);
      }
    }
    this.suggestions = matches;
    this.showSuggestions = matches.length > 0;
  }

  onSearchInput(): void {
    this.debouncedFilter();
  }

  hideSuggestions(): void {
    this.showSuggestions = false;
  }

  selectPrisoner(p: Prisoner): void {
    const isRestricted = String(p.status || '').trim() === RESTRICTED_STATUS;
    if (isRestricted && !this.disciplineExpired(p.vinaiDate)) {
      this.errors = {
        ...this.errors,
        prisonerSearch: t('textbookingMessage10'),
      };
      return;
    }
    this.prisoner = p;
    this.search = '';
    this.suggestions = [];
    this.showSuggestions = false;
    const errs = { ...this.errors };
    delete errs.prisonerSearch;
    this.errors = errs;
  }

  clearPrisoner(): void {
    this.prisoner = null;
  }

  private disciplineExpired(vinaiDateStr: string): boolean {
    const s = String(vinaiDateStr || '').trim();
    if (!s) return false; // no date → block by default
    const vinaiDate = s.indexOf('T') >= 0 ? new Date(s) : new Date(s + 'T00:00:00');
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    return vinaiDate.getTime() <= oneYearAgo;
  }

  prisonerIsRestricted(): boolean {
    if (!this.prisoner) return false;
    return (
      String(this.prisoner.status || '').trim() === RESTRICTED_STATUS &&
      !this.disciplineExpired(this.prisoner.vinaiDate)
    );
  }

  maskName(name: string | null | undefined): string {
    return maskPrisonerName(name);
  }

  // ===== VALIDATION =====
  clearErrors(): void {
    this.errors = {};
    this.inlineError = '';
  }

  validate(): boolean {
    this.clearErrors();
    const errs: Record<string, string> = {};

    // Prisoner selection first — a table booking has none to select.
    if (!this.isTable && !this.prisoner) {
      errs.prisonerSearch = t('textbookingMessage11');
      this.errors = errs;
      return false;
    }

    if (!this.visitorName.trim()) errs.visitorName = t('textbookingMessage12');
    if (!this.visitorId.trim()) errs.visitorId = t('textbookingMessage13');
    else {
      const idResult = validateIdFormat(this.visitorId.trim());
      if (!idResult.valid && idResult.error) errs.visitorId = idResult.error;
    }

    if (!this.visitorPhone.trim()) errs.visitorPhone = t('textbookingMessage14');
    else {
      const phoneResult = validatePhone(this.visitorPhone.trim());
      if (!phoneResult.valid && phoneResult.error) errs.visitorPhone = phoneResult.error;
    }

    if (!this.isTable && !this.relation) errs.relation = t('textbookingMessage15');
    if (!this.religion.trim()) errs.religion = t('textbookingMessage16');
    if (!this.allergy.trim()) errs.allergy = t('textbookingMessage17');

    // Main visitor child discount requires age — but only in the prisoner-visit
    // flow; table bookings have no relationship so no child discount applies.
    if (!this.isTable && CHILD_RELATIONS.includes(this.relation)) {
      const mainAgeNum = parseInt(this.visitorAge, 10);
      if (isNaN(mainAgeNum) || mainAgeNum < 0) {
        errs.visitorAge = t('textbookingMessage18');
      }
    }

    // Extra visitors
    this.extras.forEach((v, i) => {
      const n = i + 2;
      if (!v.name.trim()) errs[`extraName${n}`] = tc('textbookingMessage19', { p1: n });
      if (!v.id.trim()) errs[`extraId${n}`] = tc('textbookingMessage20', { p1: n });
      else {
        const r = validateIdFormat(v.id.trim());
        if (!r.valid && r.error)
          errs[`extraId${n}`] = tc('textbookingMessage21', { p1: n, p2: r.error });
      }
      if (!v.religion.trim()) errs[`extraReligion${n}`] = tc('textbookingMessage22', { p1: n });
      if (!v.allergy.trim()) errs[`extraAllergy${n}`] = tc('textbookingMessage23', { p1: n });
      if (!this.isTable && !v.relation)
        errs[`extraRelation${n}`] = tc('textbookingMessage24', { p1: n });
      if (!this.isTable && CHILD_RELATIONS.includes(v.relation)) {
        const a = parseInt(v.age, 10);
        if (isNaN(a) || a < 0) errs[`extraAge${n}`] = tc('textbookingMessage25', { p1: n });
      }
    });

    // Date selection
    if (!this.selectedDate) {
      this.inlineError = t('textbookingMessage26');
      this.errors = errs;
      return false;
    }
    // The admin may close the date after it was picked; the server refuses it anyway.
    if (ui.publicSettings.bookingWindow.closedDates[this.selectedDate] !== undefined) {
      this.inlineError = t('textbookingMessage27');
      this.errors = errs;
      return false;
    }
    if ((this.bookings[this.selectedDate] || 0) >= this.perDay) {
      this.inlineError = t('textbookingMessage28');
      this.errors = errs;
      return false;
    }

    // Soft validation against master (prisoner mode only)
    if (!this.isTable && this.prisonerMaster.length > 0 && this.prisoner) {
      const exists = this.prisonerMaster.some(
        (p) =>
          p.prisonerId === this.prisoner!.prisonerId ||
          (p.prisonerName.toLowerCase() === this.prisoner!.prisonerName.toLowerCase() &&
            p.wing === this.prisoner!.wing),
      );
      if (!exists) {
        errs.prisonerSearch = t('textbookingMessage29');
      }
    }

    if (!this.consent) this.inlineError = t('textbookingMessage30');

    this.errors = errs;
    return Object.keys(errs).length === 0 && this.inlineError === '';
  }

  // ===== PRISONER-NAME REJECTION (table mode) =====
  /**
   * Ensure a table booking has no participant whose name matches a prisoner
   * in the system. If the user typed a Thai honorific (นาย/นาง/น.ส./…) it is
   * stripped for matching so the search still finds the prisoner, but the name
   * is returned exactly as entered (title included) for display. Returns the
   * offending name, or null when clear. Incidentally loads the prisoner master
   * for table mode on first use.
   */
  async findPrisonerNameMatch(names: string[]): Promise<string | null> {
    if (!this.isTable) return null;
    if (this.prisonerMaster.length === 0) {
      try {
        const prisoners = await getPrisoners();
        this.prisonerMaster = prisoners;
        this.savePrisonerToCache(prisoners);
      } catch {
        // If we cannot reach the prisoner list, fail open (do not block booking).
        return null;
      }
    }
    // Normalize by removing Thai honorifics (นาย, นาง, น.ส., ด.ช., …) and any
    // whitespace so typed names match the prisoner master regardless of title.
    const norm = (s: string): string =>
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/^(นางสาว|นาง|นาย|น\.ส\.|ด\.ช\.|ด\.ญ\.|คุณ)\s*/, '')
        .replace(/\s+/g, '');
    const normalized = names
      .map((name) => ({ original: name, key: norm(name) }))
      .filter((x) => x.key.length > 0);
    if (normalized.length === 0) return null;
    for (const p of this.prisonerMaster) {
      const pName = norm(p.prisonerName);
      if (!pName) continue;
      const hit = normalized.find((x) => x.key === pName);
      if (hit) {
        // Return the name exactly as the user entered it (with its title still shown).
        return hit.original || p.prisonerName;
      }
    }
    return null;
  }

  // ===== CONFIRM =====
  goToConfirm(): boolean {
    if (!this.validate()) return false;
    if (!this.selectedDate) return false;
    if (!this.isTable && !this.prisoner) return false;
    this.confirmData = {
      visitDate: toThaiLong(parseLocalDateFromStr(this.selectedDate)),
      visitDateISO: this.selectedDate,
      totalPersons: this.totalPersons,
      prisonerName: this.prisoner?.prisonerName ?? '',
      prisonerId: this.prisoner?.prisonerId ?? '',
      wing: this.prisoner?.wing ?? '',
    };
    this.inlineError = '';
    this.step = 2;
    window.scrollTo(0, 0);
    return true;
  }

  goBack(): void {
    this.tableAgreementAccepted = false;
    this.resetTurnstile();
    this.turnstileWidgetId = '';
    this.turnstileError = '';
    this.inlineError = '';
    this.step = 1;
    window.scrollTo(0, 0);
  }

  // ===== TURNSTILE =====
  async setupTurnstile(el: HTMLElement): Promise<void> {
    if (this.turnstileWidgetId || !el) return;
    this.turnstileError = '';
    try {
      await loadTurnstileScript();
    } catch {
      this.turnstileError = 'script_load_failed';
      return;
    }
    // Poll briefly for the API object (script loads async).
    let attempts = 0;
    while (typeof window.turnstile !== 'object') {
      if (attempts++ > 10) {
        this.turnstileError = 'script_not_ready';
        return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    try {
      this.turnstileWidgetId = renderTurnstileWidget(
        el,
        TURNSTILE_SITEKEY,
        (token: string) => {
          this.turnstileToken = token;
          this.turnstileError = '';
        },
        (error: string) => {
          this.turnstileError = error;
          this.turnstileToken = '';
        },
      );
    } catch (e) {
      this.turnstileError = e instanceof Error ? e.message : 'render_failed';
    }
  }

  resetTurnstile(): void {
    resetTurnstileWidget(this.turnstileWidgetId);
    this.turnstileToken = '';
    this.turnstileError = '';
  }

  // ===== SUBMIT =====
  async submit(): Promise<void> {
    if (this.submitting) return;
    if (!this.confirmData || !this.selectedDate) return;
    if (!this.isTable && !this.prisoner) return;

    if (this.isTable) {
      if (!ui.tableBookingOpen) {
        this.inlineError = t('tblClosedText');
        return;
      }
      if (!this.tableAgreementAccepted) {
        this.inlineError = t('tblAgreementRequired');
        return;
      }
    }

    const token = getTurnstileResponse(this.turnstileWidgetId);
    if (typeof window.turnstile !== 'object') {
      this.inlineError = t('textbookingMessage31');
      return;
    }
    if (this.turnstileError) {
      this.inlineError = t('textbookingMessage32');
      return;
    }
    if (!token) {
      this.inlineError = t('textbookingMessage33');
      return;
    }
    this.turnstileToken = token;
    this.submitting = true;
    this.inlineError = '';

    // ── Duplicate check for the same prisoner on the same day ──
    // Table bookings have no prisoner, so there is nothing to duplicate: the same
    // person may legitimately book several tables on the same day.
    let existingRefs: string[] = [];
    if (!this.isTable && this.prisoner) {
      try {
        const rows = await lookupByRef({ prisonerId: this.prisoner.prisonerId });
        existingRefs = rows.map((r) => r.ref).filter(Boolean);
        const duplicate = rows.find(
          (r) =>
            r.visitDateISO === this.selectedDate &&
            ACTIVE_STATUSES.includes(String(r.status || '')),
        );
        if (duplicate) {
          this.submitting = false;
          this.resetTurnstile();
          this.inlineError = tc('textbookingMessage34', {
            p1: this.prisoner.prisonerId,
            p2: duplicate.ref,
          });
          return;
        }
      } catch (err) {
        console.warn('Duplicate check skipped:', err);
      }
    }

    // Table bookings let the server mint the ref (it uses a TBL- prefix).
    const ref = this.isTable ? '' : generateUniqueRef(existingRefs);
    const cost = this.cost;
    const extras = this.extras;
    const extraNamesStr = extras.map((v) => [v.name, v.id, v.relation, v.age].join('|')).join(';;');
    const extraReligionsStr = extras.map((v) => v.religion || '').join(';;');
    const extraAllergiesStr = extras.map((v) => v.allergy || '').join(';;');
    const now = new Date().toLocaleString('th-TH');

    const payload = {
      // '' in table mode — the server mints the TBL- ref itself.
      ref,
      timestamp: now,
      visitorName: this.visitorName.trim(),
      extraVisitorNames: extraNamesStr,
      visitorId: this.visitorId.trim(),
      visitorPhone: validatePhone(this.visitorPhone.trim()).cleaned,
      relation: this.relation,
      religion: this.religion.trim(),
      allergy: this.allergy.trim(),
      visitorAge: this.visitorAge.trim(),
      extraVisitorReligions: extraReligionsStr,
      extraVisitorAllergies: extraAllergiesStr,
      // Empty in table mode. The server's table whitelist drops these outright,
      // so they can never end up on a no-prisoner booking.
      prisonerName: this.prisoner?.prisonerName ?? '',
      prisonerId: this.prisoner?.prisonerId ?? '',
      wing: this.prisoner?.wing ?? '',
      visitDate: this.confirmData.visitDate,
      visitDateISO: this.confirmData.visitDateISO,
      visitorCount: this.visitorCount,
      totalPersons: this.confirmData.totalPersons,
      total: cost.total,
      adultCount: cost.adults,
      child5to8Count: cost.kids5_8,
      childUnder5Count: cost.kidsUnder5,
      // The server clamps this anyway; sending the right one keeps the payload honest.
      status: this.isTable ? 'รอชำระเงิน' : 'รอตรวจสอบผู้เข้าร่วม',
      slipImage: '',
      turnstileToken: token,
      ip: '',
    };

    let savedRef = ref;
    let submitError = '';
    try {
      const resp = this.isTable
        ? await saveTableReservation({
            ...payload,
            tableAgreementAccepted: this.tableAgreementAccepted,
            tableAgreementVersion: TABLE_AGREEMENT_VERSION,
          })
        : await saveReservation(payload);
      savedRef = String(resp.ref || '').trim() || ref;
    } catch (err) {
      submitError =
        err instanceof ApiError ? err.message : String(err instanceof Error ? err.message : err);
    } finally {
      this.submitting = false;
    }

    if (submitError) {
      this.resetTurnstile();
      const isServerRejection =
        submitError.indexOf('⚠️') === 0 ||
        submitError.indexOf('ไม่สามารถจองได้') === 0 ||
        submitError.indexOf('Cannot change') === 0;
      this.inlineError = isServerRejection ? submitError : t('textbookingMessage35');
      return;
    }

    // Optimistic local quota update
    this.bookings[this.selectedDate] = (this.bookings[this.selectedDate] || 0) + 1;

    this.success = {
      ref: savedRef,
      visitDate: this.confirmData.visitDate,
      visitorCount: this.visitorCount,
      totalPersons: this.confirmData.totalPersons,
      prisonerName: this.prisoner?.prisonerName ?? '',
      prisonerId: this.prisoner?.prisonerId ?? '',
      wing: this.prisoner?.wing ?? '',
      visitorName: this.visitorName.trim(),
      extras,
    };

    safeSetItem(sessionStorage, 'lastRef', savedRef);
    if (this.prisoner) safeSetItem(sessionStorage, 'lastPrisonerId', this.prisoner.prisonerId);

    this.step = 3;
    if (this.isTable) {
      navigate(`status?ref=${encodeURIComponent(savedRef)}&pay=1`);
      return;
    }
    window.scrollTo(0, 0);
  }

  async copyRef(): Promise<void> {
    if (!this.success) return;
    try {
      await navigator.clipboard.writeText(this.success.ref);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    } catch {
      /* ignore */
    }
  }

  // ===== RESET =====
  resetAll(): void {
    this.step = 1;
    this.visitorName = '';
    this.visitorId = '';
    this.visitorPhone = '';
    this.relation = '';
    this.religion = '';
    this.allergy = '';
    this.visitorAge = '';
    this.visitorCount = 1;
    this.consent = false;
    this.tableAgreementAccepted = false;
    this.extras = [];
    this.prisoner = null;
    this.search = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.selectedDate = null;
    this.errors = {};
    this.inlineError = '';
    this.confirmData = null;
    this.success = null;
    this.copied = false;
    this.turnstileError = '';
    this.resetTurnstile();
    window.scrollTo(0, 0);
    void this.loadBookingCounts();
  }
}

function parseLocalDateFromStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** The original prisoner-visit booking flow. */
export const booking = new BookingStoreImpl('prisoner');
/** The parallel no-prisoner table booking flow (book → pay → staff confirm). */
export const tableBooking = new BookingStoreImpl('table');

/** Prop type for the shared booking components, which work against either store. */
export type BookingStore = typeof booking;
