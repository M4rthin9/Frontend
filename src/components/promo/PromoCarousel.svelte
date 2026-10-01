<script lang="ts">
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import type { PromoAd } from '../../lib/api/endpoints';
  import { t } from '../../lib/i18n/i18n.svelte';

  let { ads, interval = 5000 }: { ads: PromoAd[]; interval?: number } = $props();

  // Native scroll-snap does the swiping; the buttons, dots and autoplay only
  // ever call scrollTo, and `index` is read back from the scroll position.
  let track: HTMLDivElement | null = $state(null);
  let index = $state(0);
  let paused = $state(false);

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(i: number): void {
    if (!track || ads.length === 0) return;
    const next = (i + ads.length) % ads.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: reduceMotion ? 'instant' : 'smooth' });
  }

  function onScroll(): void {
    if (track && track.clientWidth > 0) index = Math.round(track.scrollLeft / track.clientWidth);
  }

  // Re-arms on every slide change, so a manual swipe also resets the timer.
  $effect(() => {
    if (ads.length < 2 || paused || reduceMotion) return;
    const next = index + 1;
    const id = setTimeout(() => go(next), interval);
    return () => clearTimeout(id);
  });
</script>

<div
  class="relative"
  role="region"
  aria-roledescription="carousel"
  aria-label={t('promoLabel')}
  onpointerenter={() => (paused = true)}
  onpointerleave={() => (paused = false)}
  onfocusin={() => (paused = true)}
  onfocusout={() => (paused = false)}
>
  <div
    bind:this={track}
    onscroll={onScroll}
    class="flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-background-subtle [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    {#each ads as ad, i (ad.id)}
      <div
        class="flex w-full shrink-0 snap-center items-center justify-center"
        role="group"
        aria-roledescription="slide"
        aria-label="{i + 1} / {ads.length}"
      >
        {#if ad.link}
          <a href={ad.link} target="_blank" rel="noopener noreferrer" class="block w-full">
            <img
              src={ad.url}
              alt={ad.title || t('promoLabel')}
              loading={i === 0 ? 'eager' : 'lazy'}
              class="mx-auto h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          </a>
        {:else}
          <img
            src={ad.url}
            alt={ad.title || t('promoLabel')}
            loading={i === 0 ? 'eager' : 'lazy'}
            class="mx-auto h-auto max-h-[80vh] w-auto max-w-full object-contain"
          />
        {/if}
      </div>
    {/each}
  </div>

  {#if ads.length > 1}
    <button
      type="button"
      class="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur-sm transition-colors hover:bg-slate-950/65"
      aria-label={t('promoPrev')}
      onclick={() => go(index - 1)}
    >
      <ChevronLeft class="h-5 w-5" />
    </button>
    <button
      type="button"
      class="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur-sm transition-colors hover:bg-slate-950/65"
      aria-label={t('promoNext')}
      onclick={() => go(index + 1)}
    >
      <ChevronRight class="h-5 w-5" />
    </button>
  {/if}

  {#if ads[index]?.title || ads.length > 1}
    <div class="mt-3 flex items-center justify-between gap-3">
      <p class="min-w-0 truncate text-sm font-semibold text-text-primary">{ads[index]?.title ?? ''}</p>
      {#if ads.length > 1}
        <div class="flex shrink-0 gap-1.5">
          {#each ads as ad, i (ad.id)}
            <button
              type="button"
              class="h-2 rounded-full transition-all {i === index ? 'w-5 bg-red-700' : 'w-2 bg-border-subtle hover:bg-text-tertiary'}"
              aria-label="{i + 1} / {ads.length}"
              aria-current={i === index}
              onclick={() => go(i)}
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
