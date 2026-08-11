<script lang="ts">
  import { booking } from '../../lib/store/booking.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { toThaiLong } from '../../lib/utils/date';

  function parseLocal(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
</script>

<div class="calendar-wrap">
  <div class="cal-header">
    <button type="button" class="cal-nav" onclick={() => booking.changeMonth(-1)} aria-label="เดือนก่อนหน้า">
      &#8249;
    </button>
    <span class="cal-title">{booking.calTitle}</span>
    <button type="button" class="cal-nav" onclick={() => booking.changeMonth(1)} aria-label="เดือนถัดไป">
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
    {#each booking.cells as cell, i (i)}
      {#if cell.kind === 'outside'}
        <div></div>
      {:else}
        <div
          class="day-btn {cell.kind} {cell.kind === 'selected' ? 'selected' : ''}"
          onclick={() => booking.selectDate(cell.date, cell.blocked)}
          role="button"
          tabindex={cell.blocked ? -1 : 0}
          aria-disabled={cell.blocked}
          aria-label={cell.date || undefined}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              booking.selectDate(cell.date, cell.blocked);
            }
          }}
        >
          {cell.day}
          {#if !cell.blocked && cell.kind !== 'selected'}
            <span class="quota">{cell.quota}/20</span>
          {/if}
          {#if cell.label}
            <span class="hol-label">{cell.label}</span>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  {#if booking.selectedDate}
    <div class="selected-date-display">
      เลือก: {toThaiLong(parseLocal(booking.selectedDate))}
    </div>
  {/if}

  <div class="quota-info">
    <span><span class="quota-dot" style="background:var(--blue)"></span><span>{t('quotaAvailable')}</span></span>
    <span><span class="quota-dot" style="background:var(--red)"></span><span>{t('quotaFull')}</span></span>
    <span><span class="quota-dot" style="background:var(--gray-200)"></span><span>{t('quotaPast')}</span></span>
    <span><span class="quota-dot" style="background:#fca5a5"></span><span>{t('quotaHoliday')}</span></span>
  </div>

  {#if booking.countsState === 'loading'}
    <div class="counts-status">กำลังโหลดข้อมูลการจอง...</div>
  {:else if booking.countsState === 'error'}
    <div class="counts-status counts-error">
      <span>{booking.countsMsg}</span>
      <button type="button" class="counts-retry" onclick={() => void booking.loadBookingCounts()}>
        ลองใหม่
      </button>
    </div>
  {/if}
</div>
