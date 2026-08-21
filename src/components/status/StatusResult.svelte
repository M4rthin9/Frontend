<script lang="ts">
  import { onMount } from 'svelte';
  import { t, tc } from '../../lib/i18n/i18n.svelte';
  import { getNotes, publicCancelBooking, getPublicSettings } from '../../lib/api/endpoints';
  import type { Note, PublicReservation } from '../../lib/api/types';
  import { ui } from '../../lib/store/ui.svelte';
  import {
    normalizeStatus,
    statusPillLabel,
    statusPillClass,
    statusCardClass,
    parseExtraVisitorNames,
    approvalState,
    approvalLabel,
  } from '../../lib/utils/status';
  import { maskPrisonerName } from '../../lib/utils/helpers';
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
  const totalPersons = $derived(visitorCount + 1);
  const total = $derived(parseInt(String(booking.total)) || totalPersons * 1000);

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

<div>
  <div class="result-card {statusCardClass(displayStatus)}">
    <div class="result-header">
      <div>
        <div class="result-ref">
          {t('resultRefLabel')} · <strong>{booking.ref}</strong>
        </div>
        <div style="font-size:12px;color:var(--app-text-tertiary)">
          {tc('bookedAt', { timestamp: booking.timestamp || '—' })}
        </div>
      </div>
      <div>
        <span class="status-pill {statusPillClass(displayStatus)}">
          {statusPillLabel(displayStatus)}
        </span>
      </div>
    </div>

    <div class="result-body">
      <div class="info-row">
        <span class="lbl">{t('lblVisitor')}</span>
        <span class="val">{booking.visitorName || '—'}</span>
      </div>
      <div class="info-row">
        <span class="lbl">{t('lblPrisoner')}</span>
        <span class="val">{maskPrisonerName(booking.prisonerName) || '—'} (#{booking.prisonerId || '—'})</span>
      </div>
      <div class="info-row">
        <span class="lbl">{t('lblWing')}</span>
        <span class="val">{booking.wing || '—'}</span>
      </div>
      <div class="info-row">
        <span class="lbl">{t('lblVisitDate')}</span>
        <span class="val">{booking.visitDate || '—'}</span>
      </div>
      <div class="info-row">
        <span class="lbl">{t('lblCount')}</span>
        <span class="val">{tc('countFormat', { n: visitorCount, total: totalPersons })}</span>
      </div>
      <div class="info-row">
        <span class="lbl">{t('lblCost')}</span>
        <span class="val">{total.toLocaleString()} บาท</span>
      </div>

      {#if visitors.length > 0}
        <div class="visitor-section">
          <div class="visitor-section-label">{t('visitorsApprovedTitle')}</div>
          {#each visitors as v, i (i)}
            <div class="visitor-item">
              <span>{v.name}</span>
              {#if v.state !== 'pending'}
                <span class="approval-badge {v.state}">{approvalLabel(v.state)}</span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  {#if !showPayment}
    <div>
      {#if statusNotice.kind === 'approve'}
        <div class="pay-section">
          <h3>{statusNotice.title}</h3>
          <p>{statusNotice.text}</p>
          <div style="text-align:center;margin-bottom:1rem">
            <div style="font-size:13px;color:var(--app-text-tertiary)">{t('amountDue')}</div>
            <div style="font-size:28px;font-weight:700;color:var(--text);margin:8px 0">{total.toLocaleString()} บาท</div>
            <div style="font-size:12px;color:var(--app-text-tertiary)">{tc('perPerson', { n: totalPersons })}</div>
          </div>
          {#if paymentEnabled}
            <button type="button" class="btn-primary" onclick={() => (showPayment = true)}>
              {t('payNow')}
            </button>
          {:else}
            <div class="payment-closed">
              <strong>⏳ {t('paymentClosedTitle')}</strong>
              <p>{paymentClosedMessage || t('paymentClosedText')}</p>
            </div>
          {/if}
        </div>
      {:else if statusNotice.kind === 'reject' || statusNotice.kind === 'cancel'}
        <div class="rejected-notice">
          <h3>{statusNotice.title}</h3>
          <p>{statusNotice.text}</p>
          {#if rejectReason}
            <div class="reason-box">
              <div class="reason-label">{statusNotice.kind === 'reject' ? t('disciplineReason') : t('reasonLabel')}</div>
              <div class="reason-text">{rejectReason}</div>
            </div>
          {/if}
        </div>
        {#if normalized === 'ยกเลิก'}
          {#if notes.length > 0}
            <div class="cancel-notes">
              <div class="cancel-notes-title">{t('cancelNotesTitle')}</div>
              {#each notes as n, i (i)}
                <div class="cancel-notes-item">
                  <div>📝 {n.text}</div>
                  {#if n.user || n.timestamp}
                    <div class="cancel-notes-meta">{n.user}{n.user && n.timestamp ? ' · ' : ''}{n.timestamp}</div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        {/if}
        <button type="button" class="btn-secondary" style="margin-bottom:1rem" onclick={() => onsearchagain()}>
          ＋ {t('bookNew')}
        </button>
      {:else if statusNotice.kind === 'paid' || statusNotice.kind === 'done'}
        <div class="paid-notice {statusNotice.kind === 'done' ? 'done' : ''}">
          <h3>{statusNotice.title}</h3>
          <p>{statusNotice.text}</p>
        </div>
      {:else}
        <div class="pay-section">
          <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px;display:flex;align-items:center;gap:8px">
            {statusNotice.title}
          </div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.7">
            {statusNotice.text}
          </div>
        </div>
      {/if}

      {#if showCancelBtn}
        <div class="cancel-section">
          <button type="button" class="btn-danger" disabled={cancelling} onclick={() => void cancelBooking()}>
            {t('cancelBooking')}
          </button>
          <p class="cancel-hint">{t('cancelHint')}</p>
        </div>
      {/if}
    </div>
  {:else if paymentEnabled}
    <PaymentForm booking={booking} onpaid={onpaid} oncancel={() => (showPayment = false)} />
  {/if}

  <button type="button" class="btn-secondary" style="margin-top:4px" onclick={() => onsearchagain()}>
    {t('searchAgain')}
  </button>
</div>
