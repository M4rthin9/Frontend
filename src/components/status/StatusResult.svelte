<script lang="ts">
  import { onMount } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { getNotes, publicCancelBooking, getPublicSettings } from '../../lib/api/endpoints';
  import type { Note, PublicReservation } from '../../lib/api/types';
  import { ui } from '../../lib/store/ui.svelte';
  import {
    normalizeStatus,
    statusPillLabel,
    statusTone,
    cleanLabel,
    parseExtraVisitorNames,
    parseExtraPrisoners,
    approvalState,
    approvalLabel,
  } from '../../lib/utils/status';
  import { maskPrisonerName } from '../../lib/utils/helpers';
  import { formatDateIn } from '../../lib/utils/date';
  import PaymentForm from './PaymentForm.svelte';

  let {
    booking,
    onpaid = () => {},
    onsearchagain = () => {},
  }: {
    booking: PublicReservation;
    onpaid?: () => void;
    onsearchagain?: () => void;
  } = $props();

  let statusOverride = $state<string | null>(null);
  let notes = $state<Note[]>([]);
  let showPayment = $state(false);
  let cancelling = $state(false);
  // Fails open: payment stays available unless the backend says otherwise.
  let paymentEnabled = $state(true);
  let paymentClosedMessage = $state('');

  const displayStatus = $derived(statusOverride ?? booking.status ?? '');
  const normalized = $derived(normalizeStatus(displayStatus));

  onMount(() => {
    if (normalized === 'ยกเลิก') {
      void loadNotes();
    }
    void loadPaymentWindow();
  });

  async function loadPaymentWindow(): Promise<void> {
    const settings = await getPublicSettings();
    paymentEnabled = settings.paymentEnabled;
    paymentClosedMessage = settings.paymentClosedMessage;
    // Close the form if the window shut while this view was open.
    if (!paymentEnabled) showPayment = false;
  }

  async function loadNotes(): Promise<void> {
    try {
      const result = await getNotes(booking.ref);
      notes = result.filter((n) => String(n.text || '').trim()).map((n) => ({
        text: String(n.text || '').replace(/^ยกเลิก:\s*/i, '').trim() || String(n.text || ''),
        user: String(n.user || ''),
        timestamp: String(n.timestamp || ''),
      }));
    } catch (e) {
      console.warn('Failed to load cancel notes:', e);
    }
  }

  const visitorCount = $derived(parseInt(String(booking.visitorCount)) || 1);
  const isTable = $derived(
    String(booking.bookingType || '').trim().toLowerCase() === 'table' ||
      String(booking.ref || '').toUpperCase().startsWith('TBL-'),
  );
  const coPrisoners = $derived(isTable ? [] : parseExtraPrisoners(booking.extraPrisoners));
  const prisonerCount = $derived(isTable ? 0 : 1 + coPrisoners.length);
  const totalPersons = $derived(visitorCount + prisonerCount);
  const total = $derived(parseInt(String(booking.total)) || totalPersons * 1000);

  // Every prisoner at the table: the booking's own first, then any seated with him.
  const prisoners = $derived(
    isTable
      ? []
      : [
          { name: String(booking.prisonerName ?? ''), id: String(booking.prisonerId ?? ''), wing: String(booking.wing ?? ''), extra: false },
          ...coPrisoners.map((p) => ({ ...p, extra: true })),
        ],
  );

  const visitors = $derived.by(() => {
    const list: { name: string; state: 'yes' | 'no' | 'pending' }[] = [];
    const mainAppr = String(booking.visitorApproved || '').trim();
    list.push({
      name: String(booking.visitorName || '—'),
      state: mainAppr ? approvalState(mainAppr) : 'pending',
    });
    const exNames = parseExtraVisitorNames(booking.extraVisitorNames);
    const exAppr = String(booking.extraVisitorApproved || '').split(';;');
    exNames.forEach((name, i) => {
      list.push({ name, state: approvalState(exAppr[i]) });
    });
    return list;
  });

  const visitDateText = $derived.by(() => {
    const iso = String(booking.visitDateISO ?? '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(iso)
      ? formatDateIn(iso, i18n.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : String(booking.visitDate || '—');
  });

  // The booking's road, one stop per status. A table booking starts at payment.
  const VISIT_STEPS = ['รอตรวจสอบผู้เข้าร่วม', 'รอตรวจสอบวินัย', 'รอชำระเงิน', 'ชำระแล้ว', 'เสร็จสิ้น'];
  const TABLE_STEPS = ['รอชำระเงิน', 'ชำระแล้ว', 'เสร็จสิ้น'];
  const STEP_LABEL: Record<string, string> = {
    รอตรวจสอบผู้เข้าร่วม: 'stepParticipants',
    รอตรวจสอบวินัย: 'stepDiscipline',
    รอชำระเงิน: 'stepPayment',
    ชำระแล้ว: 'stepSlip',
    เสร็จสิ้น: 'stepReady',
  };
  const steps = $derived(isTable ? TABLE_STEPS : VISIT_STEPS);
  const stopped = $derived(normalized === 'ยกเลิก' || normalized === 'ไม่อนุมัติ');
  const currentStep = $derived(steps.indexOf(normalized));

  function stepState(i: number): 'done' | 'now' | 'next' {
    if (i < currentStep || normalized === 'เสร็จสิ้น') return 'done';
    return i === currentStep ? 'now' : 'next';
  }

  const statusNotice = $derived.by(() => {
    const s = normalized;
    if (s === 'รอชำระเงิน') {
      return { title: t('noticeApprovedPay'), text: t('noticeApprovedPayText'), kind: 'approve' };
    }
    if (s === 'ไม่อนุมัติ') {
      return { title: t('noticeRejected'), text: t('noticeRejectedText'), kind: 'reject' };
    }
    if (s === 'ชำระแล้ว') {
      return { title: t('noticePaid'), text: t('noticePaidText'), kind: 'paid' };
    }
    if (s === 'เสร็จสิ้น') {
      return { title: t('noticeDone'), text: t('noticeDoneText'), kind: 'done' };
    }
    if (s === 'ยกเลิก') {
      return { title: t('noticeCancelled'), text: t('noticeCancelledText'), kind: 'cancel' };
    }
    if (s === 'รอตรวจสอบวินัย') {
      return { title: t('noticeReviewDiscipline'), text: t('noticeReviewDisciplineText'), kind: 'pending' };
    }
    if (s === 'รอตรวจสอบผู้เข้าร่วม') {
      return { title: t('noticeReviewParticipants'), text: t('noticeReviewParticipantsText'), kind: 'pending' };
    }
    return { title: t('noticeReviewDefault'), text: t('noticeReviewDefaultText'), kind: 'pending' };
  });

  const rejectReason = $derived(String(booking.cancelReason || '').trim());
  const showCancelBtn = $derived(!['ยกเลิก', 'เสร็จสิ้น'].includes(normalized));

  async function cancelBooking(): Promise<void> {
    if (!window.confirm(tc('cancelConfirmMsg', { ref: booking.ref, name: booking.visitorName || '—', status: displayStatus || '—' }))) {
      return;
    }
    cancelling = true;
    try {
      await publicCancelBooking(booking.ref);
      statusOverride = 'ยกเลิก';
      ui.showToast(t('cancelSuccess'), 'success');
      await loadNotes();
    } catch (err) {
      console.error('Cancel error:', err);
      ui.showToast(tc('cancelFailMsg', { msg: err instanceof Error ? err.message : '' }), 'error');
    } finally {
      cancelling = false;
    }
  }
</script>

<div class="flex flex-col gap-6">
  <article class="sheet" aria-labelledby="status-ref">
    <header class="flex flex-wrap items-start justify-between gap-4 px-5 pb-5 pt-6 sm:px-8 sm:pt-7">
      <div class="min-w-0">
        <p class="text-xs font-medium tracking-[0.06em] text-text-tertiary">{t('resultRefLabel')}</p>
        <p id="status-ref" class="mt-1 font-mono text-[1.75rem] font-semibold leading-tight tracking-wide text-text-primary sm:text-3xl">
          {booking.ref}
        </p>
        <p class="mt-1.5 text-sm text-text-tertiary">{tc('bookedAt', { timestamp: booking.timestamp || '—' })}</p>
      </div>
      <span class="ct-pill {statusTone(displayStatus)}">
        <span class="dot" aria-hidden="true"></span>
        {cleanLabel(statusPillLabel(displayStatus))}
      </span>
    </header>

    {#if !stopped}
      <section class="border-t border-border-subtle px-5 py-6 sm:px-8" aria-label={t('statusProgress')}>
        <ol class="steps" style="--n: {steps.length}">
          {#each steps as s, i (s)}
            {@const state = stepState(i)}
            <li class="step {state}" aria-current={state === 'now' ? 'step' : undefined}>
              <span class="mark" aria-hidden="true">
                {#if state === 'done'}<Check class="h-3.5 w-3.5" strokeWidth={3} />{:else}{i + 1}{/if}
              </span>
              <span class="step-label">{t(STEP_LABEL[s])}</span>
            </li>
          {/each}
        </ol>
        <!-- Phones have no room for every label: name the current stop under the line. -->
        <p class="mt-4 text-center text-sm text-text-secondary sm:hidden">
          {Math.min(currentStep, steps.length - 1) + 1}/{steps.length} ·
          <span class="font-semibold text-text-primary">{t(STEP_LABEL[steps[Math.max(0, currentStep)]])}</span>
        </p>
      </section>
    {/if}

    <!-- What happens next, and the one thing the visitor can do about it. -->
    <section class="notice {statusTone(displayStatus)} mx-5 mb-6 sm:mx-8 {stopped ? 'mt-1' : ''}" aria-live="polite">
      <h2 class="text-base font-semibold">{cleanLabel(statusNotice.title)}</h2>
      <p class="mt-1 text-sm leading-relaxed text-text-secondary">{statusNotice.text}</p>

      {#if rejectReason && (statusNotice.kind === 'reject' || statusNotice.kind === 'cancel')}
        <div class="mt-3 border-l-2 border-[var(--tone)] pl-3">
          <p class="text-xs font-medium text-text-tertiary">
            {cleanLabel(statusNotice.kind === 'reject' ? t('disciplineReason') : t('reasonLabel'))}
          </p>
          <p class="mt-0.5 text-sm text-text-primary">{rejectReason}</p>
        </div>
      {/if}

      {#if normalized === 'ยกเลิก' && notes.length > 0}
        <div class="mt-3">
          <p class="text-xs font-medium text-text-tertiary">{cleanLabel(t('cancelNotesTitle'))}</p>
          <ul class="mt-1 flex flex-col gap-2">
            {#each notes as n, i (i)}
              <li class="text-sm text-text-primary">
                {n.text}
                {#if n.user || n.timestamp}
                  <span class="block text-xs text-text-tertiary">{n.user}{n.user && n.timestamp ? ' · ' : ''}{n.timestamp}</span>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if statusNotice.kind === 'approve' && !showPayment}
        <div class="pay-row mt-4 flex flex-wrap items-end justify-between gap-4 pt-4">
          <div>
            <p class="text-xs text-text-tertiary">{t('amountDue')}</p>
            <p class="text-2xl font-semibold tabular-nums text-text-primary">{total.toLocaleString()} <span class="text-base font-normal">บาท</span></p>
            <p class="text-xs text-text-tertiary">{tc('perPerson', { n: totalPersons })}</p>
          </div>
          {#if paymentEnabled}
            <button type="button" class="ct-btn ct-btn-orange w-full sm:w-auto" onclick={() => (showPayment = true)}>
              {t('payNow')}
            </button>
          {:else}
            <div class="w-full">
              <p class="text-sm font-semibold text-text-primary">{t('paymentClosedTitle')}</p>
              <p class="mt-0.5 text-sm text-text-secondary">{paymentClosedMessage || t('paymentClosedText')}</p>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <dl class="facts border-t border-border-subtle">
      <div class="sm:col-span-2">
        <dt>{t('lblVisitDate')}</dt>
        <dd class="text-lg font-medium">{visitDateText}</dd>
      </div>
      <div>
        <dt>{t('lblCount')}</dt>
        <dd>
          {isTable
            ? tc('countFormatTable', { n: visitorCount })
            : tc('countFormat', { n: visitorCount, p: prisonerCount, total: totalPersons })}
        </dd>
      </div>
      <div>
        <dt>{t('lblCost')}</dt>
        <dd><span class="font-semibold tabular-nums">{total.toLocaleString()}</span> บาท</dd>
      </div>
    </dl>

    {#if prisoners.length > 0}
      <section class="border-t border-border-subtle px-5 py-5 sm:px-8">
        <h3 class="block-title">{t('lblPrisoner')}</h3>
        <ul class="mt-3 flex flex-col gap-2">
          {#each prisoners as p, i (p.id || i)}
            <li class="person">
              <span class="min-w-0">
                <span class="block truncate font-medium text-text-primary">{maskPrisonerName(p.name) || '—'}</span>
                <span class="block text-sm text-text-tertiary">#{p.id || '—'} · {p.wing || '—'}</span>
              </span>
              {#if p.extra}<span class="tag">{t('coPrisonerTag')}</span>{/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="border-t border-border-subtle px-5 py-5 sm:px-8">
      <h3 class="block-title">{t('lblVisitorList')}</h3>
      <ul class="mt-3 flex flex-col gap-2">
        {#each visitors as v, i (i)}
          <li class="person">
            <span class="min-w-0 truncate text-text-primary">{v.name}</span>
            <span class="chip {v.state === 'yes' ? 'is-done' : v.state === 'no' ? 'is-stop' : 'is-wait'}">
              {cleanLabel(v.state === 'pending' ? t('statusPillPending') : approvalLabel(v.state))}
            </span>
          </li>
        {/each}
      </ul>
    </section>
  </article>

  {#if showPayment && paymentEnabled}
    <div class="booking-app w-full !pb-0">
      <PaymentForm {booking} {onpaid} oncancel={() => (showPayment = false)} />
    </div>
  {/if}

  <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
    <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
      {#if stopped}
        <button type="button" class="ct-btn ct-btn-ink" onclick={() => navigate('booking')}>{t('bookNew')}</button>
      {/if}
      <button type="button" class="ct-btn ct-btn-line" onclick={() => onsearchagain()}>{t('searchAgain')}</button>
    </div>
    {#if showCancelBtn}
      <div class="text-center sm:text-right">
        <button type="button" class="cancel" disabled={cancelling} onclick={() => void cancelBooking()}>
          {t('cancelBooking')}
        </button>
        <p class="text-xs text-text-tertiary">{cleanLabel(t('cancelHint'))}</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .sheet {
    background: var(--surface);
    border: 1px solid var(--app-border-subtle);
    border-radius: 8px;
    box-shadow: 0 30px 50px -40px rgba(35, 31, 32, 0.55);
    overflow: hidden;
  }

  /* Progress: numbered stops on one line; done ones ticked in ink, the current one orange. */
  .steps {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  }
  .step {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
  }
  .step + .step::before {
    content: '';
    position: absolute;
    top: 0.875rem;
    right: calc(50% + 1.125rem);
    left: calc(-50% + 1.125rem);
    height: 2px;
    background: var(--app-border-subtle);
  }
  .step.done + .step::before {
    background: var(--ct-ink);
  }
  .mark {
    position: relative;
    display: grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 999px;
    border: 1.5px solid var(--app-border-strong);
    background: var(--surface);
    color: var(--app-text-tertiary);
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .step.done .mark {
    border-color: var(--ct-ink);
    background: var(--ct-ink);
    color: #fff;
  }
  .step.now .mark {
    border-color: var(--ct-orange);
    background: var(--ct-orange);
    color: var(--ct-ink);
    box-shadow: 0 0 0 4px rgba(245, 130, 31, 0.22);
  }
  .step-label {
    display: none;
    font-size: 0.8125rem;
    line-height: 1.35;
    color: var(--app-text-tertiary);
    text-wrap: balance;
  }
  .step.done .step-label {
    color: var(--app-text-secondary);
  }
  .step.now .step-label {
    color: var(--app-text);
    font-weight: 600;
  }
  @media (min-width: 640px) {
    .step-label {
      display: block;
    }
  }

  .notice {
    border-radius: 6px;
    border-left: 3px solid var(--tone);
    background: var(--tint);
    padding: 1rem 1.125rem;
  }
  .notice h2 {
    color: var(--tone);
  }
  .pay-row {
    border-top: 1px solid color-mix(in srgb, var(--tone) 25%, transparent);
  }

  .facts {
    display: grid;
    gap: 1.25rem 2rem;
    padding: 1.5rem 1.25rem;
  }
  @media (min-width: 640px) {
    .facts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      padding: 1.5rem 2rem;
    }
  }
  .facts dt {
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    color: var(--app-text-tertiary);
  }
  .facts dd {
    margin-top: 0.25rem;
    color: var(--app-text);
  }

  .block-title {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    color: var(--app-text-tertiary);
  }
  .person {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-radius: 6px;
    background: var(--app-bg);
    padding: 0.75rem 0.875rem;
  }
  .tag {
    flex: none;
    border-radius: 999px;
    background: var(--ct-ink);
    color: #fff;
    padding: 0.125rem 0.625rem;
    font-size: 0.75rem;
  }
  .chip {
    flex: none;
    border-radius: 999px;
    background: var(--tint);
    color: var(--tone);
    padding: 0.125rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .cancel {
    min-height: 2.75rem;
    color: #a12d2d;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 0.3em;
    cursor: pointer;
  }
  .cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .cancel:focus-visible {
    outline: 2px solid var(--ct-orange);
    outline-offset: 3px;
  }
</style>
