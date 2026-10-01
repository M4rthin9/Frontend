<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import Scissors from '@lucide/svelte/icons/scissors';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { booking, PRICE_CHILD_5_8, PRICE_PER_PERSON } from '../../lib/store/booking.svelte';
  import { MAX_VISITORS, visitPlan } from '../../lib/store/visitPlan.svelte';
  import { formatDateIn } from '../../lib/utils/date';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';

  let root: HTMLElement;
  let paper: HTMLElement;
  let body: HTMLElement;
  let stub: HTMLElement;
  let stamp: HTMLElement;

  let tearing = $state(false);
  let shownTotal = $state(visitPlan.total);

  const bookingOpen = $derived(ui.publicSettings.bookingWindow.open);
  const quickDays = $derived(visitPlan.freeDays.slice(0, 4));
  const baht = (n: number) => tc('homePriceBaht', { n: n.toLocaleString('en-US') });

  const rows = $derived([
    { field: 'adults' as const, label: t('homePriceAdult'), price: baht(PRICE_PER_PERSON) },
    { field: 'kids58' as const, label: t('homePriceChild58'), price: baht(PRICE_CHILD_5_8) },
    { field: 'kidsUnder5' as const, label: t('homePriceChildU5'), price: t('homePriceFree') },
  ]);

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  onMount(() => {
    visitPlan.loadCounts();
    const mm = gsap.matchMedia(root);
    const stampIn = { opacity: 1, scale: 1, rotate: -12, ease: 'back.out(2.2)' };
    const stampFrom = { opacity: 0, scale: 1.9, rotate: -32 };

    // Desktop: the section holds and the scroll feeds the ticket out of the
    // slot in steps, like a receipt printer, then the stamp lands and it holds.
    mm.add(MQ.desktop, () => {
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: '+=150%', pin: true, scrub: 0.4 } })
        .fromTo(paper, { yPercent: -101 }, { yPercent: 0, ease: 'steps(18)', duration: 1 })
        .fromTo(stamp, stampFrom, { ...stampIn, duration: 0.22 })
        .to({}, { duration: 0.4 });
    });

    // Phones and tablets: no pin. The ticket prints once as it arrives.
    mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top 72%', once: true } })
        .fromTo(paper, { yPercent: -101 }, { yPercent: 0, ease: 'steps(14)', duration: 1.3 })
        .fromTo(stamp, stampFrom, { ...stampIn, duration: 0.45 });
    });

    return () => mm.revert();
  });

  // The total moves under the visitor's hand rather than jumping.
  $effect(() => {
    const target = visitPlan.total;
    if (reduced()) {
      shownTotal = target;
      return;
    }
    const counter = { v: untrack(() => shownTotal) };
    const tween = gsap.to(counter, {
      v: target,
      duration: 0.55,
      ease: EASE_OUT,
      onUpdate: () => (shownTotal = Math.round(counter.v)),
    });
    return () => tween.kill();
  });

  /** Tear along the perforation, then open the form holding the plan. */
  function tear(): void {
    if (!bookingOpen || tearing) return;
    tearing = true;
    const go = () => {
      const date = visitPlan.date;
      if (date) {
        const [y, m] = date.split('-').map(Number);
        booking.calYear = y;
        booking.calMonth = m - 1;
        booking.selectDate(date, false);
      }
      booking.updateVisitorCount(visitPlan.visitors);
      navigate('booking');
    };
    if (reduced()) return go();
    gsap
      .timeline({ onComplete: go })
      .to(body, { y: -10, rotate: -0.8, duration: 0.3, ease: 'power2.out' }, 0)
      .to(stub, { y: 130, x: 34, rotate: 12, opacity: 0, duration: 0.62, ease: 'power2.in' }, 0.05);
  }
</script>

<section bind:this={root} id="home-ticket" class="ticket-stage relative overflow-hidden" aria-labelledby="home-ticket-title">
  <div class="ticket-lamp pointer-events-none absolute inset-0" aria-hidden="true"></div>

  <div
    class="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:min-h-[100svh] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-14"
  >
    <div>
      <h2 id="home-ticket-title" class="home-h2 ticket-ink">{t('ticketHeading')}</h2>
      <p class="ticket-soft mt-4 max-w-md text-base leading-relaxed sm:text-lg">{t('ticketSub')}</p>
      <button type="button" class="ticket-link mt-8" onclick={() => navigate('table-booking')}>{t('ticketTableLink')}</button>
    </div>

    <div class="relative mx-auto w-full max-w-[29rem]">
      <!-- The printer slot the ticket feeds out of. -->
      <div class="slot relative z-10 h-4 rounded-full" aria-hidden="true"></div>

      <div class="feed -mt-2">
        <div bind:this={paper}>
          <article class="ticket relative" aria-label={t('ticketTitle')}>
            <div bind:this={body} class="ticket-body relative px-6 pb-6 pt-8 sm:px-8">
              <div bind:this={stamp} class="stamp absolute right-6 top-6 h-20 w-20" aria-hidden="true">
                <img src="/cida-logo-128.webp" width="80" height="80" alt="" class="h-full w-full rounded-full" />
              </div>

              <p class="paper-soft text-xs font-medium">{t('homeHeroKicker')}</p>
              <h3 class="paper-ink mt-1 text-2xl font-semibold tracking-tight">{t('ticketTitle')}</h3>

              <div class="dots my-6" aria-hidden="true"></div>

              <!-- Date -->
              <p class="paper-soft text-xs font-semibold uppercase tracking-wide">{t('ticketDate')}</p>
              {#if visitPlan.date}
                <div class="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                  <p class="paper-ink text-xl font-semibold">
                    {formatDateIn(visitPlan.date, i18n.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <button type="button" class="paper-link text-sm" onclick={() => (visitPlan.date = null)}>{t('ticketChange')}</button>
                </div>
              {:else if quickDays.length > 0}
                <div class="mt-3 flex flex-wrap gap-2">
                  {#each quickDays as day (day.date)}
                    <button type="button" class="day-chip" onclick={() => visitPlan.toggleDate(day.date)}>
                      {formatDateIn(day.date, i18n.lang, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </button>
                  {/each}
                </div>
              {:else}
                <p class="paper-soft mt-2 text-sm">{t('ticketNoDates')}</p>
              {/if}

              <div class="dots my-6" aria-hidden="true"></div>

              <!-- Party -->
              <p class="paper-soft text-xs font-semibold uppercase tracking-wide">{t('ticketParty')}</p>
              <ul class="mt-3 flex flex-col gap-3">
                {#each rows as row (row.field)}
                  <li class="flex items-center justify-between gap-4">
                    <span class="min-w-0">
                      <span class="paper-ink block text-sm font-medium leading-snug">{row.label}</span>
                      <span class="paper-soft block text-xs">{row.price}</span>
                    </span>
                    <span class="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        class="step-btn"
                        aria-label={tc('ticketDecrease', { label: row.label })}
                        disabled={visitPlan[row.field] <= (row.field === 'adults' ? 1 : 0)}
                        onclick={() => visitPlan.adjust(row.field, -1)}
                      >
                        <Minus class="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span class="paper-ink relative inline-flex w-8 justify-center overflow-hidden text-lg font-semibold tabular-nums" aria-live="polite">
                        {#key visitPlan[row.field]}
                          <span in:fly={{ y: 10, duration: 220 }}>{visitPlan[row.field]}</span>
                        {/key}
                      </span>
                      <button
                        type="button"
                        class="step-btn"
                        aria-label={tc('ticketIncrease', { label: row.label })}
                        disabled={visitPlan.visitors >= MAX_VISITORS}
                        onclick={() => visitPlan.adjust(row.field, 1)}
                      >
                        <Plus class="h-4 w-4" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                {/each}
                <li class="flex items-center justify-between gap-4">
                  <span class="min-w-0">
                    <span class="paper-ink block text-sm font-medium leading-snug">{t('homePricePrisoner')}</span>
                    <span class="paper-soft block text-xs">{baht(PRICE_PER_PERSON)}</span>
                  </span>
                  <span class="paper-ink w-[7.5rem] text-center text-lg font-semibold tabular-nums">1</span>
                </li>
              </ul>
              {#if visitPlan.visitors >= MAX_VISITORS}
                <p class="paper-soft mt-3 text-xs">{tc('ticketMax', { n: MAX_VISITORS })}</p>
              {/if}

              <div class="dots my-6" aria-hidden="true"></div>

              <!-- Total -->
              <div class="flex items-end justify-between gap-4" aria-live="polite">
                <p class="paper-ink text-base font-semibold">{t('ticketTotal')}</p>
                <p class="paper-ink text-4xl font-semibold leading-none tracking-tight tabular-nums">{baht(shownTotal)}</p>
              </div>
              <p class="paper-soft mt-3 text-xs leading-relaxed">{t('homePriceSub')} · {t('ticketNamesNote')}</p>
              <p class="paper-soft mt-2 text-xs leading-relaxed">{t('homeRule1')} · {t('homeRule2')}</p>
            </div>

            <!-- The stub: torn off along the perforation to book. -->
            <div bind:this={stub} class="ticket-stub px-6 pb-6 pt-5 sm:px-8">
              <p class="paper-soft mb-3 flex items-center gap-1.5 text-xs">
                <Scissors class="h-3.5 w-3.5" aria-hidden="true" />
                {bookingOpen ? t('ticketTearHint') : t('homeStatusBookingClosed')}
              </p>
              <button type="button" class="tear-btn" disabled={!bookingOpen || tearing} onclick={tear}>
                {t('homeCtaBook')}
                <ArrowRight class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .ticket-stage {
    background: #160909;
    --paper: #f8f3ec;
    --paper-ink: #2b1615;
    --paper-soft: #6b5450;
  }
  .ticket-ink {
    color: #f7ede6;
  }
  .ticket-soft {
    color: #d8c2ba;
  }
  .ticket-lamp {
    background:
      radial-gradient(38% 52% at 72% 50%, rgba(255, 173, 112, 0.18), rgba(255, 173, 112, 0) 70%),
      radial-gradient(70% 80% at 80% 60%, rgba(169, 41, 40, 0.32), rgba(169, 41, 40, 0) 70%);
  }
  .ticket-link {
    color: #f7ede6;
    text-decoration: underline;
    text-decoration-color: rgba(247, 237, 230, 0.35);
    text-underline-offset: 0.3em;
    min-height: 2.75rem;
    cursor: pointer;
    text-align: left;
  }
  .ticket-link:focus-visible {
    outline: 2px solid #f2b8a8;
    outline-offset: 3px;
  }

  .slot {
    background: linear-gradient(180deg, #050202, #2a1212);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 2px 4px rgba(0, 0, 0, 0.8);
  }
  /* Paper above the slot stays hidden; below it, the ticket and its shadow are free. */
  .feed {
    clip-path: inset(0 -80px -260px -80px);
  }

  .ticket {
    filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.55));
  }
  .ticket-body,
  .ticket-stub {
    background: var(--paper);
  }
  /* Notches cut into both halves where the perforation runs. */
  .ticket-body {
    border-radius: 18px 18px 0 0;
    -webkit-mask:
      radial-gradient(circle 13px at 0 100%, transparent 98%, #000) left / 51% 100% no-repeat,
      radial-gradient(circle 13px at 100% 100%, transparent 98%, #000) right / 51% 100% no-repeat;
    mask:
      radial-gradient(circle 13px at 0 100%, transparent 98%, #000) left / 51% 100% no-repeat,
      radial-gradient(circle 13px at 100% 100%, transparent 98%, #000) right / 51% 100% no-repeat;
  }
  .ticket-stub {
    border-radius: 0 0 18px 18px;
    background-image: linear-gradient(90deg, var(--paper-soft) 50%, transparent 50%);
    background-size: 10px 1.5px;
    background-repeat: repeat-x;
    background-position: 0 0;
    background-color: var(--paper);
    -webkit-mask:
      radial-gradient(circle 13px at 0 0, transparent 98%, #000) left / 51% 100% no-repeat,
      radial-gradient(circle 13px at 100% 0, transparent 98%, #000) right / 51% 100% no-repeat;
    mask:
      radial-gradient(circle 13px at 0 0, transparent 98%, #000) left / 51% 100% no-repeat,
      radial-gradient(circle 13px at 100% 0, transparent 98%, #000) right / 51% 100% no-repeat;
  }
  .paper-ink {
    color: var(--paper-ink);
  }
  .paper-soft {
    color: var(--paper-soft);
  }
  /* Short laptop screens: the held ticket must fit whole, so tighten its rhythm. */
  @media (min-width: 1024px) and (max-height: 860px) {
    .ticket-body {
      padding-top: 1.5rem;
      padding-bottom: 1.1rem;
    }
    .ticket-body :global(.dots) {
      margin-block: 0.9rem;
    }
    .ticket-stub {
      padding-top: 0.9rem;
      padding-bottom: 1.1rem;
    }
  }
  .dots {
    height: 1.5px;
    background-image: radial-gradient(circle, rgba(107, 84, 80, 0.45) 1px, transparent 1.4px);
    background-size: 7px 1.5px;
  }

  /* An ink stamp: the seal in one colour, slightly translucent, pressed at an angle. */
  .stamp {
    transform: rotate(-12deg);
    opacity: 0.85;
  }
  .stamp img {
    filter: grayscale(1) sepia(1) saturate(7) hue-rotate(-38deg) brightness(0.72) contrast(1.4);
    mix-blend-mode: multiply;
    border: 2px solid rgba(169, 41, 40, 0.55);
  }

  .paper-link {
    color: #a92928;
    text-decoration: underline;
    text-underline-offset: 0.25em;
    cursor: pointer;
  }
  .day-chip {
    min-height: 2.5rem;
    padding: 0 0.9rem;
    border-radius: 999px;
    border: 1px solid rgba(107, 84, 80, 0.35);
    color: var(--paper-ink);
    font-size: 0.875rem;
    cursor: pointer;
    transition:
      background-color 150ms cubic-bezier(0.23, 1, 0.32, 1),
      border-color 150ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .step-btn {
    display: inline-flex;
    height: 2.5rem;
    width: 2.5rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(107, 84, 80, 0.35);
    color: var(--paper-ink);
    cursor: pointer;
    transition:
      background-color 150ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .step-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  @media (hover: hover) and (pointer: fine) {
    .day-chip:hover,
    .step-btn:not(:disabled):hover {
      background: rgba(169, 41, 40, 0.08);
      border-color: rgba(169, 41, 40, 0.5);
    }
    .paper-link:hover {
      color: #8b2020;
    }
  }
  .day-chip:active,
  .step-btn:not(:disabled):active {
    transform: scale(0.94);
  }

  .tear-btn {
    display: inline-flex;
    width: 100%;
    min-height: 3.25rem;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 999px;
    background: #a92928;
    color: #fff;
    font-weight: 600;
    font-size: 1.05rem;
    cursor: pointer;
    box-shadow: 0 12px 24px -12px rgba(169, 41, 40, 0.9);
    transition:
      background-color 150ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .tear-btn:disabled {
    background: #9b8a86;
    box-shadow: none;
    cursor: not-allowed;
  }
  @media (hover: hover) and (pointer: fine) {
    .tear-btn:not(:disabled):hover {
      background: #8b2020;
    }
  }
  .tear-btn:not(:disabled):active {
    transform: scale(0.98);
  }
  .day-chip:focus-visible,
  .step-btn:focus-visible,
  .tear-btn:focus-visible,
  .paper-link:focus-visible {
    outline: 2px solid #a92928;
    outline-offset: 3px;
  }
</style>
