<script lang="ts">
  import { onMount } from 'svelte';
  import { t, tc } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';
  import { ui } from '../lib/store/ui.svelte';
  import { lookupByRef } from '../lib/api/endpoints';
  import type { PublicReservation } from '../lib/api/types';
  import { pickBooking } from '../lib/utils/status';
  import { escHtml, maskPrisonerName } from '../lib/utils/helpers';
  import { safeGetItem } from '../lib/utils/storage';
  import StatusResult from '../components/status/StatusResult.svelte';
  import Search from '@lucide/svelte/icons/search';
  import FileText from '@lucide/svelte/icons/file-text';
  import User from '@lucide/svelte/icons/user';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import EmptySearchIllustration from '../components/illustrations/EmptySearchIllustration.svelte';
  import ErrorIllustration from '../components/illustrations/ErrorIllustration.svelte';

  type Mode = 'ref' | 'prisoner';
  type View = 'idle' | 'result' | 'notfound' | 'error';

  let mode = $state<Mode>('ref');
  let refQuery = $state('');
  let prisonerQuery = $state('');
  let view = $state<View>('idle');
  let searching = $state(false);
  let overlayMsg = $state('');
  let found = $state<PublicReservation | null>(null);
  let notFoundQuery = $state('');
  let errorMsg = $state('');
  let showThankYou = $state(false);
  let searchCount = 0;

  const thankYouCount = $derived(parseInt(String(found?.visitorCount)) || 1);
  const thankYouIsTable = $derived(
    String(found?.bookingType || '').trim().toLowerCase() === 'table' ||
      String(found?.ref || '').toUpperCase().startsWith('TBL-'),
  );
  const thankYouTotal = $derived(
    parseInt(String(found?.total)) || (thankYouIsTable ? thankYouCount : thankYouCount + 1) * 1000,
  );

  onMount(() => {
    const lastRef = safeGetItem(sessionStorage, 'lastRef');
    const lastPId = safeGetItem(sessionStorage, 'lastPrisonerId');
    if (lastRef) {
      mode = 'ref';
      refQuery = lastRef;
    } else if (lastPId) {
      mode = 'prisoner';
      prisonerQuery = lastPId;
    }
  });

  function switchMode(next: Mode): void {
    mode = next;
  }

  function classifyError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (/Failed to fetch|NetworkError|abort|AbortError/i.test(msg)) return t('errorConn');
    if (/HTTP [45]/i.test(msg)) return t('errorServer');
    return tc('errorGeneric', { msg });
  }

  function currentQuery(): string {
    return mode === 'ref' ? refQuery.trim().toUpperCase() : prisonerQuery.trim();
  }

  function validate(): boolean {
    if (mode === 'ref' && !refQuery.trim()) {
      ui.showToast(t('searchEmptyRef'), 'warning');
      return false;
    }
    if (mode === 'prisoner' && !prisonerQuery.trim()) {
      ui.showToast(t('searchEmptyPrisoner'), 'warning');
      return false;
    }
    return true;
  }

  async function doSearch(): Promise<void> {
    if (!validate()) return;
    const query = currentQuery();
    searching = true;
    view = 'idle';
    showThankYou = false;
    searchCount = 0;
    overlayMsg = t('searching');

    const maxRetries = 2;
    while (searchCount <= maxRetries) {
      if (searchCount > 0) {
        overlayMsg = tc('retryingSearch', { n: searchCount, max: maxRetries });
      }
      try {
        const rows = await lookupByRef(mode === 'ref' ? { ref: query } : { prisonerId: query });
        const match = pickBooking(rows, query, mode);
        if (match) {
          found = match;
          view = 'result';
        } else {
          notFoundQuery = query;
          view = 'notfound';
        }
        break;
      } catch (err) {
        console.error('Lookup error (attempt ' + (searchCount + 1) + '):', err);
        searchCount++;
        if (searchCount > maxRetries) {
          errorMsg = classifyError(err);
          view = 'error';
          break;
        }
      }
    }
    searching = false;
  }

  function resetSearch(): void {
    refQuery = '';
    prisonerQuery = '';
    view = 'idle';
    found = null;
    showThankYou = false;
    window.scrollTo(0, 0);
  }
</script>

<div class="booking-app status-app">
  <div class="status-hero">
    <button type="button" class="status-back" onclick={() => navigate('home')}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      {t('backHome')}
    </button>
    <div class="status-badge">
      <span class="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
      <span class="inline-flex items-center gap-1.5"><Search class="h-3.5 w-3.5" />{t('statusSearch')}</span>
    </div>
    <h1 class="status-h1" style="font-family: var(--font-display);">{t('statusH1')}</h1>
    <p class="status-sub">{t('statusP')}</p>
  </div>

  <div class="section status-search-section">
    <div class="section-title">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-700 border border-navy-100"><Search class="h-4 w-4" /></span>
      {t('statusSearch')}
    </div>

    <div class="status-tabs" role="tablist" aria-label={t('statusSearch')}>
      <button
        type="button"
        class="status-tab {mode === 'ref' ? 'active' : ''}"
        role="tab"
        aria-selected={mode === 'ref'}
        onclick={() => switchMode('ref')}
      >
        <FileText class="h-4 w-4" />
        {t('refTab')}
      </button>
      <button
        type="button"
        class="status-tab {mode === 'prisoner' ? 'active' : ''}"
        role="tab"
        aria-selected={mode === 'prisoner'}
        onclick={() => switchMode('prisoner')}
      >
        <User class="h-4 w-4" />
        {t('prisonerTab')}
      </button>
    </div>

    <div class="status-tab-panel mt-4">
      {#if mode === 'ref'}
        <label for="searchRef" class="status-label">{t('refLabelShort')}</label>
        <input
          id="searchRef"
          type="text"
          placeholder={t('statusRefPlaceholder')}
          style="text-transform:uppercase;letter-spacing:1px"
          bind:value={refQuery}
          onkeydown={(e) => {
            if (e.key === 'Enter') void doSearch();
          }}
        />
      {:else}
        <label for="searchPrisoner" class="status-label">{t('prisonerIdLabelShort')}</label>
        <input
          id="searchPrisoner"
          type="text"
          placeholder={t('statusPrisonerPlaceholder')}
          bind:value={prisonerQuery}
          onkeydown={(e) => {
            if (e.key === 'Enter') void doSearch();
          }}
        />
      {/if}
    </div>

    <div class="mt-4">
      <button type="button" class="btn-primary" disabled={searching} onclick={() => void doSearch()}>
        {#if searching}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        {:else}
          <Search class="h-4 w-4" />
        {/if}
        {t('checkStatus')}
      </button>
    </div>
  </div>

  {#if showThankYou && found}
    <div class="success-page status-thankyou">
      <div class="success-icon text-emerald-600"><CircleCheck class="h-10 w-10" /></div>
      <h2 class="text-xl font-bold text-text-primary mb-2">{t('successPage')}</h2>
      <p class="text-sm text-text-secondary mb-5">{t('successPageSub')}</p>

      <div class="ref-box">
        <div class="ref-label">{t('refLabel')}</div>
        <span>{found.ref}</span>
      </div>

      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">{t('resultRefLabel')}</span>
          <span class="detail-value">{found.ref}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('lblVisitor')}</span>
          <span class="detail-value">{found.visitorName || '—'}</span>
        </div>
        {#if !thankYouIsTable}
          <div class="detail-row">
            <span class="detail-label">{t('lblPrisoner')}</span>
            <span class="detail-value">{maskPrisonerName(found.prisonerName) || '—'} (#{found.prisonerId || '—'})</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{t('lblWing')}</span>
            <span class="detail-value">{found.wing || '—'}</span>
          </div>
        {/if}
        <div class="detail-row">
          <span class="detail-label">{t('lblVisitDate')}</span>
          <span class="detail-value">{found.visitDate || '—'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('lblCount')}</span>
          <span class="detail-value">{thankYouIsTable ? tc('countFormatTable', { n: thankYouCount }) : tc('countFormat', { n: thankYouCount, total: thankYouCount + 1 })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">{t('lblCost')}</span>
          <span class="detail-value">{thankYouTotal.toLocaleString()} บาท</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 justify-center mt-6">
        <button type="button" class="btn-secondary" style="flex:1;min-width:160px" onclick={() => resetSearch()}>
          {t('searchAgain')}
        </button>
        <button type="button" class="btn-primary" style="flex:1;min-width:160px" onclick={() => navigate('home')}>
          {t('backHomeShort')}
        </button>
      </div>
    </div>
  {:else if view === 'result' && found}
    <StatusResult
      booking={found}
      onpaid={() => {
        showThankYou = true;
        window.scrollTo(0, 0);
      }}
      onsearchagain={() => resetSearch()}
    />
  {:else if view === 'notfound'}
    <div class="not-found show">
      <div class="not-found-icon text-navy-300"><EmptySearchIllustration size={96} /></div>
      <h3>{t('notFoundTitle')}</h3>
      <p>{@html tc('notFoundText', { query: escHtml(notFoundQuery) })}</p>
      <button type="button" class="btn-primary" style="max-width:320px;margin:0 auto" onclick={() => navigate('booking')}>
        {t('bookNew')}
      </button>
    </div>
  {:else if view === 'error'}
    <div class="error-card">
      <div class="error-icon text-rose-300"><ErrorIllustration size={96} /></div>
      <div class="error-title">{t('errorTitle')}</div>
      <div class="error-message">{errorMsg}</div>
      <div class="mt-4 flex gap-2 justify-center">
        <button type="button" class="btn-primary" style="font-size:13px;width:auto;padding:var(--space-2) var(--space-4)" onclick={() => void doSearch()}>
          🔄 {t('retryBtn')}
        </button>
      </div>
    </div>
  {/if}

  {#if searching}
    <div class="overlay show">
      <div class="spinner"></div>
      <p>{overlayMsg}</p>
    </div>
  {/if}
</div>
