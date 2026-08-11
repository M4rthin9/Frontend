<script lang="ts">
  import { onMount } from 'svelte';
  import { booking, CHILD_RELATIONS } from '../../lib/store/booking.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import Button from '../ui/Button.svelte';
  import Spinner from '../ui/Spinner.svelte';

  let turnstileEl: HTMLDivElement;
  let copiedSummary = $state(false);

  onMount(() => {
    booking.turnstileError = '';
    void booking.setupTurnstile(turnstileEl);
  });

  const data = $derived(booking.confirmData);
  const cost = $derived(booking.cost);
  const n = $derived(booking.visitorCount);
  const totalPersons = $derived(data?.totalPersons ?? 0);
  const thDate = $derived(data?.visitDate ?? '');

  const extrasList = $derived(
    booking.extras.length > 0
      ? booking.extras.map((v) => ({
          name: v.name,
          relation: v.relation,
          ageNote: CHILD_RELATIONS.includes(v.relation) && v.age ? ` (อายุ ${v.age} ปี)` : '',
        }))
      : []
  );

  async function copySummary(): Promise<void> {
    if (!data) return;
    const cleanText = [
      'การจองกิจกรรม Chance & Change Cafe',
      `วันที่: ${thDate}`,
      `ผู้จอง: ${booking.visitorName.trim()} (${booking.visitorPhone.trim()})`,
      `จำนวน: ${totalPersons} คน`,
      `ผู้ต้องขัง: ${data.prisonerName} (#${data.prisonerId})`,
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
    <div class="confirm-hero">
      <div class="confirm-hero-date">
        วันที่เข้าร่วม
      </div>
      <div class="confirm-hero-main">{thDate}</div>
      <div class="confirm-hero-meta">
        {totalPersons} คน (รวมผู้ต้องขัง) &nbsp;•&nbsp; <strong>{cost.total.toLocaleString()} บาท</strong>
      </div>
    </div>

    <div class="review-grid">
      <div class="review-section">
        <div class="review-label">ผู้จองหลัก (ผู้ติดต่อ)</div>
        <div class="review-value">{booking.visitorName.trim()}</div>
        <div class="review-sub">{booking.visitorPhone.trim()} • {booking.relation}</div>
      </div>

      <div class="review-section">
        <div class="review-label">ผู้เข้าร่วมกิจกรรมทั้งหมด ({n} คน)</div>
        <div class="review-value review-list">
          1. {booking.visitorName.trim()} (ผู้จอง)
          {#if extrasList.length > 0}
            {#each extrasList as v, i (i)}
              <div>• {v.name} — {v.relation}{v.ageNote}</div>
            {/each}
          {:else}
            <div class="review-none">ไม่มีผู้เข้าร่วมเพิ่มเติม</div>
          {/if}
        </div>
      </div>

      <div class="review-section">
        <div class="review-label">ผู้ต้องขังที่เข้าร่วม</div>
        <div class="review-value">{data.prisonerName}</div>
        <div class="review-sub">#{data.prisonerId} • แดน {data.wing}</div>
      </div>

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
    <strong>{t('afterSubmit')}:</strong> <span>{t('afterSubmitText')}</span><br />
    <strong>{t('checkStatusInfo')}:</strong> <span>{t('checkStatusInfoText')}</span><br />
    <strong>{t('paymentInfo')}:</strong> <span>{t('paymentInfoText')}</span><br />
    <strong>{t('vinaiInfo')}:</strong> <span>{t('vinaiInfoText')}</span>
  </div>

   <div class="turnstile-wrap" style="margin-bottom:1rem">
     {#if booking.turnstileError}
       <div class="error-text-inline" style="white-space:pre-line">
        ⚠️ ระบบตรวจสอบความปลอดภัย (Turnstile) ไม่สามารถโหลดได้ — กรุณาตรวจสอบว่าอยู่ในหน้าต่างที่อนุญาตแล้วลองใหม่อีกครั้ง
       </div>
     {:else if !booking.turnstileToken}
       <div class="text-xs text-text-tertiary text-center py-2">
         กำลังโหลดระบบตรวจสอบความปลอดภัย...
       </div>
     {/if}
     <div bind:this={turnstileEl}></div>
   </div>

  {#if booking.inlineError}
    <div class="error-text-inline" style="white-space:pre-line">{booking.inlineError}</div>
  {/if}

  <div style="display:flex;gap:10px;margin-bottom:1rem">
    <Button variant="secondary" size="lg" style="flex:0.45" onclick={() => booking.goBack()}>
      ← {t('editBtn')}
    </Button>
    <Button
      variant="primary"
      size="lg"
      style="flex:1"
      disabled={booking.submitting}
      onclick={() => void booking.submit()}
    >
      {#if booking.submitting}
        <Spinner size="sm" />
      {:else}
        {t('submitBtn')}
      {/if}
    </Button>
  </div>
</div>
