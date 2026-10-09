<script lang="ts">
  import { onMount } from 'svelte';
  import {
    booking as defaultBooking,
    CHILD_RELATIONS,
    type BookingStore,
  } from '../../lib/store/booking.svelte';
  import { t, tc } from '../../lib/i18n/i18n.svelte';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';
  import Spinner from '../ui/Spinner.svelte';
  import TableBookingTerms from './TableBookingTerms.svelte';

  // The page decides which flow this belongs to; defaults to the prisoner-visit
  // store so existing usages keep working unchanged.
  let { store = defaultBooking }: { store?: BookingStore } = $props();

  let turnstileEl: HTMLDivElement;
  let copiedSummary = $state(false);
  let showConfirmModal = $state(false);

  onMount(() => {
    store.turnstileError = '';
    void store.setupTurnstile(turnstileEl);
  });

  const data = $derived(store.confirmData);
  const cost = $derived(store.cost);
  const n = $derived(store.visitorCount);
  const totalPersons = $derived(data?.totalPersons ?? 0);
  const thDate = $derived(data?.visitDate ?? '');

  const extrasList = $derived(
    store.extras.length > 0
      ? store.extras.map((v) => ({
          name: v.name,
          relation: v.relation,
          ageNote:
            CHILD_RELATIONS.includes(v.relation) && v.age
              ? tc('bookingAgeNote', { age: v.age })
              : '',
        }))
      : [],
  );

  let checkingNames = $state(false);

  async function confirmAndSubmit(): Promise<void> {
    if (store.submitting || checkingNames) return;
    if (store.isTable && !store.tableAgreementAccepted) return;
    if (store.isTable) {
      checkingNames = true;
      const names = [store.visitorName, ...store.extras.map((e) => e.name)];
      const match = await store.findPrisonerNameMatch(names);
      checkingNames = false;
      if (match) {
        showConfirmModal = false;
        store.inlineError = `⚠️ ${tc('prisonerNameRejectAlert', { name: match })}`;
        window.scrollTo(0, 0);
        return;
      }
    }
    showConfirmModal = false;
    await store.submit();
  }

  async function copySummary(): Promise<void> {
    if (!data) return;
    const cleanText = [
      t('bookingSummaryTitle'),
      tc('bookingSummaryDate', { date: thDate }),
      tc('bookingSummaryVisitor', {
        name: store.visitorName.trim(),
        phone: store.visitorPhone.trim(),
      }),
      tc('bookingSummaryCount', { n: totalPersons }),
      ...(store.isTable
        ? []
        : [tc('bookingSummaryPrisoner', { name: data.prisonerName, id: data.prisonerId })]),
      tc('bookingSummaryTotal', { total: cost.total.toLocaleString() }),
      t('bookingSummaryRef'),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(cleanText);
      copiedSummary = true;
      setTimeout(() => {
        copiedSummary = false;
      }, 1800);
    } catch {
      window.prompt(t('bookingCopyPrompt'), cleanText);
    }
  }
</script>

<div>
  {#if data}
    {#if store.isTable}
      <TableBookingTerms />
    {/if}

    <div class="confirm-hero">
      <div class="confirm-hero-date">{t('textBookingConfirm1')}</div>
      <div class="confirm-hero-main">{thDate}</div>
      <div class="confirm-hero-meta">
        {store.isTable
          ? tc('countFormatTable', { n: totalPersons })
          : tc('bookingSummaryCountValue', { n: totalPersons })}
        {store.isTable ? '' : t('textBookingConfirm2')} &nbsp;•&nbsp;
        <strong>{cost.total.toLocaleString()} {t('textBookingConfirm3')}</strong>
      </div>
    </div>

    <div class="review-grid">
      <div class="review-section">
        <div class="review-label">{t('textBookingConfirm4')}</div>
        <div class="review-value">{store.visitorName.trim()}</div>
        <div class="review-sub">
          {store.visitorPhone.trim()}{store.isTable ? '' : ` • ${store.relation}`}
        </div>
      </div>

      <div class="review-section">
        <div class="review-label">{t('textBookingConfirm5')}{n} {t('textBookingConfirm6')}</div>
        <div class="review-value review-list">
          1. {store.visitorName.trim()}
          {t('textBookingConfirm7')}
          {#if extrasList.length > 0}
            {#each extrasList as v, i (i)}
              <div>• {v.name}{store.isTable ? '' : ` — ${v.relation}${v.ageNote}`}</div>
            {/each}
          {:else}
            <div class="review-none">{t('textBookingConfirm8')}</div>
          {/if}
        </div>
      </div>

      {#if !store.isTable}
        <div class="review-section">
          <div class="review-label">{t('textBookingConfirm9')}</div>
          <div class="review-value">{data.prisonerName}</div>
          <div class="review-sub">#{data.prisonerId} {t('textBookingConfirm10')} {data.wing}</div>
        </div>
      {/if}

      <div class="review-section cost">
        <div class="review-label">{t('textBookingConfirm11')}</div>
        <div class="review-total">{cost.total.toLocaleString()} {t('textBookingConfirm12')}</div>
        <div class="review-sub">
          {t('textBookingConfirm13')}
          {cost.adults}
          {t('textBookingConfirm14')}
          {cost.kids5_8}
          {t('textBookingConfirm15')}
          {cost.kidsUnder5}
        </div>
        {#if cost.discountNotes.length > 0}
          <div class="discount-line">
            {t('textBookingConfirm16')}
            {cost.discountNotes.join(' • ')}
          </div>
        {/if}
      </div>
    </div>

    <div class="confirm-note">{t('textBookingConfirm17')}<br /> {t('textBookingConfirm18')}</div>

    <Button variant="secondary" size="md" fullWidth onclick={() => void copySummary()}>
      {copiedSummary ? t('textBookingConfirm19') : t('copySummary')}
    </Button>
  {/if}

  <div class="rules rules-gold">
    <!-- A table booking skips the participant and discipline stages entirely, so
         it must not promise a 1-2 day review — it goes straight to payment. -->
    <strong>{t('afterSubmit')}:</strong>
    <span>{store.isTable ? t('afterSubmitTextTable') : t('afterSubmitText')}</span><br />
    <strong>{t('checkStatusInfo')}:</strong> <span>{t('checkStatusInfoText')}</span><br />
    <strong>{t('paymentInfo')}:</strong> <span>{t('paymentInfoText')}</span><br />
    {#if !store.isTable}
      <strong>{t('vinaiInfo')}:</strong> <span>{t('vinaiInfoText')}</span>
    {/if}
  </div>

  <div class="turnstile-wrap">
    <div class="turnstile-box-title">{t('captchaTitle')}</div>
    {#if store.turnstileError}
      <div class="error-text-inline" style="white-space:pre-line">{t('textBookingConfirm20')}</div>
    {:else if !store.turnstileToken}
      <div class="text-xs text-text-tertiary text-center py-2">{t('textBookingConfirm21')}</div>
    {/if}
    <div bind:this={turnstileEl}></div>
  </div>

  {#if store.inlineError}
    <div class="error-text-inline" style="white-space:pre-line">{store.inlineError}</div>
  {/if}

  <div style="display:flex;gap:10px;margin-bottom:1rem">
    <Button
      variant="secondary"
      size="lg"
      style="flex:0.45"
      disabled={store.submitting || checkingNames}
      onclick={() => store.goBack()}
    >
      ← {t('editBtn')}
    </Button>
    <Button
      variant="primary"
      size="lg"
      style="flex:1"
      disabled={store.submitting}
      onclick={() => {
        store.tableAgreementAccepted = false;
        showConfirmModal = true;
      }}
    >
      {#if store.submitting}
        <Spinner size="sm" />
      {:else}
        {store.isTable ? t('tblReviewAgreement') : t('submitBtn')}
      {/if}
    </Button>
  </div>
</div>

<Modal
  bind:open={showConfirmModal}
  title={store.isTable ? t('tblAgreementTitle') : t('confirmBookingTitle')}
  dismissable={!store.submitting && !checkingNames}
  onClose={() => (showConfirmModal = false)}
>
  <div class="review-grid">
    <div class="review-section">
      <div class="review-label">{t('lblVisitDate')}</div>
      <div class="review-value">{thDate}</div>
    </div>
    <div class="review-section">
      <div class="review-label">{t('lblCount')}</div>
      <div class="review-value">
        {store.isTable
          ? tc('countFormatTable', { n: totalPersons })
          : tc('bookingSummaryCountValue', { n: totalPersons })}
      </div>
    </div>
    <div class="review-section cost">
      <div class="review-label">{t('lblCost')}</div>
      <div class="review-total">{cost.total.toLocaleString()} {t('textBookingConfirm22')}</div>
    </div>
  </div>

  {#if store.isTable}
    <TableBookingTerms />
    <label
      class="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 p-4 text-sm leading-relaxed"
    >
      <input
        type="checkbox"
        class="mt-1 h-5 w-5 shrink-0 accent-amber-700"
        bind:checked={store.tableAgreementAccepted}
        disabled={store.submitting || checkingNames}
        required
      />
      <span>{t('tblAgreementAccept')}</span>
    </label>
  {/if}

  <p class="confirm-modal-text">
    {store.isTable ? t('tblBookingFinalNotice') : t('confirmBookingText')}
  </p>

  <div style="display:flex;gap:10px;margin-top:1rem">
    <Button
      variant="secondary"
      size="lg"
      style="flex:0.45"
      disabled={store.submitting || checkingNames}
      onclick={() => {
        showConfirmModal = false;
      }}
    >
      ← {t('confirmBookingCancel')}
    </Button>
    <Button
      variant="primary"
      size="lg"
      style="flex:1"
      disabled={store.submitting ||
        checkingNames ||
        (store.isTable && !store.tableAgreementAccepted)}
      onclick={() => void confirmAndSubmit()}
    >
      {#if store.submitting || checkingNames}
        <Spinner size="sm" />
      {:else}
        ✓ {store.isTable ? t('tblAcceptAndBook') : t('confirmBookingConfirm')}
      {/if}
    </Button>
  </div>
</Modal>
