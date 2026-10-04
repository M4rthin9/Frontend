<script lang="ts">
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Check from '@lucide/svelte/icons/check';
  import Clock from '@lucide/svelte/icons/clock';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { visitPlan } from '../../lib/store/visitPlan.svelte';
  import { formatDateIn } from '../../lib/utils/date';
  import { nextOpening } from '../../lib/utils/calendar';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';
  import Headline from './Headline.svelte';
  import PushOptIn from '../ui/PushOptIn.svelte';

  // Bound inside an {#if}, so it must be reactive for the effect below to see it.
  let root = $state<HTMLElement | null>(null);

  const bookingOpen = $derived(ui.publicSettings.bookingWindow.open);
  const days = $derived(visitPlan.freeDays.slice(0, 8));
  const perDay = $derived(visitPlan.perDay);

  onMount(() => visitPlan.loadCounts());

  // Countdown to the next date opening (07:00 Bangkok). At zero the counts are
  // refetched, which also rebuilds the rail with the newly opened date.
  let now = $state(Date.now());
  const opening = $derived(nextOpening(new Date(now), ui.publicSettings.bookingWindow));
  $effect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      if (opening && t >= opening.at.getTime()) visitPlan.loadCounts(true);
      now = t;
    }, 1000);
    return () => clearInterval(id);
  });
  const left = $derived.by(() => {
    const s = opening ? Math.max(0, Math.floor((opening.at.getTime() - now) / 1000)) : 0;
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = Math.floor(s / 86400);
    const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    return d > 0 ? `${tc('homeNextOpenDays', { n: d })} ${hms}` : hms;
  });

  // Cards arrive once there is something to show; meters fill from empty to the
  // live seat count, which is the only number in this section.
  $effect(() => {
    if (!root || visitPlan.countsState !== 'ready' || days.length === 0) return;
    const mm = gsap.matchMedia(root);
    mm.add(MQ.motion, () => {
      const trigger = { trigger: root, start: 'top 78%', once: true };
      gsap.from('[data-day]', { opacity: 0, y: 28, duration: 1, ease: EASE_OUT, stagger: 0.055, scrollTrigger: trigger });
      gsap.from('[data-meter]', { scaleX: 0, duration: 1.3, ease: EASE_OUT, stagger: 0.055, delay: 0.15, scrollTrigger: trigger });
    });
    return () => mm.revert();
  });

  function toTable(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('home-table')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
</script>

{#if bookingOpen && visitPlan.countsState !== 'error'}
  <section
    bind:this={root}
    id="home-dates"
    data-chapter="ctChDates"
    class="scroll-mt-6 py-20 sm:py-28"
    aria-labelledby="home-dates-title"
  >
    <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div class="max-w-xl">
          <p class="ct-label">{t('ctChDates')}</p>
          <Headline id="home-dates-title" text={t('ctDatesTitle')} class="ct-h2 mt-4" />
          <p class="mt-3 text-base font-light leading-relaxed text-text-secondary">{t('ctDatesSub')}</p>
          {#if opening}
            <p class="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
              <Clock class="h-4 w-4 text-[var(--ct-orange-ink)]" aria-hidden="true" />
              <span>
                {tc('homeNextOpen', {
                  date: formatDateIn(opening.date, i18n.lang, { weekday: 'short', day: 'numeric', month: 'short' }),
                })}
              </span>
              <time
                role="timer"
                datetime={opening.at.toISOString()}
                class="countdown rounded-sm px-2 py-0.5 font-semibold tabular-nums"
              >
                {left}
              </time>
            </p>
            <PushOptIn kind="opening" align="start" />
          {/if}
        </div>
        <button type="button" class="ct-link" onclick={() => navigate('booking')}>
          {t('homeNextAll')}
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- A lateral rail: options read sideways. It scrolls natively on every screen. -->
    <ul
      class="rail mt-10 grid snap-x snap-mandatory auto-cols-[8.5rem] grid-flow-col gap-3 overflow-x-auto px-4 pb-4 sm:auto-cols-[9.5rem] sm:px-6 lg:mx-auto lg:max-w-6xl lg:auto-cols-fr lg:overflow-visible"
      aria-busy={visitPlan.countsState === 'loading'}
    >
      {#if visitPlan.countsState !== 'ready'}
        {#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
          <li class="h-48 snap-start rounded-md bg-background-subtle motion-safe:animate-pulse" aria-hidden="true"></li>
        {/each}
      {:else if days.length === 0}
        <li class="col-span-full rounded-md border border-border-subtle bg-surface p-6 text-sm text-text-secondary">
          {t('homeNextNone')}
        </li>
      {:else}
        {#each days as day (day.date)}
          {@const picked = visitPlan.date === day.date}
          {@const low = day.left <= 5}
          <li data-day class="snap-start">
            <button
              type="button"
              class="card group relative flex h-full w-full cursor-pointer flex-col rounded-md px-4 pb-4 pt-4 text-left"
              class:is-picked={picked}
              aria-pressed={picked}
              aria-label="{formatDateIn(day.date, i18n.lang, { weekday: 'long', day: 'numeric', month: 'long' })} · {tc('homeNextLeft', { n: day.left })}"
              onclick={() => visitPlan.toggleDate(day.date)}
            >
              <span class="card-soft text-xs font-medium tracking-wide">
                {formatDateIn(day.date, i18n.lang, { weekday: 'short' })}
              </span>
              <span class="day mt-2 font-book text-[2.9rem] font-bold leading-none tabular-nums">
                {formatDateIn(day.date, 'en', { day: 'numeric' })}
              </span>
              <span class="card-soft mt-1 text-sm">{formatDateIn(day.date, i18n.lang, { month: 'short' })}</span>

              <span class="rule my-4" aria-hidden="true"></span>

              <span class="track relative h-1 w-full overflow-hidden rounded-full" aria-hidden="true">
                <span
                  data-meter
                  class="meter absolute inset-y-0 left-0 origin-left rounded-full"
                  class:is-low={low}
                  style="width: {Math.max(4, Math.round((day.left / perDay) * 100))}%"
                ></span>
              </span>
              <span class="seats mt-2 text-xs font-medium" class:is-low={low}>
                {tc('homeNextLeft', { n: day.left })}
              </span>

              {#if picked}
                <span
                  class="check absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full"
                  in:scale={{ start: 0.6, duration: 260 }}
                  aria-hidden="true"
                >
                  <Check class="h-4 w-4" strokeWidth={3} />
                </span>
              {/if}
            </button>
          </li>
        {/each}
      {/if}
    </ul>

    {#if visitPlan.date}
      <div class="mx-auto mt-6 w-full max-w-6xl px-4 sm:px-6" transition:scale={{ start: 0.96, duration: 220 }}>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
          <span>
            {tc('homeDatesPicked', { date: formatDateIn(visitPlan.date, i18n.lang, { weekday: 'long', day: 'numeric', month: 'long' }) })}
          </span>
          <button type="button" class="ct-link" onclick={toTable}>
            {t('ctDatesToTable')}
            <ArrowDown class="h-4 w-4" aria-hidden="true" />
          </button>
        </p>
      </div>
    {/if}
  </section>
{/if}

<style>
  .rail {
    scrollbar-width: none;
  }
  .rail::-webkit-scrollbar {
    display: none;
  }
  /* A printed card on the table; picked, it turns into one of the book's black pages. */
  .card {
    background: var(--surface);
    border: 1px solid var(--app-border-subtle);
    color: var(--app-text);
    transition:
      transform 160ms var(--ct-ease),
      background-color 220ms var(--ct-ease),
      border-color 220ms var(--ct-ease),
      box-shadow 220ms var(--ct-ease),
      color 220ms var(--ct-ease);
  }
  .card-soft {
    color: var(--app-text-tertiary);
    transition: color 220ms var(--ct-ease);
  }
  @media (hover: hover) and (pointer: fine) {
    .card:hover {
      transform: translateY(-3px);
      border-color: var(--app-border-strong);
      box-shadow: 0 18px 30px -22px rgba(35, 31, 32, 0.55);
    }
  }
  .card:active {
    transform: scale(0.97);
  }
  .card:focus-visible {
    outline: 2px solid var(--ct-orange);
    outline-offset: 3px;
  }
  .rule {
    display: block;
    height: 1px;
    background: var(--app-border-subtle);
  }
  .track {
    background: var(--app-bg-muted);
  }
  .meter {
    background: var(--ct-ink);
  }
  .meter.is-low {
    background: var(--ct-orange);
  }
  .seats {
    color: var(--app-text-secondary);
  }
  .seats.is-low {
    color: var(--ct-orange-ink);
  }

  .card.is-picked {
    background: var(--ct-black);
    border-color: var(--ct-black);
    color: #fff;
    box-shadow: 0 20px 34px -20px rgba(35, 31, 32, 0.7);
  }
  .card.is-picked .day {
    color: var(--ct-orange);
  }
  .card.is-picked .card-soft,
  .card.is-picked .seats {
    color: rgba(255, 255, 255, 0.72);
  }
  .card.is-picked .seats.is-low {
    color: var(--ct-orange);
  }
  .card.is-picked .rule {
    background: rgba(255, 255, 255, 0.16);
  }
  .card.is-picked .track {
    background: rgba(255, 255, 255, 0.16);
  }
  .card.is-picked .meter {
    background: #fff;
  }
  .card.is-picked .meter.is-low {
    background: var(--ct-orange);
  }
  .check {
    background: var(--ct-orange);
    color: var(--ct-ink);
  }
  .countdown {
    background: var(--ct-black);
    color: #fff;
  }
</style>
