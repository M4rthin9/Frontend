<script lang="ts">
  import { booking as defaultBooking, type BookingStore } from '../../lib/store/booking.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import Button from '../ui/Button.svelte';

  // The page decides which flow this belongs to; defaults to the prisoner-visit
  // store so existing usages keep working unchanged.
  let { store = defaultBooking }: { store?: BookingStore } = $props();

  const success = $derived(store.success);
</script>

<div>
  {#if success}
    <div class="success-page">
      <div class="success-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        ><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <h2 style="font-size:22px;font-weight:700;margin-bottom:6px">{t('successTitle')}</h2>
      <p style="font-size:14px;color:var(--text-secondary);margin-bottom:1rem">{t('successSub')}</p>

      <div class="status-pill status-pending">
        <span>{t('bookingInitialStatus')}</span>
      </div>

      <div class="ref-box">
        <div class="ref-label">{t('refLabel')}</div>
        <span>{success.ref}</span>
      </div>
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:1.5rem">{t('saveRef')}</p>

      <div class="booking-details">
        <div style="text-align:center;margin-bottom:8px">
          <strong style="color:var(--blue)">ส่งคำขอเรียบร้อย — Ref: {success.ref}</strong>
        </div>
        <div class="detail-row">
          <span class="detail-label">วันที่เข้าร่วม</span>
          <span class="detail-value">{success.visitDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">จำนวนผู้เข้าร่วม</span>
          <span class="detail-value">
            {#if store.isTable}
              {success.totalPersons} คน
            {:else}
              ญาติ {success.visitorCount} คน + ผู้ต้องขัง 1 คน = {success.totalPersons} คน
            {/if}
          </span>
        </div>
        {#if !store.isTable}
          <div class="detail-row">
            <span class="detail-label">ชื่อผู้ต้องขัง</span>
            <span class="detail-value">{success.prisonerName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">เลขประจำตัวผู้ต้องขัง</span>
            <span class="detail-value">{success.prisonerId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">แดนของผู้ต้องขัง</span>
            <span class="detail-value">{success.wing}</span>
          </div>
        {/if}
        <div class="detail-row">
          <span class="detail-label">ชื่อผู้จอง</span>
          <span class="detail-value">{success.visitorName}</span>
        </div>
        {#if success.extras.length > 0}
          <div class="detail-row">
            <span class="detail-label">รายชื่อผู้เข้าร่วมเพิ่มเติม</span>
            <span class="detail-value" style="line-height:1.8">
              {#each success.extras as v, i (v.name + i)}
                <div>{i + 2}. {v.name} ({v.relation})</div>
              {/each}
            </span>
          </div>
        {/if}
      </div>

      <div style="font-size:11px;color:var(--app-text-tertiary);text-align:center;margin-top:12px">
        ใช้ปุ่ม "ตรวจสอบสถานะ" เพื่อติดตาม หรือคัดลอก Ref ด้านบน
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:1rem">
        <Button
          variant="primary"
          size="lg"
          style="flex:1;min-width:180px"
          onclick={() => navigate('status')}
        >
          {t('checkStatusBtn')}
        </Button>
        <Button variant="secondary" size="lg" style="flex:0.6;min-width:130px" onclick={() => void store.copyRef()}>
          {store.copied ? 'คัดลอกแล้ว' : t('copyRef')}
        </Button>
      </div>

      <div style="margin-top:10px;display:flex">
        <Button variant="secondary" size="lg" style="flex:1" onclick={() => store.resetAll()}>
          {t('newBooking')}
        </Button>
      </div>
    </div>
  {/if}
</div>
