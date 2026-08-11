<script lang="ts">
  import { booking, RESTRICTED_STATUS } from '../../lib/store/booking.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import Button from '../ui/Button.svelte';
</script>

<div>
  <div class="prisoner-search">
    <label class="prisoner-search-label" for="prisonerSearch">
      {t('prisonerInfo')} <span class="text-crimson">*</span>
      <span class="prisoner-search-hint">({t('extraVisitorSub')})</span>
    </label>

    <div class="prisoner-search-input-wrap">
      <input
        id="prisonerSearch"
        type="text"
        placeholder="พิมพ์เลขผู้ต้องขัง หรือ ชื่อ-นามสกุล..."
        bind:value={booking.search}
        oninput={() => booking.onSearchInput()}
        onfocus={() => {
          if (booking.search) booking.filterSuggestions();
        }}
        onblur={() => setTimeout(() => booking.hideSuggestions(), 150)}
        class="prisoner-search-input"
        aria-invalid={booking.errors.prisonerSearch ? 'true' : undefined}
      />
      {#if booking.showSuggestions && booking.suggestions.length > 0}
        <div class="suggestions-dropdown" role="listbox">
          {#each booking.suggestions as p (p.prisonerId)}
            <div
              class="suggestion-item"
              role="option"
              tabindex="-1"
              aria-selected="false"
              onmousedown={(e) => {
                e.preventDefault();
                booking.selectPrisoner(p);
              }}
            >
              <div class="suggestion-main">
                <strong>{booking.maskName(p.prisonerName)}</strong>
              </div>
              <div class="suggestion-meta">
                #{p.prisonerId}<br />
                <span class="suggestion-wing">{p.wing || ''}</span>
                {#if p.status}
                  <br />
                  <span
                    class="suggestion-badge {p.status === RESTRICTED_STATUS
                      ? 'badge-restricted'
                      : 'badge-normal'}"
                  >
                    {p.status}
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if booking.prisonerLoadState === 'loading'}
      <div class="prisoner-load-status">{booking.prisonerLoadMsg}</div>
    {:else if booking.prisonerLoadState === 'error'}
      <div class="prisoner-load-status load-error">
        <span>{booking.prisonerLoadMsg}</span>
        <Button
          size="sm"
          variant="ghost"
          onclick={() => {
            booking.prisonerLoadMsg = '⏳ กำลังโหลดรายชื่อผู้ต้องขังจากฐานข้อมูล...';
            booking.prisonerLoadState = 'loading';
            void booking.loadPrisonerMaster();
          }}
        >
          ลองใหม่
        </Button>
      </div>
    {:else}
      <div class="prisoner-load-status load-ok">{booking.prisonerLoadMsg}</div>
    {/if}

    {#if booking.errors.prisonerSearch}
      <div class="error-text">{booking.errors.prisonerSearch}</div>
    {/if}
  </div>

  {#if booking.prisoner}
    <div class="selected-prisoner-display">
      <div class="selected-prisoner-check">
        {t('prisonerInfoConfirm')}
        <button
          type="button"
          class="selected-prisoner-clear"
          onclick={() => booking.clearPrisoner()}
          aria-label="ยกเลิกการเลือกผู้ต้องขัง"
        >
          ✕
        </button>
      </div>
      <div class="selected-prisoner-name">{booking.maskName(booking.prisoner.prisonerName)}</div>
      <div class="selected-prisoner-id">
        {t('idLabel')}: <span class="mono">{booking.prisoner.prisonerId}</span> &nbsp;·&nbsp;
        <span class="selected-prisoner-wing">{booking.prisoner.wing || ''}</span>
      </div>
      {#if booking.prisoner.status}
        <div
          class="selected-prisoner-status {booking.prisoner.status === RESTRICTED_STATUS
            ? 'text-crimson'
            : ''}"
        >
          {booking.prisoner.status}
        </div>
      {/if}
    </div>
  {/if}

  <div class="prisoner-hint">
    {t('extraVisitorSub')} — ค้นหาแล้วคลิกเลือกจากรายการด้านบน — ชื่อ + เลข + แดน จะแสดงอัตโนมัติ
    (ไม่ต้องพิมเอง)
  </div>
</div>
