<script lang="ts">
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Check from '@lucide/svelte/icons/check';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { visitPlan } from '../../lib/store/visitPlan.svelte';
  import { formatDateIn } from '../../lib/utils/date';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';

  // Bound inside an {#if}, so it must be reactive for the effect below to see it.
  let root = $state<HTMLElement | null>(null);

  const bookingOpen = $derived(ui.publicSettings.bookingWindow.open);
  const days = $derived(visitPlan.freeDays.slice(0, 8));
  const perDay = $derived(visitPlan.perDay);

  onMount(() => visitPlan.loadCounts());

  // Stubs arrive once there is something to show; meters fill from empty to
  // the live seat count, which is the only number in this section.
  $effect(() => {
    if (!root || visitPlan.countsState !== 'ready' || days.length === 0) return;
    const mm = gsap.matchMedia(root);
    mm.add(MQ.motion, () => {
      const trigger = { trigger: root, start: 'top 78%', once: true };
      gsap.from('[data-day]', { opacity: 0, y: 30, duration: 1, ease: EASE_OUT, stagger: 0.055, scrollTrigger: trigger });
      gsap.from('[data-meter]', { scaleX: 0, duration: 1.3, ease: EASE_OUT, stagger: 0.055, delay: 0.15, scrollTrigger: trigger });
    });
    return () => mm.revert();
  });

  function toTicket(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('home-ticket')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
</script>

{#if bookingOpen && visitPlan.countsState !== 'error'}
  <section bind:this={root} id="home-dates" class="scroll-mt-6 py-16 sm:py-24" aria-labelledby="home-dates-title">
    <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div class="max-w-xl">
          <h2 id="home-dates-title" class="home-h2">{t('homeNextHeading')}</h2>
          <p class="mt-3 text-base leading-relaxed text-text-secondary">{t('homeNextSub')}</p>
        </div>
        <button type="button" class="home-textlink" onclick={() => navigate('booking')}>
          {t('homeNextAll')}
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- A lateral rail: options read sideways. It scrolls natively on every screen. -->
    <ul
      class="rail mt-10 grid snap-x snap-mandatory auto-cols-[8.75rem] grid-flow-col gap-3 overflow-x-auto px-4 pb-4 sm:auto-cols-[9.5rem] sm:px-6 lg:mx-auto lg:max-w-6xl lg:auto-cols-fr lg:overflow-visible"
      aria-busy={visitPlan.countsState === 'loading'}
    >
      {#if visitPlan.countsState !== 'ready'}
        {#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
          <li class="h-44 snap-start rounded-2xl bg-background-subtle motion-safe:animate-pulse" aria-hidden="true"></li>
        {/each}
      {:else if days.length === 0}
        <li class="col-span-full rounded-2xl border border-border-subtle bg-surface p-6 text-sm text-text-secondary">
          {t('homeNextNone')}
        </li>
      {:else}
        {#each days as day (day.date)}
          {@const picked = visitPlan.date === day.date}
          {@const low = day.left <= 5}
          <li data-day class="snap-start">
            <button
              type="button"
              class="stub group relative flex h-full w-full cursor-pointer flex-col rounded-2xl border bg-surface px-4 pb-4 pt-4 text-left {picked
                ? 'is-picked border-red-700 dark:border-red-400'
                : 'border-border-subtle'}"
              aria-pressed={picked}
              aria-label="{formatDateIn(day.date, i18n.lang, { weekday: 'long', day: 'numeric', month: 'long' })} · {tc('homeNextLeft', { n: day.left })}"
              onclick={() => visitPlan.toggleDate(day.date)}
            >
              <span class="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                {formatDateIn(day.date, i18n.lang, { weekday: 'short' })}
              </span>
              <span class="mt-1 text-4xl font-semibold leading-none tracking-tight text-text-primary tabular-nums">
                {formatDateIn(day.date, 'en', { day: 'numeric' })}
              </span>
              <span class="mt-1 text-sm text-text-secondary">{formatDateIn(day.date, i18n.lang, { month: 'short' })}</span>

              <!-- Perforation between the date and the seats, as on a paper stub. -->
              <span class="stub-perf my-4" aria-hidden="true"></span>

              <span class="relative h-1.5 w-full overflow-hidden rounded-full bg-background-muted" aria-hidden="true">
                <span
                  data-meter
                  class="absolute inset-y-0 left-0 origin-left rounded-full {low ? 'bg-amber-500' : 'bg-emerald-500'}"
                  style="width: {Math.max(4, Math.round((day.left / perDay) * 100))}%"
                ></span>
              </span>
              <span class="mt-2 text-xs font-semibold {low ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}">
                {tc('homeNextLeft', { n: day.left })}
              </span>

              {#if picked}
                <span
                  class="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-red-700 text-white dark:bg-red-500"
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
          <button type="button" class="home-textlink" onclick={toTicket}>
            {t('homeDatesToTicket')}
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
  .stub {
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
    transition:
      transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
      border-color 160ms cubic-bezier(0.23, 1, 0.32, 1),
      box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  @media (hover: hover) and (pointer: fine) {
    .stub:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 28px -18px rgba(74, 15, 15, 0.45);
    }
  }
  .stub:active {
    transform: scale(0.97);
  }
  .stub:focus-visible {
    outline: 2px solid #a92928;
    outline-offset: 3px;
  }
  .stub.is-picked {
    box-shadow: 0 14px 30px -18px rgba(169, 41, 40, 0.6);
  }
  .stub-perf {
    display: block;
    height: 1px;
    background-image: linear-gradient(90deg, var(--color-border-strong) 50%, transparent 50%);
    background-size: 7px 1px;
  }
</style>
