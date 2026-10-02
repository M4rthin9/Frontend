<script lang="ts">
  import { fly } from 'svelte/transition';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';

  let { root }: { root: HTMLElement | undefined } = $props();

  // The book's running folio: "CHEF TABLE ในเรือนจำ · 03 ...". Chapters are the
  // page's direct children carrying data-chapter (an i18n key); they are numbered
  // in page order, so a chapter that is not shown (no news, booking closed)
  // leaves no gap. A thin band across the middle of the screen decides which
  // chapter is being read.
  let chapters = $state<string[]>([]);
  let active = $state(0);

  $effect(() => {
    if (!root) return;
    let io: IntersectionObserver | undefined;
    const scan = () => {
      const els = Array.from(root.querySelectorAll<HTMLElement>(':scope > [data-chapter]'));
      chapters = els.map((el) => el.dataset.chapter ?? '');
      io?.disconnect();
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) active = els.indexOf(e.target as HTMLElement);
        },
        { rootMargin: '-48% 0px -51% 0px' },
      );
      els.forEach((el) => io!.observe(el));
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(root, { childList: true });
    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  });

  // Off on the cover, and on the chapters that carry their own booking action.
  const key = $derived(chapters[active] ?? '');
  const shown = $derived(active > 0 && key !== 'ctChTable' && key !== 'ctChEnd');
</script>

<div class="folio fixed bottom-6 left-4 right-[5.75rem] z-40 sm:left-6 sm:right-auto" class:is-shown={shown} inert={!shown} aria-hidden={!shown}>
  <nav class="ct-black flex h-14 items-center gap-3 rounded-full pl-5 pr-2 sm:gap-4" aria-label={t('ctFolioLabel')}>
    <span class="hidden shrink-0 items-baseline gap-1.5 sm:inline-flex">
      <span class="font-book text-[0.95rem] font-bold uppercase tracking-tight">Chef Table</span>
      <span class="text-xs text-text-tertiary">{t('ctMastIn')}</span>
    </span>
    <span class="hidden h-5 w-px bg-white/20 sm:block" aria-hidden="true"></span>
    <span class="relative h-5 min-w-0 flex-1 overflow-hidden sm:w-44 sm:flex-none">
      {#key key}
        <span class="absolute inset-0 truncate text-sm leading-5" in:fly={{ y: 14, duration: 320 }} out:fly={{ y: -14, duration: 200 }}>
          <span class="font-book font-bold text-[var(--ct-orange)] tabular-nums">{String(active + 1).padStart(2, '0')}</span>
          <span class="text-text-secondary">{key ? t(key) : ''}</span>
        </span>
      {/key}
    </span>
    <button type="button" class="ct-btn ct-btn-orange min-h-10 shrink-0 px-4 text-sm" onclick={() => navigate('booking')}>
      {t('homeCtaBook')}
      <ArrowRight class="ct-nudge h-4 w-4" aria-hidden="true" />
    </button>
  </nav>
</div>

<style>
  .folio {
    opacity: 0;
    transform: translateY(calc(100% + 1.5rem));
    transition:
      transform 420ms cubic-bezier(0.23, 1, 0.32, 1),
      opacity 240ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .folio.is-shown {
    opacity: 1;
    transform: none;
  }
  /* A hairline keeps the pill visible when it passes over the book's black pages. */
  .folio nav {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.14),
      0 18px 36px -18px rgba(20, 16, 17, 0.7);
  }
  @media (prefers-reduced-motion: reduce) {
    .folio {
      transition: none;
    }
  }
</style>
