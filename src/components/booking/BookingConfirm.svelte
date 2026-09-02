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

  // The page decides which flow this belongs to; defaults to the prisoner-visit
  // store so existing usages keep working unchanged.
  let { store = defaultBooking }: { store?: BookingStore } = $props();

  let turnstileEl: HTMLDivElement;
  let copiedSummary = $state(false);
  let showConfirmModal = $state(false);
  let showTBLReminderModal = $state(false);

  onMount(() => {
    store.turnstileError = '';
    void store.setupTurnstile(turnstileEl);
    if (store.isTable) showTBLReminderModal = true;
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
          ageNote: CHILD_RELATIONS.includes(v.relation) && v.age ? ` (อายุ ${v.age} ปี)` : '',
        }))
      : [],
  );

  let checkingNames = $state(false);

  async function confirmAndSubmit(): Promise<void> {
    if (store.submitting || checkingNames) return;
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
    void store.submit();
  }

  async function copySummary(): Promise<void> {
    if (!data) return;
    const cleanText = [
      'การจองกิจกรรม Chance & Change Cafe',
      `วันที่: ${thDate}`,
      `ผู้จอง: ${store.visitorName.trim()} (${store.visitorPhone.trim()})`,
      `จำนวน: ${totalPersons} คน`,
      ...(store.isTable ? [] : [`ผู้ต้องขัง: ${data.prisonerName} (#${data.prisonerId})`]),
      `รวม: ${cost.total.toLocaleString()} บาท`,
      'Ref หลังส่ง: จะได้รับทันที',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(cleanText);
      copiedSummary = true;
      setTimeout(() => {
        copiedSummary = false;
      }, 1800);
    } catch {
      window.prompt('คัดลอกข้อความด้านล่าง (กด Ctrl+C):', cleanText);
    }
  }
</script>

<div>
  {#if data}
    {#if store.isTable}
      <div class="table-external-notice" role="note">
        <h3>{t('tableExternalOnlyTitle')}</h3>
        <p>{t('tableExternalOnlyText')}</p>
      </div>
    {/if}

    <div class="confirm-hero">
      <div class="confirm-hero-date">วันที่เข้าร่วม</div>
      <div class="confirm-hero-main">{thDate}</div>
      <div class="confirm-hero-meta">
        {store.isTable ? tc('countFormatTable', { n: totalPersons }) : totalPersons + ' คน'}
        {store.isTable ? '' : ' (รวมผู้ต้องขัง)'} &nbsp;•&nbsp;
        <strong>{cost.total.toLocaleString()} บาท</strong>
      </div>
    </div>

    <div class="review-grid">
      <div class="review-section">
        <div class="review-label">ผู้จองหลัก (ผู้ติดต่อ)</div>
        <div class="review-value">{store.visitorName.trim()}</div>
        <div class="review-sub">
          {store.visitorPhone.trim()}{store.isTable ? '' : ` • ${store.relation}`}
        </div>
      </div>

      <div class="review-section">
        <div class="review-label">ผู้เข้าร่วมกิจกรรมทั้งหมด ({n} คน)</div>
        <div class="review-value review-list">
          1. {store.visitorName.trim()} (ผู้จอง)
          {#if extrasList.length > 0}
            {#each extrasList as v, i (i)}
              <div>• {v.name}{store.isTable ? '' : ` — ${v.relation}${v.ageNote}`}</div>
            {/each}
          {:else}
            <div class="review-none">ไม่มีผู้เข้าร่วมเพิ่มเติม</div>
          {/if}
        </div>
      </div>

      {#if !store.isTable}
        <div class="review-section">
          <div class="review-label">ผู้ต้องขังที่เข้าร่วม</div>
          <div class="review-value">{data.prisonerName}</div>
          <div class="review-sub">#{data.prisonerId} • แดน {data.wing}</div>
        </div>
      {/if}

      <div class="review-section cost">
        <div class="review-label">สรุปค่าบริการ</div>
        <div class="review-total">{cost.total.toLocaleString()} บาท</div>
        <div class="review-sub">
          ผู้ใหญ่ {cost.adults} คน • เด็ก 5-8 ปี {cost.kids5_8} • ต่ำกว่า 5 ปี {cost.kidsUnder5}
        </div>
        {#if cost.discountNotes.length > 0}
          <div class="discount-line">ส่วนลดบุตร/ธิดา: {cost.discountNotes.join(' • ')}</div>
        {/if}
      </div>
    </div>

    <div class="confirm-note">
      โปรดตรวจสอบให้แน่ใจว่าข้อมูลข้างต้นถูกต้องทุกประการ<br />
      หลังส่งคำขอแล้วจะได้รับเลขอ้างอิงทันทีเพื่อติดตามสถานะ
    </div>

    <Button variant="secondary" size="md" fullWidth onclick={() => void copySummary()}>
      {copiedSummary ? 'คัดลอกแล้ว' : t('copySummary')}
    </Button>
  {/if}

  <div class="rules rules-gold">
    <!-- A table booking skips the participant and discipline stages entirely, so
         it must not promise a 1-2 day review — it goes straight to payment. -->
    <strong>{t('afterSubmit')}:</strong>
    <span>{store.isTable ? t('afterSubmitTextTable') : t('afterSubmitText')}</span><br />
    <strong>{t('checkStatusInfo')}:</strong> <span>{@html t('checkStatusInfoText')}</span><br />
    <strong>{t('paymentInfo')}:</strong> <span>{t('paymentInfoText')}</span><br />
    {#if !store.isTable}
      <strong>{t('vinaiInfo')}:</strong> <span>{t('vinaiInfoText')}</span>
    {/if}
  </div>

  <div class="turnstile-wrap">
    <div class="turnstile-box-title">{t('captchaTitle')}</div>
    {#if store.turnstileError}
      <div class="error-text-inline" style="white-space:pre-line">
        ⚠️ ระบบตรวจสอบความปลอดภัย (Turnstile) ไม่สามารถโหลดได้ —
        กรุณาตรวจสอบว่าอยู่ในหน้าต่างที่อนุญาตแล้วลองใหม่อีกครั้ง
      </div>
    {:else if !store.turnstileToken}
      <div class="text-xs text-text-tertiary text-center py-2">
        กำลังโหลดระบบตรวจสอบความปลอดภัย...
      </div>
    {/if}
    <div bind:this={turnstileEl}></div>
  </div>

  {#if store.inlineError}
    <div class="error-text-inline" style="white-space:pre-line">{store.inlineError}</div>
  {/if}

  <div style="display:flex;gap:10px;margin-bottom:1rem">
    <Button variant="secondary" size="lg" style="flex:0.45" onclick={() => store.goBack()}>
      ← {t('editBtn')}
    </Button>
    <Button
      variant="primary"
      size="lg"
      style="flex:1"
      disabled={store.submitting}
      onclick={() => {
        showConfirmModal = true;
      }}
    >
      {#if store.submitting}
        <Spinner size="sm" />
      {:else}
        {t('submitBtn')}
      {/if}
    </Button>
  </div>
</div>

<Modal bind:open={showConfirmModal} title={t('confirmBookingTitle')} onClose={() => (showConfirmModal = false)}>
  <div class="review-grid">
    <div class="review-section">
      <div class="review-label">{t('lblVisitDate')}</div>
      <div class="review-value">{thDate}</div>
    </div>
    <div class="review-section">
      <div class="review-label">{t('lblCount')}</div>
      <div class="review-value">{store.isTable ? tc('countFormatTable', { n: totalPersons }) : totalPersons + ' คน'}</div>
    </div>
    <div class="review-section cost">
      <div class="review-label">{t('lblCost')}</div>
      <div class="review-total">{cost.total.toLocaleString()} บาท</div>
    </div>
  </div>

  {#if store.isTable}
    <div class="table-external-notice confirm-popup-notice" role="note">
      <h3>{t('tableExternalOnlyTitle')}</h3>
      <p>{t('tableExternalOnlyText')}</p>
    </div>
  {/if}

  <p class="confirm-modal-text">{t('confirmBookingText')}</p>

  <div style="display:flex;gap:10px;margin-top:1rem">
    <Button
      variant="secondary"
      size="lg"
      style="flex:0.45"
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
      disabled={store.submitting || checkingNames}
      onclick={() => void confirmAndSubmit()}
    >
      {#if store.submitting || checkingNames}
        <Spinner size="sm" />
      {:else}
        ✓ {t('confirmBookingConfirm')}
      {/if}
    </Button>
  </div>
</Modal>

{#if store.isTable}
  <Modal
    bind:open={showTBLReminderModal}
    title={t('tblReminderTitle')}
    onClose={() => (showTBLReminderModal = false)}
  >
    <p class="confirm-modal-text">{t('tblReminderText')}</p>
    <div style="display:flex;gap:10px;margin-top:1rem">
      <Button
        variant="primary"
        size="lg"
        style="flex:1"
        onclick={() => {
          showTBLReminderModal = false;
        }}
      >
        ✓ {t('tblReminderOk')}
      </Button>
    </div>
  </Modal>
{/if}
