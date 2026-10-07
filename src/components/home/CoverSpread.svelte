<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import Search from '@lucide/svelte/icons/search';
  import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { LINE_ADD_URL, LINE_ID } from '../../lib/line';
  import LineIcon from '../ui/LineIcon.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';
  import Headline from './Headline.svelte';

  let root: HTMLElement;

  const settings = $derived(ui.publicSettings);
  const bookingOpen = $derived(settings.bookingWindow.open);
  const tagline = $derived([1, 2, 3].map((n) => t(`ctTag${n}`).split('|')));
  const mastLines = $derived(t('ctMastTitle').split('|'));
  // The steps line breaks only between its phrases, never inside one
  // ("ชำระเงินหลังได้รับการอนุมัติ" stays whole).
  const subPhrases = $derived(t('heroSub').split(' · '));

  function toDates(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('home-dates')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  onMount(() => {
    const mm = gsap.matchMedia(root);

    // Desktop: the book opens. The photo page swings down flat from the spine
    // while the cover type settles line by line.
    mm.add(MQ.desktop, () => {
      gsap
        .timeline({ defaults: { ease: EASE_OUT } })
        .from('[data-unfold]', { rotateY: 62, transformPerspective: 2200, duration: 1.6 }, 0)
        .from('[data-unfold-shade]', { opacity: 1, duration: 1.4 }, 0)
        .from('[data-mast] > span', { opacity: 0, y: 26, duration: 1.3, stagger: 0.1 }, 0.1)
        .from('[data-line]', { opacity: 0, y: 18, duration: 1.1, stagger: 0.07 }, 0.3)
        .from('[data-tag]', { opacity: 0, y: 12, duration: 1, stagger: 0.12 }, 0.7);
    });

    mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
      gsap
        .timeline({ defaults: { ease: EASE_OUT } })
        .from('[data-mast] > span', { opacity: 0, y: 20, duration: 1.1, stagger: 0.08 }, 0)
        .from('[data-line]', { opacity: 0, y: 14, duration: 1, stagger: 0.06 }, 0.15)
        .from('[data-zoom]', { scale: 1.08, duration: 1.8 }, 0);
    });

    // As the cover leaves, the reader leans over the table.
    mm.add(MQ.motion, () => {
      gsap.to('[data-zoom]', {
        scale: 1.07,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 },
      });
    });

    return () => mm.revert();
  });
</script>

<section
  bind:this={root}
  id="home-cover"
  data-chapter="ctChCover"
  class="relative isolate grid overflow-x-clip lg:min-h-[min(90svh,860px)] lg:grid-cols-2"
  aria-labelledby="home-title"
>
  <!-- The right-hand page of the book, first in reading order: the black cover. -->
  <div
    class="ct-black cover relative z-10 flex flex-col justify-between gap-8 px-6 pb-10 pt-12 sm:px-10 lg:order-2 lg:px-14 lg:pb-14 lg:pt-14 xl:px-20"
  >
    <div>
      <div data-line class="flex items-center gap-3">
        <img
          src="/cida-logo-128.webp"
          width="40"
          height="40"
          alt="กรมราชทัณฑ์"
          class="h-10 w-10 rounded-full object-cover"
        />
        <img
          src="/logo-white-128.webp"
          width="40"
          height="40"
          alt="CC Cafe"
          class="h-10 w-10 rounded-full object-cover ring-1 ring-white/25"
        />
        <p class="min-w-0 text-xs leading-snug text-text-secondary sm:text-sm">{t('homeAgency')}</p>
      </div>

      <p data-mast class="masthead mt-8 font-bold text-[var(--ct-orange)] lg:mt-10">
        {#each mastLines as line, i (i)}<span class="block">{line}</span>{/each}
      </p>
      <p data-line class="mt-3 text-lg font-light text-white/90 sm:text-xl">{t('ctMastSub')}</p>
    </div>

    <div>
      <div data-line>
        <Headline id="home-title" level={1} keep text={t('homeHeroTitle')} class="cover-title" />
      </div>
      <div data-line class="booking-actions mt-6 grid gap-3">
        <button type="button" class="ct-btn ct-btn-orange booking-action" onclick={() => navigate('booking')}>
          <CalendarDays class="h-7 w-7 shrink-0" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="booking-action-title">{t('homeCtaVisit')}</span>
            <span class="booking-action-description">{t('btnBookSub')}</span>
          </span>
          <ArrowRight class="ct-nudge h-5 w-5 shrink-0" aria-hidden="true" />
        </button>
        <button type="button" class="ct-btn booking-action booking-action-table" onclick={() => navigate('table-booking')}>
          <UtensilsCrossed class="h-7 w-7 shrink-0" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="booking-action-title">{t('btnTableBook')}</span>
            <span class="booking-action-description">{t('tblOutsideGuestsOnly')}</span>
            {#if ui.publicSettingsLoaded && !ui.tableBookingOpen}
              <span class="booking-action-status">{ui.tableBookingScheduled ? t('tblCountdownTitle') : t('tblClosedTitle')}</span>
            {/if}
          </span>
          <ArrowRight class="ct-nudge h-5 w-5 shrink-0" aria-hidden="true" />
        </button>
      </div>

      <p data-line class="mt-5 max-w-[36rem] text-base font-light leading-relaxed text-text-secondary sm:text-lg">
        {#each subPhrases as phrase, i (i)}<span class="inline-block"
            >{phrase}{i < subPhrases.length - 1 ? ' ·' : ''}</span
          >{i < subPhrases.length - 1 ? ' ' : ''}{/each}
      </p>

      <div data-line class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span class="inline-flex items-center gap-2" role="status">
          <span class="relative flex h-2 w-2" aria-hidden="true">
            {#if bookingOpen}
              <span
                class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping"
              ></span>
            {/if}
            <span class="relative inline-flex h-2 w-2 rounded-full {bookingOpen ? 'bg-emerald-400' : 'bg-amber-400'}"
            ></span>
          </span>
          <span class="text-text-secondary"
            >{bookingOpen ? t('homeStatusBookingOpen') : t('homeStatusBookingClosed')}</span
          >
        </span>
        <button type="button" class="ct-link" onclick={() => navigate('status')}>
          <Search class="h-4 w-4" aria-hidden="true" />{t('btnStatus')}
        </button>
        {#if bookingOpen}
          <button type="button" class="ct-link" onclick={toDates}>
            <ArrowDown class="h-4 w-4" aria-hidden="true" />{t('homeCtaDates')}
          </button>
        {/if}
      </div>

      <!-- LINE, in its own green, so it is the one thing on the cover that is not book-coloured. -->
      <a
        data-line
        href={LINE_ADD_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="line-chip mt-7 inline-flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#06c755]">
          <LineIcon class="h-7 w-7" />
        </span>
        <span class="text-sm font-medium leading-tight">
          {t('lineAsk')}
          <span class="block text-base font-semibold tabular-nums tracking-wide">LINE ID: {LINE_ID}</span>
        </span>
      </a>
    </div>
  </div>

  <!-- The left-hand page: the book's opening photograph, the tagline set on its linen. -->
  <div class="photo-page relative overflow-hidden lg:order-1">
    <div data-unfold class="absolute inset-0 origin-right">
      <div data-zoom class="absolute inset-0">
        <img
          src="/chef/cover-1400.webp"
          srcset="/chef/cover-800.webp 800w, /chef/cover-1400.webp 1400w"
          sizes="(min-width: 1024px) 50vw, 100vw"
          width="1400"
          height="1876"
          alt={t('ctCoverAlt')}
          fetchpriority="high"
          class="absolute inset-0 h-full w-full object-cover object-[50%_18%]"
        />
      </div>
      <div
        data-unfold-shade
        class="unfold-shade pointer-events-none absolute inset-0 opacity-0"
        aria-hidden="true"
      ></div>
      <div
        class="spine pointer-events-none absolute inset-y-0 right-0 hidden w-[10%] lg:block"
        aria-hidden="true"
      ></div>

      <p class="tagline absolute inset-x-0 top-0 px-6 pt-[9%] text-center">
        {#each tagline as [lead, key], i (i)}
          <span data-tag class="block"
            ><span class="font-light">{lead}</span><span class="font-medium">{key}</span></span
          >
        {/each}
      </p>
    </div>
  </div>
</section>

<style>
  .booking-action {
    width: 100%;
    min-height: 6rem;
    justify-content: space-between;
    gap: 0.85rem;
    padding: 1rem 1.25rem;
    border: 2px solid transparent;
    border-radius: 1rem;
    text-align: left;
    white-space: normal;
  }
  .booking-action-title {
    display: block;
    font-size: clamp(1.1rem, 1.6vw, 1.4rem);
    font-weight: 700;
    line-height: 1.45;
  }
  .booking-action-description {
    display: block;
    margin-top: 0.3rem;
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.55;
  }
  .booking-action-table {
    background: var(--ct-paper);
    color: var(--ct-ink);
    border-color: var(--ct-orange);
  }
  .booking-action-status {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.2rem 0.6rem;
    border-radius: 99px;
    background: #f8e5c9;
    color: #734410;
    font-size: 0.75rem;
    line-height: 1.5;
  }
  @media (hover: hover) and (pointer: fine) {
    .booking-action-table:hover { background: #fff4e5; }
  }
  .cover {
    /* A faint highlight where the black page rises from the spine. */
    background-image:
      radial-gradient(ellipse at 100% 0%, rgba(245, 130, 31, 0.16), transparent 65%),
      linear-gradient(90deg, rgba(255, 255, 255, 0.07), transparent 3%);
  }
  /* "CHEF TABLE" in Tinos Bold caps is about 6.8em wide: size it to fill the
     page's text column exactly (column width minus its padding, over 6.9). */
  /* The programme's name in two lines, sized to the page's text column: its
     longer line is about 10.5em wide in Kanit Bold. */
  .masthead {
    font-size: min(calc((100vw - 3rem) / 10.8), 3.4rem);
    line-height: 1.12;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }
  @media (min-width: 640px) {
    .masthead {
      font-size: min(calc((100vw - 5rem) / 10.8), 3.6rem);
    }
  }
  @media (min-width: 1024px) {
    .masthead {
      font-size: min(calc((50vw - 7rem) / 10.8), 4rem);
    }
  }
  @media (min-width: 1280px) {
    .masthead {
      font-size: min(calc((50vw - 10rem) / 10.8), 4rem);
    }
  }
  .line-chip {
    background: #06c755;
    color: #0b2416;
    box-shadow: 0 14px 30px -16px rgba(6, 199, 85, 0.75);
    transition: transform 160ms var(--ct-ease);
  }
  .line-chip:active {
    transform: scale(0.97);
  }
  .line-chip:focus-visible {
    outline: 2px solid #06c755;
    outline-offset: 4px;
  }
  @media (hover: hover) and (pointer: fine) {
    .line-chip:hover {
      transform: translateY(-2px);
    }
  }
  .cover :global(.cover-title) {
    color: #fff;
    font-size: clamp(2rem, 1.2rem + 3.2vw, 3.5rem);
    font-weight: 300;
    line-height: 1.18;
    letter-spacing: -0.012em;
    text-wrap: balance;
  }
  :global(html[lang='en']) .cover :global(.cover-title),
  :global(html[lang='vi']) .cover :global(.cover-title) {
    font-size: clamp(1.9rem, 1.1rem + 2.6vw, 3rem);
    line-height: 1.12;
  }

  .photo-page {
    min-height: 64vw;
    max-height: 620px;
    background: #c9cfd2;
  }
  @media (min-width: 640px) {
    .photo-page {
      min-height: 58vw;
    }
  }
  @media (min-width: 1024px) {
    .photo-page {
      min-height: 0;
      max-height: none;
    }
  }
  /* The gutter: the page curves down into the binding. */
  .spine {
    background: linear-gradient(270deg, rgba(20, 16, 17, 0.42), rgba(20, 16, 17, 0.12) 35%, rgba(20, 16, 17, 0));
  }
  /* While the page is still lifting it catches less light. */
  .unfold-shade {
    background: linear-gradient(270deg, rgba(20, 16, 17, 0.55), rgba(20, 16, 17, 0.15));
  }

  .tagline {
    color: var(--ct-ink);
    font-size: clamp(1.6rem, 6.4vw, 2.4rem);
    line-height: 1.22;
  }
  @media (min-width: 1024px) {
    .tagline {
      font-size: min(2.8vw, 2.7rem);
    }
  }
</style>
