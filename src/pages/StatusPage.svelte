<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Search from '@lucide/svelte/icons/search';
  import SearchX from '@lucide/svelte/icons/search-x';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import { t, tc } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';
  import { lookupByRef } from '../lib/api/endpoints';
  import type { PublicReservation } from '../lib/api/types';
  import { parseExtraPrisoners, pickBooking } from '../lib/utils/status';
  import { escHtml, maskPrisonerName } from '../lib/utils/helpers';
  import { safeGetItem, safeRemoveItem } from '../lib/utils/storage';
  import StatusResult from '../components/status/StatusResult.svelte';

  type View = 'idle' | 'result' | 'notfound' | 'error';

  // One field for both lookups, as on the home page: a reference starts with
  // VIS- or TBL-, anything else is a prisoner ID.
  const isRef = (q: string) => /^(VIS|TBL)-/i.test(q);

  let query = $state('');
  let input = $state<HTMLInputElement | null>(null);
  let view = $state<View>('idle');
  let searching = $state(false);
  let progressMsg = $state('');
  let found = $state<PublicReservation | null>(null);
  let notFoundQuery = $state('');
  let errorMsg = $state('');
  let showThankYou = $state(false);
  let autoPay = $state(false);
  let paymentReady = $state(false);
  let searchCount = 0;

  const thankYouCount = $derived(parseInt(String(found?.visitorCount)) || 1);
  const thankYouIsTable = $derived(
    String(found?.bookingType || '').trim().toLowerCase() === 'table' ||
      String(found?.ref || '').toUpperCase().startsWith('TBL-'),
  );
  const thankYouCoPrisoners = $derived(thankYouIsTable ? [] : parseExtraPrisoners(found?.extraPrisoners));
  const thankYouPrisoners = $derived(thankYouIsTable ? 0 : 1 + thankYouCoPrisoners.length);
  const thankYouTotal = $derived(
    parseInt(String(found?.total)) || (thankYouCount + thankYouPrisoners) * 1000,
  );

  onMount(() => {
    // A push notification opens #/status?ref=… in a fresh tab, with no session.
    const linkRef = new URLSearchParams(window.location.hash.split('?')[1] || '').get('ref');
    if (linkRef) {
      autoPay = new URLSearchParams(window.location.hash.split('?')[1] || '').get('pay') === '1';
      query = linkRef;
      void doSearch();
      return;
    }
    const lastRef = safeGetItem(sessionStorage, 'lastRef');
    query = lastRef || safeGetItem(sessionStorage, 'lastPrisonerId') || '';
    // Arriving from the home page's status box: the visitor already searched once.
    if (lastRef && safeGetItem(sessionStorage, 'statusAutoSearch')) {
      safeRemoveItem(sessionStorage, 'statusAutoSearch');
      void doSearch();
    }
  });

  function classifyError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (/Failed to fetch|NetworkError|abort|AbortError/i.test(msg)) return t('errorConn');
    if (/HTTP [45]/i.test(msg)) return t('errorServer');
    return tc('errorGeneric', { msg });
  }

  async function doSearch(): Promise<void> {
    const raw = query.trim();
    if (!raw || searching) return;
    const mode = isRef(raw) ? 'ref' : 'prisoner';
    const value = mode === 'ref' ? raw.toUpperCase() : raw;
    searching = true;
    paymentReady = false;
    view = 'idle';
    showThankYou = false;
    searchCount = 0;
    progressMsg = t('searching');

    const maxRetries = 2;
    while (searchCount <= maxRetries) {
      if (searchCount > 0) {
        progressMsg = tc('retryingSearch', { n: searchCount, max: maxRetries });
      }
      try {
        const rows = await lookupByRef(mode === 'ref' ? { ref: value } : { prisonerId: value });
        const match = pickBooking(rows, value, mode);
        if (match) {
          found = match;
          view = 'result';
        } else {
          notFoundQuery = value;
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

  async function resetSearch(): Promise<void> {
    autoPay = false;
    query = '';
    view = 'idle';
    found = null;
    showThankYou = false;
    window.scrollTo(0, 0);
    await tick();
    input?.focus();
  }
</script>

<div class="home-book book-paper">
  <header class="ct-black">
    <div class="mx-auto w-full max-w-3xl px-4 pb-20 pt-5 sm:px-6 sm:pb-24">
      <button type="button" class="ct-link text-sm" onclick={() => navigate('home')}>
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {t('backHome')}
      </button>
      <p class="ct-label mt-10 flex sm:mt-14">{t('statusSearch')}</p>
      <h1 class="mt-4 text-balance text-[clamp(2.1rem,1.5rem+2.6vw,3.25rem)] font-medium leading-[1.15] tracking-[-0.01em]">
        {t('statusH1')}
      </h1>
      <p class="mt-3 max-w-xl text-base font-light leading-relaxed text-text-secondary">{t('statusP')}</p>
    </div>
  </header>

  <div class="mx-auto -mt-9 w-full max-w-3xl px-4 pb-20 sm:px-6">
    <form
      class="search flex items-center gap-2 rounded-full p-1.5 pl-5"
      role="search"
      onsubmit={(e) => {
        e.preventDefault();
        void doSearch();
      }}
    >
      <Search class="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden="true" />
      <label for="status-query" class="sr-only">{t('statusP')}</label>
      <input
        id="status-query"
        bind:this={input}
        bind:value={query}
        class="min-w-0 flex-1 bg-transparent py-3 text-base text-text-primary outline-none placeholder:text-text-tertiary"
        placeholder={t('homeStatusPlaceholder')}
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
      />
      <button type="submit" class="ct-btn ct-btn-ink shrink-0 px-5" disabled={!query.trim() || searching}>
        {#if searching}
          <span class="spin h-4 w-4 rounded-full border-2 border-white/35 border-t-white" aria-hidden="true"></span>
        {/if}
        {t('checkStatus')}
      </button>
    </form>

    <div class="mt-8" aria-live="polite" aria-busy={searching}>
      {#if searching}
        <p class="px-2 text-sm text-text-secondary">{progressMsg}</p>
      {:else if view === 'idle' && !showThankYou}
        <!-- Before a search: the road every visit booking takes, so the result reads at a glance. -->
        <section class="px-1" aria-labelledby="status-road">
          <p id="status-road" class="ct-label flex">{t('statusProgress')}</p>
          <ol class="mt-5 grid gap-4 sm:grid-cols-5 sm:gap-3">
            {#each ['stepParticipants', 'stepDiscipline', 'stepPayment', 'stepSlip', 'stepReady'] as key, i (key)}
              <li class="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                <span class="road-num">{i + 1}</span>
                <span class="text-sm text-text-secondary">{t(key)}</span>
              </li>
            {/each}
          </ol>
        </section>
      {:else if showThankYou && found}
        <article class="panel px-5 py-8 text-center sm:px-10" in:fly={{ y: 12, duration: 280 }}>
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9f6ef] text-[#1f6b45]">
            <CircleCheck class="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 class="mt-4 text-2xl font-medium text-text-primary">{t('successPage')}</h2>
          <p class="mt-2 text-sm text-text-secondary">{t('successPageSub')}</p>

          <p class="mt-6 text-xs font-medium tracking-[0.06em] text-text-tertiary">{t('refLabel')}</p>
          <p class="mt-1 font-mono text-3xl font-semibold tracking-wide text-text-primary">{found.ref}</p>

          <dl class="mx-auto mt-6 grid max-w-md gap-3 border-t border-border-subtle pt-6 text-left text-sm">
            <div class="row"><dt>{t('lblVisitor')}</dt><dd>{found.visitorName || '—'}</dd></div>
            {#if !thankYouIsTable}
              <div class="row">
                <dt>{t('lblPrisoner')}</dt>
                <dd>{maskPrisonerName(found.prisonerName) || '—'} · {found.wing || '—'}</dd>
              </div>
              {#each thankYouCoPrisoners as p (p.id)}
                <div class="row"><dt>{t('lblCoPrisoner')}</dt><dd>{maskPrisonerName(p.name) || '—'} · {p.wing || '—'}</dd></div>
              {/each}
            {/if}
            <div class="row"><dt>{t('lblVisitDate')}</dt><dd>{found.visitDate || '—'}</dd></div>
            <div class="row">
              <dt>{t('lblCount')}</dt>
              <dd>
                {thankYouIsTable
                  ? tc('countFormatTable', { n: thankYouCount })
                  : tc('countFormat', { n: thankYouCount, p: thankYouPrisoners, total: thankYouCount + thankYouPrisoners })}
              </dd>
            </div>
            <div class="row"><dt>{t('lblCost')}</dt><dd>{thankYouTotal.toLocaleString()} บาท</dd></div>
          </dl>

          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" class="ct-btn ct-btn-line" onclick={() => void resetSearch()}>{t('searchAgain')}</button>
            <button type="button" class="ct-btn ct-btn-ink" onclick={() => navigate('home')}>{t('backHomeShort')}</button>
          </div>
        </article>
      {:else if view === 'result' && found}
        {#key found.ref}
          <div in:fly|global={{ y: 12, duration: 280 }} onintroend={() => paymentReady = true}>
            <StatusResult
              booking={found}
              autoPay={autoPay && paymentReady}
              onpaid={() => {
                showThankYou = true;
                window.scrollTo(0, 0);
              }}
              onsearchagain={() => void resetSearch()}
            />
          </div>
        {/key}
      {:else if view === 'notfound'}
        <article class="panel px-5 py-10 text-center sm:px-10" in:fly={{ y: 12, duration: 280 }}>
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-background-subtle text-text-secondary">
            <SearchX class="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 class="mt-4 text-xl font-medium text-text-primary">{t('notFoundTitle')}</h2>
          <p class="mt-2 text-sm leading-relaxed text-text-secondary">{@html tc('notFoundText', { query: escHtml(notFoundQuery) })}</p>
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" class="ct-btn ct-btn-line" onclick={() => void resetSearch()}>{t('searchAgain')}</button>
            <button type="button" class="ct-btn ct-btn-ink" onclick={() => navigate('booking')}>{t('bookNew')}</button>
          </div>
        </article>
      {:else if view === 'error'}
        <article class="panel px-5 py-10 text-center sm:px-10" in:fly={{ y: 12, duration: 280 }}>
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fcecec] text-[#a12d2d]">
            <CircleAlert class="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 class="mt-4 text-xl font-medium text-text-primary">{t('errorTitle')}</h2>
          <p class="mt-2 text-sm leading-relaxed text-text-secondary">{errorMsg}</p>
          <button type="button" class="ct-btn ct-btn-ink mt-6" onclick={() => void doSearch()}>{t('retryBtn')}</button>
        </article>
      {/if}
    </div>
  </div>
</div>

<style>
  .search {
    background: var(--surface);
    border: 1px solid var(--app-border-strong);
    box-shadow: 0 24px 40px -30px rgba(35, 31, 32, 0.6);
    transition:
      border-color 160ms var(--ct-ease),
      box-shadow 160ms var(--ct-ease);
  }
  .search:focus-within {
    border-color: var(--ct-ink);
    box-shadow:
      0 0 0 3px rgba(245, 130, 31, 0.28),
      0 24px 40px -30px rgba(35, 31, 32, 0.6);
  }
  .panel {
    background: var(--surface);
    border: 1px solid var(--app-border-subtle);
    border-radius: 8px;
    box-shadow: 0 30px 50px -40px rgba(35, 31, 32, 0.55);
  }
  .road-num {
    display: grid;
    flex: none;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    border: 1.5px solid var(--app-border-strong);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--app-text);
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
  .row dt {
    color: var(--app-text-tertiary);
  }
  .row dd {
    color: var(--app-text);
    text-align: right;
  }
  .spin {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .spin {
      animation-duration: 2.4s;
    }
  }
</style>
