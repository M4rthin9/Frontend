<script lang="ts">
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import type { PromoAd } from '../../lib/api/endpoints';
  import { t } from '../../lib/i18n/i18n.svelte';

  let { ads, interval = 5500 }: { ads: PromoAd[]; interval?: number } = $props();

  // A card carousel: the active card sits in the centre and its neighbours
  // peek in from both sides. Native scroll-snap does the swiping; the arrows,
  // dots and autoplay only call scrollTo. Each card's distance from the centre
  // is written to --d (0 in the centre, 1 a full card away) and the CSS turns
  // it into scale and opacity, so depth follows the finger exactly.
  //
  // With two or more ads the row is [last, ...ads, first]: the copies at the
  // ends mean a card always peeks from both sides, and settling on a copy jumps
  // invisibly to the real card it mirrors, so the carousel loops.
  let track: HTMLDivElement | null = $state(null);
  let pos = $state(0);
  let paused = $state(false);

  const single = $derived(ads.length < 2);
  const slides = $derived(
    single
      ? ads.map((ad, i) => ({ ad, key: ad.id, real: i, clone: false }))
      : [
          { ad: ads[ads.length - 1], key: `${ads[ads.length - 1].id}:head`, real: ads.length - 1, clone: true },
          ...ads.map((ad, i) => ({ ad, key: ad.id, real: i, clone: false })),
          { ad: ads[0], key: `${ads[0].id}:tail`, real: 0, clone: true },
        ],
  );
  /** The ad in the centre, for the title and the dots. */
  const index = $derived(slides[pos]?.real ?? 0);

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollToPos(p: number, smooth = true): void {
    const card = track?.children[p] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2,
      behavior: smooth && !reduceMotion ? 'smooth' : 'instant',
    });
  }
  /** Logical ad index to physical position (the row starts with a copy when looping). */
  const posOf = (i: number) => (single ? i : i + 1);

  let frame = 0;
  function measure(): void {
    frame = 0;
    if (!track) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0;
    let nearestGap = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const card = child as HTMLElement;
      const gap = Math.abs(card.offsetLeft + card.clientWidth / 2 - mid);
      card.style.setProperty('--d', Math.min(1, gap / card.clientWidth).toFixed(3));
      if (gap < nearestGap) {
        nearestGap = gap;
        nearest = i;
      }
    });
    pos = nearest;
  }

  // When the scroll comes to rest on a copy, swap to the real card without motion.
  let settleTimer = 0;
  function settle(): void {
    const slide = slides[pos];
    if (slide?.clone) scrollToPos(posOf(slide.real), false);
  }
  function onScroll(): void {
    if (!frame) frame = requestAnimationFrame(measure);
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 140);
  }

  $effect(() => {
    if (!track) return;
    void slides.length;
    scrollToPos(posOf(0), false);
    measure();
    const ro = new ResizeObserver(() => {
      scrollToPos(pos, false);
      measure();
    });
    ro.observe(track);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
    };
  });

  // Re-arms on every card change, so a manual swipe also resets the timer.
  $effect(() => {
    if (single || paused || reduceMotion) return;
    const next = pos + 1;
    const id = setTimeout(() => scrollToPos(next), interval);
    return () => clearTimeout(id);
  });

  /** A side card is a way to get to that card, not a link; only the centre card opens its link. */
  function onCardClick(e: MouseEvent, p: number): void {
    if (p !== pos) {
      e.preventDefault();
      scrollToPos(p);
    }
  }
</script>

<div
  class="carousel relative"
  class:single
  role="region"
  aria-roledescription="carousel"
  aria-label={t('promoLabel')}
  onpointerenter={() => (paused = true)}
  onpointerleave={() => (paused = false)}
  onfocusin={() => (paused = true)}
  onfocusout={() => (paused = false)}
>
  <div bind:this={track} onscroll={onScroll} class="track relative flex snap-x snap-mandatory overflow-x-auto">
    {#each slides as slide, p (slide.key)}
      <div
        class="card-wrap snap-center"
        role="group"
        aria-roledescription="slide"
        aria-label="{slide.real + 1} / {ads.length}"
        aria-hidden={slide.clone || undefined}
        inert={slide.clone}
      >
        <svelte:element
          this={slide.ad.link ? 'a' : 'div'}
          href={slide.ad.link || undefined}
          target={slide.ad.link ? '_blank' : undefined}
          rel={slide.ad.link ? 'noopener noreferrer' : undefined}
          class="card relative block overflow-hidden"
          class:is-active={p === pos}
          onclick={(e: MouseEvent) => onCardClick(e, p)}
          role={slide.ad.link ? undefined : 'presentation'}
          tabindex={slide.ad.link ? (p === pos ? 0 : -1) : undefined}
        >
          <!-- The same image, blurred, fills the card so any poster shape sits on its own colours. -->
          <img src={slide.ad.url} alt="" aria-hidden="true" class="ambient absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <img
            src={slide.ad.url}
            alt={slide.ad.title || t('promoLabel')}
            loading={p === posOf(0) ? 'eager' : 'lazy'}
            class="relative h-full w-full object-contain"
          />
        </svelte:element>
      </div>
    {/each}
  </div>

  {#if !single}
    <button type="button" class="nav nav-prev" aria-label={t('promoPrev')} onclick={() => scrollToPos(pos - 1)}>
      <ChevronLeft class="h-5 w-5" aria-hidden="true" />
    </button>
    <button type="button" class="nav nav-next" aria-label={t('promoNext')} onclick={() => scrollToPos(pos + 1)}>
      <ChevronRight class="h-5 w-5" aria-hidden="true" />
    </button>
  {/if}

  {#if ads[index]?.title || !single}
    <div class="mt-5 flex flex-col items-center gap-3 px-4 text-center">
      {#if ads[index]?.title}
        <p class="text-base font-medium text-text-primary">{ads[index].title}</p>
      {/if}
      {#if !single}
        <div class="flex gap-2">
          {#each ads as ad, i (ad.id)}
            <button
              type="button"
              class="dot"
              class:is-active={i === index}
              aria-label="{i + 1} / {ads.length}"
              aria-current={i === index}
              onclick={() => scrollToPos(posOf(i))}
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* Card width in container units, so the card and the side padding are both
     measured against the carousel itself; a percentage would resolve against
     different boxes for the two and push the first card off centre. */
  .carousel {
    container-type: inline-size;
    --card: 80cqw;
  }
  @media (min-width: 768px) {
    .carousel {
      --card: 68cqw;
    }
  }
  @media (min-width: 1280px) {
    .carousel {
      --card: min(62cqw, 64rem);
    }
  }
  /* One ad: nothing to peek at, so it is simply centred, capped on wide screens. */
  .carousel.single {
    --card: min(100cqw, 64rem);
  }

  .track {
    gap: clamp(0.75rem, 2vw, 1.75rem);
    /* Pad by half the leftover so the first and last cards can also sit centred. */
    padding-inline: calc((100cqw - var(--card)) / 2);
    scrollbar-width: none;
  }
  .track::-webkit-scrollbar {
    display: none;
  }
  .card-wrap {
    flex: 0 0 var(--card);
  }

  .card {
    aspect-ratio: 16 / 9;
    border-radius: 1.25rem;
    background: #120d0c;
    border: 1px solid rgba(214, 179, 124, 0.18);
    box-shadow: 0 30px 60px -32px rgba(0, 0, 0, 0.85);
    /* Driven by --d from the scroll position: no transition, it follows the finger. */
    transform: scale(calc(1 - var(--d, 0) * 0.12));
    opacity: calc(1 - var(--d, 0) * 0.55);
    will-change: transform, opacity;
  }
  .carousel.single .card {
    transform: none;
    opacity: 1;
  }
  .ambient {
    transform: scale(1.25);
    filter: blur(28px) brightness(0.55) saturate(1.2);
  }
  .card:focus-visible {
    outline: 2px solid var(--hp-gold, #a92928);
    outline-offset: 4px;
  }
  .card:not(.is-active) {
    cursor: pointer;
  }

  /* Phones swipe; arrows there would only cover the peeking cards. */
  @media (max-width: 767px) {
    .nav {
      display: none !important;
    }
  }
  .nav {
    position: absolute;
    top: calc(50% - 1.6rem);
    display: flex;
    height: 2.9rem;
    width: 2.9rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(214, 179, 124, 0.4);
    background: rgba(13, 9, 8, 0.6);
    color: #f4ece2;
    backdrop-filter: blur(8px);
    cursor: pointer;
    transition:
      background-color 160ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  /* The arrows sit over the peeking cards, never over the active one. */
  .nav-prev {
    left: max(0.5rem, calc((100cqw - var(--card)) / 4 - 1.45rem));
  }
  .nav-next {
    right: max(0.5rem, calc((100cqw - var(--card)) / 4 - 1.45rem));
  }
  @media (hover: hover) and (pointer: fine) {
    .nav:hover {
      background: rgba(13, 9, 8, 0.85);
    }
  }
  .nav:active {
    transform: scale(0.94);
  }
  .nav:focus-visible,
  .dot:focus-visible {
    outline: 2px solid var(--hp-gold, #a92928);
    outline-offset: 3px;
  }

  .dot {
    height: 0.5rem;
    width: 0.5rem;
    border-radius: 999px;
    background: var(--app-border-strong);
    cursor: pointer;
    transition: background-color 220ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .dot.is-active {
    width: 1.5rem;
    background: var(--hp-gold, #a92928);
  }
</style>
