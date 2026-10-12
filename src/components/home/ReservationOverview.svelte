<script lang="ts">
  import { onMount } from 'svelte';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import Clock from '@lucide/svelte/icons/clock';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Download from '@lucide/svelte/icons/download';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { getTableCountsByDate } from '../../lib/api/endpoints';
  import { ui } from '../../lib/store/ui.svelte';
  import { visitPlan } from '../../lib/store/visitPlan.svelte';
  import { navigate } from '../../lib/router.svelte';
  import {
    buildCalendarCells,
    nextOpening,
    BOOKING_MAX_DAYS_AHEAD,
  } from '../../lib/utils/calendar';
  import { formatDateIn } from '../../lib/utils/date';
  import PushOptIn from '../ui/PushOptIn.svelte';

  let mode = $state<'visit' | 'table'>('visit');
  let tableCounts = $state<Record<string, number>>({});
  let tableState = $state<'loading' | 'ready' | 'error'>('loading');
  let tableRefreshing = $state(false);
  let tableUpdated = $state<number | null>(null);
  let trackedOpening: number | null = null;
  const windowConfig = $derived(ui.publicSettings.bookingWindow);
  const tableConfig = $derived(ui.publicSettings.tableBooking);
  const perDay = $derived(mode === 'visit' ? visitPlan.perDay : tableConfig.perDay);
  const countsState = $derived(mode === 'visit' ? visitPlan.countsState : tableState);
  const counts = $derived(mode === 'visit' ? (visitPlan.counts ?? {}) : tableCounts);
  const updated = $derived(mode === 'visit' ? visitPlan.updatedAt : tableUpdated);
  const refreshing = $derived(visitPlan.refreshing || tableRefreshing);
  const loading = $derived(
    !ui.publicSettingsLoaded || countsState === 'idle' || countsState === 'loading',
  );
  const failed = $derived(ui.publicSettingsError || countsState === 'error');
  const closed = $derived(
    !windowConfig.open || (mode === 'table' && (!tableConfig.enabled || tableConfig.maintenance)),
  );
  const scheduled = $derived(mode === 'table' && ui.tableBookingScheduled);
  const opening = $derived(nextOpening(new Date(ui.now), windowConfig));
  const nextAt = $derived(
    closed ? null : scheduled ? new Date(tableConfig.opensAt) : (opening?.at ?? null),
  );
  // Reuse the existing browser clock; ticking never fetches availability or settings.
  const remaining = $derived(
    nextAt ? Math.max(0, Math.ceil((nextAt.getTime() - ui.now) / 1000)) : 0,
  );
  const countdown = $derived([
    { value: Math.floor(remaining / 86400), unit: 'homeUnitDays' },
    { value: Math.floor((remaining % 86400) / 3600), unit: 'homeUnitHours' },
    { value: Math.floor((remaining % 3600) / 60), unit: 'homeUnitMinutes' },
    { value: remaining % 60, unit: 'homeUnitSeconds' },
  ]);

  // Read the same cells as the booking form. Full dates stay visible so a
  // customer can distinguish a sold-out day from a day that has not opened.
  const days = $derived.by(() => {
    if (mode === 'visit') return visitPlan.openDays;
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(
      new Date(ui.now),
    );
    const [year, month] = today.split('-').map(Number);
    return [0, 1]
      .flatMap((offset) => {
        const d = new Date(year, month - 1 + offset, 1);
        return buildCalendarCells(
          d.getFullYear(),
          d.getMonth(),
          null,
          counts,
          perDay,
          windowConfig,
          new Date(ui.now),
        );
      })
      .filter((cell) => cell.date > today && (cell.kind === 'available' || cell.kind === 'full'));
  });
  const freeDays = $derived(days.filter((day) => !day.blocked));
  const statusKey = $derived(
    loading
      ? 'availabilityLoading'
      : failed
        ? 'availabilityError'
        : closed
          ? 'availabilityClosed'
          : scheduled
            ? 'availabilityNotOpen'
            : freeDays.length
              ? 'availabilityOpen'
              : days.length
                ? 'availabilityFull'
                : 'availabilityNoDates',
  );
  const tone = $derived(
    loading || failed
      ? 'neutral'
      : closed || (!scheduled && days.length > 0 && !freeDays.length)
        ? 'red'
        : scheduled || !freeDays.length
          ? 'amber'
          : 'green',
  );
  const canBook = $derived(!loading && !failed && !closed && !scheduled && freeDays.length > 0);
  const firstFree = $derived(freeDays[0]);
  const route = $derived(mode === 'visit' ? 'booking' : 'table-booking');
  const rules = $derived([
    tc('availabilityWindowRule', { n: BOOKING_MAX_DAYS_AHEAD }),
    t('availabilityOpeningRule'),
    tc('availabilityCapacityRule', {
      n: perDay,
      unit: t(mode === 'visit' ? 'availabilityVisitUnit' : 'availabilityTableUnit'),
    }),
    mode === 'visit'
      ? t('availabilityVisitRule')
      : tc('availabilityTableRule', {
          min: tableConfig.holdMinutes,
          seats: tableConfig.seatsPerTable,
        }),
    t('availabilityVisitDayRule'),
  ]);

  function dateLabel(date: string): string {
    return formatDateIn(date, i18n.lang, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function instantLabel(at: Date): string {
    return new Intl.DateTimeFormat(
      { th: 'th-TH', en: 'en-GB', zh: 'zh-CN', vi: 'vi-VN' }[i18n.lang],
      {
        timeZone: 'Asia/Bangkok',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      },
    ).format(at);
  }
  async function loadTables(): Promise<void> {
    if (tableRefreshing) return;
    tableRefreshing = true;
    try {
      const result = await getTableCountsByDate();
      tableCounts = result.counts;
      tableState = 'ready';
      tableUpdated = Date.now();
    } catch {
      tableState = 'error';
    } finally {
      tableRefreshing = false;
    }
  }
  function refresh(): void {
    visitPlan.loadCounts(true);
    void loadTables();
  }
  function retry(): void {
    void ui.loadPublicSettings();
    refresh();
  }
  function book(date?: string): void {
    if (mode === 'visit' && date) visitPlan.date = date;
    navigate(route);
  }
  onMount(() => {
    visitPlan.loadCounts();
    void loadTables();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') retry();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });
  // Refresh immediately when a displayed opening is reached, including the TBL gate.
  $effect(() => {
    const now = ui.now;
    const target = nextAt?.getTime() ?? null;
    if (trackedOpening !== null && now >= trackedOpening) refresh();
    trackedOpening = target;
  });
</script>

<section id="reservation-overview" aria-labelledby="availability-title" class="overview">
  <div class="overview-inner">
    <div class="overview-heading">
      <div>
        <p class="ct-label">{t('availabilityEyebrow')}</p>
        <h2 id="availability-title">{t('availabilityTitle')}</h2>
        <p class="intro">{t('availabilityIntro')}</p>
      </div>
      <button class="refresh" type="button" onclick={retry} disabled={refreshing}>
        <RefreshCw size={16} aria-hidden="true" />
        {t('availabilityRefresh')}
      </button>
    </div>

    <div class="mode-switch" role="group" aria-label={t('availabilityChooseType')}>
      <button type="button" aria-pressed={mode === 'visit'} onclick={() => (mode = 'visit')}
        >{t('availabilityVisit')}</button
      >
      <button type="button" aria-pressed={mode === 'table'} onclick={() => (mode = 'table')}
        >{t('availabilityTable')}</button
      >
    </div>

    <div class="summary-grid">
      <div class="current-card" data-tone={tone}>
        <p class="card-label">{t('availabilityCurrent')}</p>
        <p class="status" role="status">
          <span class="status-dot" aria-hidden="true"></span>{t(statusKey)}
        </p>
        {#if loading}
          <p>{t('availabilityLoadingDetail')}</p>
        {:else if failed}
          <p>{t('availabilityErrorDetail')}</p>
        {:else if closed}
          <p>{windowConfig.closedMessage || t('availabilityClosedDetail')}</p>
        {:else if scheduled}
          <p>{t('availabilityScheduledDetail')}</p>
        {:else if firstFree}
          <p>
            {tc('availabilityFirstFree', {
              date: dateLabel(firstFree.date),
              n: Math.max(0, perDay - firstFree.quota),
              unit: t(mode === 'visit' ? 'availabilityVisitUnit' : 'availabilityTableUnit'),
            })}
          </p>
        {:else}
          <p>{t('availabilityFullDetail')}</p>
        {/if}
        <button
          class="book-link"
          type="button"
          disabled={!canBook}
          onclick={() => book(firstFree?.date)}
        >
          {t('availabilityBook')}
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div class="next-card">
        <p class="card-label"><Clock size={17} aria-hidden="true" />{t('availabilityNext')}</p>
        {#if loading || ui.publicSettingsError}
          <p class="next-time">{t('availabilityLoading')}</p>
        {:else if nextAt}
          <p class="next-time">
            <time datetime={nextAt.toISOString()}>{instantLabel(nextAt)}</time>
          </p>
          <p class="timezone">{t('availabilityTimezone')}</p>
          <div
            class="countdown"
            role="timer"
            aria-label={t('availabilityNext')}
            aria-live="off"
          >
            {#each countdown as part (part.unit)}
              <div class="countdown-part">
                <strong>{String(part.value).padStart(2, '0')}</strong>
                <span>{t(part.unit)}</span>
              </div>
            {/each}
          </div>
          {#if !scheduled && opening}
            <p class="opening-dates">
              {tc('availabilityOpeningDates', { dates: opening.dates.map(dateLabel).join(' · ') })}
            </p>
          {:else}
            <p class="opening-dates">{t('availabilityScheduledDetail')}</p>
          {/if}
        {:else}
          <p class="next-time">{t('availabilityUnannounced')}</p>
          <p class="opening-dates">{t('availabilityUnannouncedDetail')}</p>
        {/if}
      </div>
    </div>

    {#if !loading && !failed && !closed && !scheduled && days.length}
      <div class="dates-heading">
        <h3><CalendarDays size={18} aria-hidden="true" />{t('availabilityDates')}</h3>
        <span>{t('availabilitySeparatePools')}</span>
      </div>
      <ul class="date-list">
        {#each days as day (day.date)}
          <li>
            <button
              type="button"
              class="date-card"
              data-full={day.blocked}
              disabled={day.blocked}
              onclick={() => book(day.date)}
            >
              <span>{dateLabel(day.date)}</span>
              <strong
                >{day.blocked
                  ? t('availabilityFull')
                  : tc('availabilityLeft', {
                      n: Math.max(0, perDay - day.quota),
                      unit: t(mode === 'visit' ? 'availabilityVisitUnit' : 'availabilityTableUnit'),
                    })}</strong
              >
            </button>
          </li>
        {/each}
      </ul>
    {/if}
    <p class="freshness">
      {updated && !failed
        ? tc('availabilityUpdated', {
            time: new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Asia/Bangkok',
              hour: '2-digit',
              minute: '2-digit',
              hourCycle: 'h23',
            }).format(new Date(updated)),
          })
        : t('availabilityNoVerifiedData')}
      {t('availabilityLiveNote')}
    </p>
    <PushOptIn kind="opening" align="start" />

    <details class="rules" open>
      <summary>{t('availabilityRules')}</summary>
      <ol>
        {#each rules as rule (rule)}<li>{rule}</li>{/each}
      </ol>
      <div class="rules-footer">
        <a href="/reservation-guide-th.png" download="คู่มือการจองภาษาไทย.png"
          ><Download size={17} aria-hidden="true" />{t('availabilityDownload')}</a
        >
        <a href="#home-faq"
          >{t('availabilityMoreRules')} <ArrowRight size={16} aria-hidden="true" /></a
        >
      </div>
    </details>
  </div>
</section>

<style>
  .overview {
    padding: 2.5rem 1rem 3.5rem;
    background: var(--app-bg-subtle, var(--surface));
    border-block: 1px solid var(--app-border-subtle);
    scroll-margin-top: 2rem;
  }
  .overview-inner {
    max-width: 72rem;
    margin: auto;
  }
  .overview-heading {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 1rem;
  }
  h2 {
    font-size: clamp(1.6rem, 3vw, 2.3rem);
    font-weight: 700;
    margin-top: 0.5rem;
    line-height: 1.4;
  }
  .intro {
    color: var(--app-text-secondary);
    margin-top: 0.4rem;
    font-size: 0.95rem;
  }
  .refresh {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.8rem;
    border: 1px solid var(--app-border-subtle);
    border-radius: 0.5rem;
    white-space: nowrap;
    font-size: 0.85rem;
  }
  button,
  a,
  summary {
    -webkit-tap-highlight-color: transparent;
  }
  button:not(:disabled),
  summary {
    cursor: pointer;
  }
  button:focus-visible,
  a:focus-visible,
  summary:focus-visible {
    outline: 3px solid var(--ct-orange);
    outline-offset: 3px;
  }
  .mode-switch {
    display: flex;
    gap: 0.5rem;
    margin: 1.5rem 0 1rem;
    flex-wrap: wrap;
  }
  .mode-switch button {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--app-border-subtle);
    font-size: 0.9rem;
  }
  .mode-switch [aria-pressed='true'] {
    background: var(--ct-ink);
    color: var(--surface);
    border-color: var(--ct-ink);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .current-card,
  .next-card {
    border-radius: 0.8rem;
    padding: 1.5rem;
  }
  .current-card {
    background: var(--surface);
    border: 1px solid var(--app-border-subtle);
  }
  .card-label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    margin: 0.7rem 0 0.5rem;
  }
  .status-dot {
    width: 0.7rem;
    height: 0.7rem;
    background: currentColor;
    border-radius: 50%;
    flex-shrink: 0;
  }
  [data-tone='green'] .status {
    color: #15803d;
  }
  [data-tone='red'] .status {
    color: #b91c1c;
  }
  [data-tone='amber'] .status {
    color: #a16207;
  }
  :global(.dark) [data-tone='green'] .status {
    color: #86efac;
  }
  :global(.dark) [data-tone='red'] .status {
    color: #fca5a5;
  }
  :global(.dark) [data-tone='amber'] .status {
    color: #fde047;
  }
  .current-card > p:not(.status):not(.card-label) {
    color: var(--app-text-secondary);
    font-size: 0.9rem;
    line-height: 1.7;
    white-space: pre-line;
  }
  .book-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1.2rem;
    padding: 0.7rem 1rem;
    border-radius: 0.4rem;
    background: var(--ct-ink);
    color: var(--surface);
    font-size: 0.9rem;
    min-height: 44px;
  }
  button:disabled {
    cursor: default;
  }
  .book-link:disabled,
  .refresh:disabled {
    opacity: 0.45;
  }
  .next-card {
    background: var(--ct-black);
    color: #fff;
  }
  .next-card .card-label {
    color: var(--ct-orange);
  }
  .next-time {
    font-size: clamp(1.3rem, 2.5vw, 1.7rem);
    font-weight: 600;
    line-height: 1.5;
    margin-top: 0.8rem;
  }
  .timezone {
    font-size: 0.8rem;
    color: #c8c5c3;
    margin-top: 0.3rem;
  }
  .opening-dates {
    margin-top: 0.7rem;
    font-size: 0.9rem;
    line-height: 1.7;
    color: #e4e1df;
  }
  .countdown {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .countdown-part {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.65rem 0.25rem;
    border: 1px solid #ffffff24;
    border-radius: 0.5rem;
    background: #ffffff0a;
  }
  .countdown-part strong {
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 600;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    color: var(--ct-orange);
  }
  .countdown-part span {
    font-size: 0.7rem;
    color: #e4e1df;
  }
  .dates-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1.5rem;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }
  .dates-heading > span {
    color: var(--app-text-secondary);
    font-size: 0.8rem;
  }
  .date-list {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 0.6rem;
    list-style: none;
    padding: 0;
    margin-top: 0.8rem;
  }
  .date-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
    padding: 1rem 0.8rem;
    border: 1px solid var(--app-border-subtle);
    border-radius: 0.5rem;
    background: var(--surface);
    text-align: left;
    font-size: 0.85rem;
  }
  .date-card strong {
    color: #15803d;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .date-card[data-full='true'] {
    border-style: dashed;
  }
  .date-card[data-full='true'] strong {
    color: #b91c1c;
  }
  :global(.dark) .date-card strong {
    color: #86efac;
  }
  :global(.dark) .date-card[data-full='true'] strong {
    color: #fca5a5;
  }
  .date-card:not(:disabled):hover {
    border-color: var(--ct-orange);
  }
  .freshness {
    margin: 1rem 0;
    font-size: 0.75rem;
    line-height: 1.8;
    color: var(--app-text-secondary);
  }
  .rules {
    border-top: 1px solid var(--app-border-subtle);
    padding-top: 1rem;
  }
  summary {
    font-weight: 600;
    font-size: 1rem;
  }
  ol {
    padding-left: 1.3rem;
    margin: 0.8rem 0 1rem;
    columns: 2;
    column-gap: 2.5rem;
  }
  li {
    break-inside: avoid;
  }
  ol li {
    padding-left: 0.2rem;
    margin-bottom: 0.65rem;
    font-size: 0.85rem;
    line-height: 1.8;
    color: var(--app-text-secondary);
  }
  .rules-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
  }
  .rules-footer a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  @media (max-width: 700px) {
    .overview {
      padding: 1.8rem 1rem 2.5rem;
    }
    .overview-heading {
      flex-wrap: wrap;
    }
    .summary-grid {
      grid-template-columns: 1fr;
    }
    .current-card,
    .next-card {
      padding: 1.2rem;
    }
    .date-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    ol {
      columns: 1;
    }
  }
</style>
