<script lang="ts">
  import Plus from '@lucide/svelte/icons/plus';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import MessageCircle from '@lucide/svelte/icons/message-circle';
  import { t, tc } from '../../lib/i18n/i18n.svelte';
  import { chat } from '../../lib/store/chat.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { BOOKING_MAX_DAYS_AHEAD } from '../../lib/utils/calendar';
  import { LINE_ADD_URL, LINE_ID } from '../../lib/line';
  import LineIcon from '../ui/LineIcon.svelte';
  import Headline from './Headline.svelte';

  let copied = $state(false);
  async function copyId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(LINE_ID);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard refused (permissions, old browser): the ID is on screen to type.
    }
  }

  const perDay = $derived(ui.publicSettings.publicBooking.perDay);
  const holdMinutes = $derived(ui.publicSettings.tableBooking.holdMinutes);

  const faqs = $derived([
    { q: t('homeFaq1Q'), a: tc('homeFaq1A', { n: BOOKING_MAX_DAYS_AHEAD, q: perDay }) },
    { q: t('homeFaq2Q'), a: t('homeFaq2A') },
    { q: t('homeFaq3Q'), a: t('homeFaq3A') },
    { q: t('homeFaq4Q'), a: t('homeFaq4A') },
    { q: t('homeFaq5Q'), a: t('homeFaq5A') },
    { q: t('homeFaq6Q'), a: tc('homeFaq6A', { min: holdMinutes }) },
    { q: t('homeFaq7Q'), a: t('homeFaq7A') },
    { q: t('homeFaq8Q'), a: t('homeFaq8A') },
  ]);
</script>

<!-- Deliberately quiet: the last calm before the table. Nothing moves until a question is opened. -->
<section id="home-faq" data-chapter="ctChFaq" class="border-t border-border-subtle py-20 sm:py-28" aria-labelledby="home-faq-title">
  <div class="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
    <div class="lg:sticky lg:top-16 lg:self-start">
      <p class="ct-label">{t('ctChFaq')}</p>
      <Headline id="home-faq-title" text={t('ctFaqTitle')} class="ct-h2 mt-4" />

      <div class="mt-10 border-t border-border-subtle pt-6">
        <p class="flex items-center gap-2 text-base font-medium text-text-primary">
          <MessageCircle class="h-5 w-5 text-[var(--ct-orange-ink)]" aria-hidden="true" />
          {t('homeHelpHeading')}
        </p>
        <p class="mt-2 max-w-sm text-sm font-light leading-relaxed text-text-secondary">{t('homeHelpText')}</p>
        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-1">
          <button type="button" class="ct-link" onclick={() => chat.openChat()}>{t('homeHelpChat')}</button>
          <a class="ct-link" href="https://main.correct.go.th" target="_blank" rel="noopener noreferrer">
            {t('homeHelpWebsite')}
            <ExternalLink class="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <!-- LINE: scan on a computer, tap on a phone, or copy the ID. -->
        <div class="line-card mt-8 flex items-center gap-5 p-5">
          <img src="/chef/line-qr.svg" width="112" height="112" alt={t('lineScan')} class="hidden h-28 w-28 shrink-0 rounded bg-white p-1.5 sm:block" />
          <div class="min-w-0">
            <p class="flex items-center gap-2 text-sm font-medium">
              <span class="flex h-7 w-7 items-center justify-center rounded-full bg-[#06c755] text-white"><LineIcon class="h-5 w-5" /></span>
              {t('lineAdd')}
            </p>
            <p class="mt-2 text-xs text-text-tertiary">LINE ID</p>
            <p class="font-book text-[1.7rem] font-bold leading-none tabular-nums">{LINE_ID}</p>
            <p class="mt-2 text-xs font-light text-text-secondary">{t('lineHint')}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer" class="ct-btn line-btn min-h-10 px-4 text-sm">{t('lineAdd')}</a>
              <button type="button" class="ct-btn ct-btn-line min-h-10 px-4 text-sm" onclick={copyId} aria-live="polite">
                {copied ? t('lineCopied') : t('lineCopy')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-border-strong">
      {#each faqs as faq, i (faq.q)}
        <details class="faq group border-b border-border-subtle">
          <summary
            class="grid min-h-[4rem] cursor-pointer list-none grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-4 text-left text-base font-medium text-text-primary [&::-webkit-details-marker]:hidden"
          >
            <span class="font-book text-sm font-bold tabular-nums text-text-tertiary">{String(i + 1).padStart(2, '0')}</span>
            {faq.q}
            <Plus
              class="h-5 w-5 shrink-0 text-text-tertiary motion-safe:transition-transform motion-safe:duration-300 group-open:rotate-45"
              aria-hidden="true"
            />
          </summary>
          <p class="faq-a max-w-[60ch] pb-6 pl-[3.25rem] text-base font-light leading-relaxed text-text-secondary">{faq.a}</p>
        </details>
      {/each}
    </div>
  </div>
</section>

<style>
  .line-card {
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid rgba(6, 199, 85, 0.45);
    box-shadow:
      inset 4px 0 0 #06c755,
      0 18px 34px -26px rgba(6, 120, 60, 0.5);
  }
  /* LINE green carries dark text: 7:1. */
  .line-btn {
    background: #06c755;
    color: #0b2416;
  }
  @media (hover: hover) and (pointer: fine) {
    .line-btn:hover {
      background: #2bd370;
    }
  }
  .faq summary:focus-visible {
    outline: 2px solid var(--ct-orange);
    outline-offset: 2px;
    border-radius: 4px;
  }
  @media (hover: hover) and (pointer: fine) {
    .faq summary:hover {
      color: var(--ct-orange-ink);
    }
  }
  /* The answer eases in when its question opens: opacity and a short travel, no height animation. */
  @media (prefers-reduced-motion: no-preference) {
    .faq[open] .faq-a {
      animation: faq-in 260ms cubic-bezier(0.23, 1, 0.32, 1);
    }
  }
  @keyframes faq-in {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
</style>
