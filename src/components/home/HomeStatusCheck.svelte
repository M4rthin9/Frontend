<script lang="ts">
  import { fly } from 'svelte/transition';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Search from '@lucide/svelte/icons/search';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { lookupByRef } from '../../lib/api/endpoints';
  import type { PublicReservation } from '../../lib/api/types';
  import { normalizeStatus, pickBooking, statusPillLabel } from '../../lib/utils/status';
  import { formatDateIn } from '../../lib/utils/date';
  import { safeSetItem } from '../../lib/utils/storage';
  import Headline from './Headline.svelte';

  // One field for both lookups: a booking reference starts with VIS- or TBL-,
  // anything else is taken as a prisoner ID. Same API and the same booking
  // pick as the status page, so both always agree.
  let query = $state('');
  let phase = $state<'idle' | 'loading' | 'found' | 'notfound' | 'error'>('idle');
  let result = $state<PublicReservation | null>(null);
  let searched = $state('');

  const isRef = (q: string) => /^(VIS|TBL)-/i.test(q);

  async function search(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    const q = query.trim();
    if (!q || phase === 'loading') return;
    const mode = isRef(q) ? 'ref' : 'prisoner';
    const value = mode === 'ref' ? q.toUpperCase() : q;
    phase = 'loading';
    searched = value;
    try {
      const rows = await lookupByRef(mode === 'ref' ? { ref: value } : { prisonerId: value });
      result = pickBooking(rows, value, mode);
      phase = result ? 'found' : 'notfound';
    } catch {
      phase = 'error';
    }
  }

  /** Status labels in the dictionaries open with an emoji; the page uses a coloured dot instead. */
  const cleanLabel = (s: string | undefined) =>
    statusPillLabel(s).replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+—\s+/g, ' · ');

  function tone(s: string | undefined): string {
    switch (normalizeStatus(s)) {
      case 'ชำระแล้ว':
      case 'เสร็จสิ้น':
        return 'is-done';
      case 'รอชำระเงิน':
        return 'is-pay';
      case 'ยกเลิก':
      case 'ไม่อนุมัติ':
        return 'is-stop';
      default:
        return 'is-wait';
    }
  }

  function visitDate(r: PublicReservation): string {
    const iso = String(r.visitDateISO ?? '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(iso)
      ? formatDateIn(iso, i18n.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : String(r.visitDate ?? '');
  }

  /** Full details (payment, cancel, notes) live on the status page; open it already searched. */
  function openDetails(): void {
    if (!result) return;
    safeSetItem(sessionStorage, 'lastRef', result.ref);
    safeSetItem(sessionStorage, 'statusAutoSearch', '1');
    navigate('status');
  }
</script>

<section id="home-status" data-chapter="ctChStatus" class="bg-background-subtle py-20 sm:py-24" aria-labelledby="home-status-title">
  <div class="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
    <div>
      <p class="ct-label">{t('ctChStatus')}</p>
      <Headline id="home-status-title" text={t('ctStatusTitle')} class="ct-h2 mt-4" />
      <p class="mt-3 max-w-md text-base font-light leading-relaxed text-text-secondary">{t('homeStatusSub')}</p>
    </div>

    <div class="lg:pt-10">
      <form class="search flex items-center gap-2 rounded-full p-1.5 pl-5" onsubmit={search} role="search">
        <Search class="h-5 w-5 shrink-0 text-text-tertiary" aria-hidden="true" />
        <label for="home-status-query" class="sr-only">{t('statusP')}</label>
        <input
          id="home-status-query"
          bind:value={query}
          class="min-w-0 flex-1 bg-transparent py-2.5 text-base text-text-primary outline-none placeholder:text-text-tertiary"
          placeholder={t('homeStatusPlaceholder')}
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
        />
        <button type="submit" class="ct-btn ct-btn-ink shrink-0 px-5" disabled={!query.trim() || phase === 'loading'}>
          {phase === 'loading' ? t('searching') : t('checkStatus')}
        </button>
      </form>

      <div class="mt-5 min-h-[1rem]" aria-live="polite">
        {#if phase === 'found' && result}
          {#key result.ref}
            <article class="result p-5 sm:p-6" in:fly={{ y: 12, duration: 280 }}>
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-medium tracking-[0.06em] text-text-tertiary">{t('refLabel')}</p>
                  <p class="mt-1 font-mono text-lg font-semibold tracking-wide text-text-primary">{result.ref}</p>
                </div>
                <span class="pill {tone(result.status)} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium">
                  <span class="dot h-2 w-2 rounded-full" aria-hidden="true"></span>
                  {cleanLabel(result.status)}
                </span>
              </div>
              <dl class="mt-5 grid gap-4 border-t border-border-subtle pt-5 sm:grid-cols-2">
                <div>
                  <dt class="text-xs text-text-tertiary">{t('homeStatusDate')}</dt>
                  <dd class="mt-1 text-base text-text-primary">{visitDate(result)}</dd>
                </div>
                {#if result.visitorName}
                  <div>
                    <dt class="text-xs text-text-tertiary">{t('homeStatusVisitor')}</dt>
                    <dd class="mt-1 text-base text-text-primary">{result.visitorName}</dd>
                  </div>
                {/if}
              </dl>
              <button type="button" class="ct-link mt-4" onclick={openDetails}>
                {t('homeStatusOpen')}
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </button>
            </article>
          {/key}
        {:else if phase === 'notfound'}
          <p class="text-sm text-text-secondary" in:fly={{ y: 8, duration: 220 }}>{tc('homeStatusNotFound', { query: searched })}</p>
        {:else if phase === 'error'}
          <p class="text-sm text-[#a12d2d]" in:fly={{ y: 8, duration: 220 }}>{t('errorServer')}</p>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .search {
    background: var(--surface);
    border: 1px solid var(--app-border-strong);
    transition:
      border-color 160ms var(--ct-ease),
      box-shadow 160ms var(--ct-ease);
  }
  .search:focus-within {
    border-color: var(--ct-ink);
    box-shadow: 0 0 0 3px rgba(245, 130, 31, 0.28);
  }
  .result {
    background: var(--surface);
    border: 1px solid var(--app-border-subtle);
    border-radius: 6px;
    box-shadow: 0 24px 40px -30px rgba(35, 31, 32, 0.5);
  }
  /* Status colours on paper, each at least 4.5:1 on its tint. */
  .pill {
    border: 1px solid currentColor;
  }
  .pill .dot {
    background: currentColor;
  }
  .pill.is-wait {
    color: #8a5a00;
    background: #fff6e2;
  }
  .pill.is-pay {
    color: var(--ct-orange-ink);
    background: #fff1e5;
  }
  .pill.is-done {
    color: #1f6b45;
    background: #e9f6ef;
  }
  .pill.is-stop {
    color: #a12d2d;
    background: #fcecec;
  }
</style>
