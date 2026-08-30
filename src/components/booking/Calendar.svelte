<script lang="ts">
  import { booking as defaultBooking, type BookingStore } from '../../lib/store/booking.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { toThaiLong } from '../../lib/utils/date';

  // The page decides which flow this belongs to; defaults to the prisoner-visit
  // store so existing usages keep working unchanged.
  let { store = defaultBooking }: { store?: BookingStore } = $props();

  function parseLocal(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
</script>

<div class="calendar-wrap">
  <div class="cal-header">
    <button type="button" class="cal-nav" onclick={() => store.changeMonth(-1)} aria-label="เดือนก่อนหน้า">
      &#8249;
    </button>
    <span class="cal-title">{store.calTitle}</span>
    <button type="button" class="cal-nav" onclick={() => store.changeMonth(1)} aria-label="เดือนถัดไป">
      &#8250;
    </button>
  </div>

  <div class="day-names">
    <div class="day-name">อา</div>
    <div class="day-name">จ</div>
    <div class="day-name">อ</div>
    <div class="day-name">พ</div>
    <div class="day-name">พฤ</div>
    <div class="day-name">ศ</div>
    <div class="day-name">ส</div>
  </div>

  <div class="date-grid">
    {#each store.cells as cell, i (i)}
      {#if cell.kind === 'outside'}
        <div></div>
      {:else}
        <div
          class="day-btn {cell.kind} {cell.kind === 'selected' ? 'selected' : ''}"
          onclick={() => store.selectDate(cell.date, cell.blocked)}
          role="button"
          tabindex={cell.blocked ? -1 : 0}
          aria-disabled={cell.blocked}
          aria-label={cell.date || undefined}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              store.selectDate(cell.date, cell.blocked);
            }
          }}
        >
          {cell.day}
          {#if !cell.blocked && cell.kind !== 'selected'}
            <span class="quota">{cell.quota}/{store.perDay}</span>
          {/if}
          {#if cell.label}
            <span class="hol-label">{cell.label}</span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  {#if store.selectedDate}
    <div class="selected-date-display">
      เลือก: {toThaiLong(parseLocal(store.selectedDate))}
    </div>
  {/if}

  <div class="quota-info">
    <span><span class="quota-dot" style="background:var(--blue)"></span><span>{t('quotaAvailable')}</span></span>
    <span><span class="quota-dot" style="background:var(--red)"></span><span>{t('quotaFull')} ({store.perDay}/{store.perDay})</span></span>
    <span><span class="quota-dot" style="background:var(--gray-200)"></span><span>{t('quotaPast')}</span></span>
    <span><span class="quota-dot" style="background:#fca5a5"></span><span>{t('quotaHoliday')}</span></span>
  </div>

  {#if store.countsState === 'loading'}
    <div class="counts-status">กำลังโหลดข้อมูลการจอง...</div>
  {:else if store.countsState === 'error'}
    <div class="counts-status counts-error">
      <span>{store.countsMsg}</span>
      <button type="button" class="counts-retry" onclick={() => void store.loadBookingCounts()}>
        ลองใหม่
      </button>
    </div>
  {/if}
</div>
