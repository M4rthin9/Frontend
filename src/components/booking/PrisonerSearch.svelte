<script lang="ts">
  import {
    booking as defaultBooking,
    RESTRICTED_STATUS,
    type BookingStore,
  } from '../../lib/store/booking.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import Button from '../ui/Button.svelte';

  // The page decides which flow this belongs to; defaults to the prisoner-visit
  // store so existing usages keep working unchanged.
  let { store = defaultBooking }: { store?: BookingStore } = $props();
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
        bind:value={store.search}
        oninput={() => store.onSearchInput()}
        onfocus={() => {
          if (store.search) store.filterSuggestions();
        }}
        onblur={() => setTimeout(() => store.hideSuggestions(), 150)}
        class="prisoner-search-input"
        aria-invalid={store.errors.prisonerSearch ? 'true' : undefined}
      />
      {#if store.showSuggestions && store.suggestions.length > 0}
        <div class="suggestions-dropdown" role="listbox">
          {#each store.suggestions as p (p.prisonerId)}
            <div
              class="suggestion-item"
              role="option"
              tabindex="-1"
              aria-selected="false"
              onmousedown={(e) => {
                e.preventDefault();
                store.selectPrisoner(p);
              }}
            >
              <div class="suggestion-main">
                <strong>{store.maskName(p.prisonerName)}</strong>
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

    {#if store.prisonerLoadState === 'loading'}
      <div class="prisoner-load-status">{store.prisonerLoadMsg}</div>
    {:else if store.prisonerLoadState === 'error'}
      <div class="prisoner-load-status load-error">
        <span>{store.prisonerLoadMsg}</span>
        <Button
          size="sm"
          variant="ghost"
          onclick={() => {
            store.prisonerLoadMsg = '⏳ กำลังโหลดรายชื่อผู้ต้องขังจากฐานข้อมูล...';
            store.prisonerLoadState = 'loading';
            void store.loadPrisonerMaster();
          }}
        >
          ลองใหม่
        </Button>
      </div>
    {:else}
      <div class="prisoner-load-status load-ok">{store.prisonerLoadMsg}</div>
    {/if}

    {#if store.errors.prisonerSearch}
      <div class="error-text">{store.errors.prisonerSearch}</div>
    {/if}
  </div>

  {#if store.prisoner}
    <div class="selected-prisoner-display">
      <div class="selected-prisoner-check">
        {t('prisonerInfoConfirm')}
        <button
          type="button"
          class="selected-prisoner-clear"
          onclick={() => store.clearPrisoner()}
          aria-label="ยกเลิกการเลือกผู้ต้องขัง"
        >
          ✕
        </button>
      </div>
      <div class="selected-prisoner-name">{store.maskName(store.prisoner.prisonerName)}</div>
      <div class="selected-prisoner-id">
        {t('idLabel')}: <span class="mono">{store.prisoner.prisonerId}</span> &nbsp;·&nbsp;
        <span class="selected-prisoner-wing">{store.prisoner.wing || ''}</span>
      </div>
      {#if store.prisoner.status}
        <div
          class="selected-prisoner-status {store.prisoner.status === RESTRICTED_STATUS
            ? 'text-crimson'
            : ''}"
        >
          {store.prisoner.status}
        </div>
      {/if}
    </div>
  {/if}

  <div class="prisoner-hint">
    {t('extraVisitorSub')} — ค้นหาแล้วคลิกเลือกจากรายการด้านบน — ชื่อ + เลข + แดน จะแสดงอัตโนมัติ
    (ไม่ต้องพิมเอง)
  </div>
</div>
