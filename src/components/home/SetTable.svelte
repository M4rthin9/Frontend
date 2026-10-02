<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { booking, PRICE_CHILD_5_8, PRICE_PER_PERSON } from '../../lib/store/booking.svelte';
  import { MAX_VISITORS, visitPlan } from '../../lib/store/visitPlan.svelte';
  import { formatDateIn } from '../../lib/utils/date';
  import { EASE_OUT, gsap } from '../../lib/motion';
  import Headline from './Headline.svelte';

  let leaving = $state(false);
  let shownTotal = $state(visitPlan.total);

  const bookingOpen = $derived(ui.publicSettings.bookingWindow.open);
  const quickDays = $derived(visitPlan.freeDays.slice(0, 4));
  const baht = (n: number) => tc('homePriceBaht', { n: n.toLocaleString('en-US') });
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rows = $derived([
    { field: 'adults' as const, label: t('homePriceAdult'), price: baht(PRICE_PER_PERSON) },
    { field: 'kids58' as const, label: t('homePriceChild58'), price: baht(PRICE_CHILD_5_8) },
    { field: 'kidsUnder5' as const, label: t('homePriceChildU5'), price: t('homePriceFree') },
  ]);

  // Everyone at the table. Adults get the courses in turn, children a smaller
  // plate, the little ones a bowl. Ids are per kind, so adding one guest only
  // serves one plate; the others glide to their new seats.
  const COURSES = ['salmon', 'prawn', 'scallop', 'salad'];
  const guests = $derived([
    ...Array.from({ length: visitPlan.adults }, (_, i) => ({ id: `a${i}`, img: COURSES[i % COURSES.length], size: 1 })),
    ...Array.from({ length: visitPlan.kids58 }, (_, i) => ({ id: `k${i}`, img: 'salad', size: 0.8 })),
    ...Array.from({ length: visitPlan.kidsUnder5 }, (_, i) => ({ id: `u${i}`, img: 'soup', size: 0.6 })),
  ]);

  /**
   * Seats alternate between the two long sides, filling outward from the head
   * of the table where the prisoner sits. Spacing and plate size follow the
   * party: a small party sits close with large plates, a full table packs
   * tighter, and every plate glides to its new place. Landscape (wide screens)
   * and portrait (phones) layouts are both given, in percent of the table and
   * plate widths in cqw; CSS picks one.
   */
  const cols = $derived(Math.max(2, Math.ceil(guests.length / 2)));
  const lStep = $derived(Math.min(22, 56 / (cols - 1)));
  const pStep = $derived(Math.min(20, 60 / (cols - 1)));
  // The whole setting, head plate to last seat, stays centred on the cloth.
  const lOff = $derived(50 - (11 + 30 + (cols - 1) * lStep) / 2);
  const pOff = $derived(50 - (11 + 30 + (cols - 1) * pStep) / 2);

  function seat(s: number) {
    const side = s % 2;
    const col = Math.floor(s / 2);
    return {
      lx: 30 + col * lStep + lOff,
      ly: side ? 76 : 24,
      lr: side ? 0 : 180,
      lw: Math.min(17, lStep * 0.8),
      px: side ? 77 : 23,
      py: 30 + col * pStep + pOff,
      pw: Math.min(25, pStep * (4 / 3) * 0.8),
    };
  }

  /** A plate arrives from the diner's side of the table, turning as it is set down. */
  function serve(_node: HTMLElement, { side }: { side: number }) {
    const portrait = !window.matchMedia('(min-width: 640px)').matches;
    const dist = 70;
    const dx = portrait ? (side ? dist : -dist) : 0;
    const dy = portrait ? 0 : side ? dist : -dist;
    return {
      duration: reduced() ? 0 : 560,
      easing: cubicOut,
      css: (tt: number, u: number) =>
        `transform: translate(${u * dx}px, ${u * dy}px) rotate(${u * -24}deg) scale(${1 + u * 0.1}); opacity: ${Math.min(1, tt * 1.8)}`,
    };
  }

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

  onMount(() => visitPlan.loadCounts());

  /** Open the form holding the plan: the date and the number of visitors. */
  function book(): void {
    if (!bookingOpen || leaving) return;
    leaving = true;
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
    // The table is ready: every plate gives a small nod before the form opens.
    gsap
      .timeline({ onComplete: go })
      .to('[data-setting]', { scale: 1.08, duration: 0.18, ease: 'power2.out', stagger: 0.03 })
      .to('[data-setting]', { scale: 1, duration: 0.25, ease: 'power2.in', stagger: 0.03 }, 0.18);
  }
</script>

<section id="home-table" data-chapter="ctChTable" class="scroll-mt-4 bg-background-subtle py-20 sm:py-28" aria-labelledby="home-table-title">
  <!-- Phones read heading, table, controls; wide screens put the table beside both. -->
  <div class="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-x-14 lg:gap-y-0">
    <div class="lg:col-start-1 lg:row-start-1">
      <p class="ct-label">{t('ctChTable')}</p>
      <Headline id="home-table-title" text={t('ctTableTitle')} class="ct-h2 mt-4" />
      <p class="mt-3 max-w-md text-base font-light leading-relaxed text-text-secondary">{t('ctTableSub')}</p>
    </div>

    <div class="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
      <!-- The table from above. Decorative: the controls beside it carry the same facts. -->
      <div class="cloth relative mx-auto w-full" aria-hidden="true">
        <!-- The seat already set for the person being visited. -->
        <div class="setting head" style="--hl: {11 + lOff}%; --hp: {11 + pOff}%; --lw: 16; --pw: 22; --s: 1">
          <div data-setting class="plate"><img src="/chef/plate-main.webp" alt="" width="240" height="240" /></div>
          <span class="place-card">{t('ctTableSeatFor')}</span>
        </div>

        {#each guests as g, s (g.id)}
          {@const p = seat(s)}
          <div
            class="setting"
            style="--lx: {p.lx}%; --ly: {p.ly}%; --lr: {p.lr}deg; --lw: {p.lw}; --px: {p.px}%; --py: {p.py}%; --pw: {p.pw}; --s: {g.size}"
          >
            <div in:serve={{ side: s % 2 }} out:serve={{ side: s % 2 }}>
              <div data-setting class="plate"><img src="/chef/plate-{g.img}.webp" alt="" width="240" height="240" /></div>
            </div>
          </div>
        {/each}

        <!-- The reserved card in the middle of the table turns over when the date changes. -->
        <div class="tent" style="--tl: {30 + ((cols - 1) * lStep) / 2 + lOff}%; --tp: {30 + ((cols - 1) * pStep) / 2 + pOff}%">
          {#key visitPlan.date}
            <div class="tent-card" in:fly={{ y: -10, duration: reduced() ? 0 : 380 }}>
              <span class="font-book text-[0.7rem] font-bold uppercase tracking-[0.28em]">Reserved</span>
              <span class="mt-1 block text-[0.78rem] leading-tight">
                {visitPlan.date
                  ? formatDateIn(visitPlan.date, i18n.lang, { weekday: 'short', day: 'numeric', month: 'short' })
                  : t('ctTablePickDate')}
              </span>
              <span class="mt-0.5 block text-[0.7rem] text-[var(--ct-ink-3)]">{tc('ctTableSeats', { n: visitPlan.visitors + 1 })}</span>
            </div>
          {/key}
        </div>
      </div>
    </div>

    <div class="lg:col-start-1 lg:row-start-2">
      <!-- Date -->
      <div class="border-t border-border-strong pt-5 lg:mt-8">
        <p class="text-xs font-medium tracking-[0.06em] text-text-tertiary">{t('ticketDate')}</p>
        {#if visitPlan.date}
          <div class="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <p class="text-lg font-medium">
              {formatDateIn(visitPlan.date, i18n.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <button type="button" class="ct-link min-h-0 text-sm" onclick={() => (visitPlan.date = null)}>{t('ticketChange')}</button>
          </div>
        {:else if quickDays.length > 0}
          <div class="mt-3 flex flex-wrap gap-2">
            {#each quickDays as day (day.date)}
              <button type="button" class="chip" onclick={() => visitPlan.toggleDate(day.date)}>
                {formatDateIn(day.date, i18n.lang, { weekday: 'short', day: 'numeric', month: 'short' })}
              </button>
            {/each}
          </div>
        {:else}
          <p class="mt-2 text-sm text-text-secondary">{t('ticketNoDates')}</p>
        {/if}
      </div>

      <!-- Party -->
      <div class="mt-6 border-t border-border-subtle pt-5">
        <p class="text-xs font-medium tracking-[0.06em] text-text-tertiary">{t('ticketParty')}</p>
        <ul class="mt-3 flex flex-col gap-3">
          <li class="flex items-center justify-between gap-4">
            <span class="min-w-0">
              <span class="block text-sm font-medium leading-snug">{t('homePricePrisoner')}</span>
              <span class="block text-xs text-text-tertiary">{baht(PRICE_PER_PERSON)}</span>
            </span>
            <span class="w-[7.5rem] text-center font-book text-xl font-bold tabular-nums">1</span>
          </li>
          {#each rows as row (row.field)}
            <li class="flex items-center justify-between gap-4">
              <span class="min-w-0">
                <span class="block text-sm font-medium leading-snug">{row.label}</span>
                <span class="block text-xs text-text-tertiary">{row.price}</span>
              </span>
              <span class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="step"
                  aria-label={tc('ticketDecrease', { label: row.label })}
                  disabled={visitPlan[row.field] <= (row.field === 'adults' ? 1 : 0)}
                  onclick={() => visitPlan.adjust(row.field, -1)}
                >
                  <Minus class="h-4 w-4" aria-hidden="true" />
                </button>
                <span class="relative inline-flex w-9 justify-center overflow-hidden font-book text-xl font-bold tabular-nums" aria-live="polite">
                  {#key visitPlan[row.field]}
                    <span in:fly={{ y: 10, duration: 220 }}>{visitPlan[row.field]}</span>
                  {/key}
                </span>
                <button
                  type="button"
                  class="step"
                  aria-label={tc('ticketIncrease', { label: row.label })}
                  disabled={visitPlan.visitors >= MAX_VISITORS}
                  onclick={() => visitPlan.adjust(row.field, 1)}
                >
                  <Plus class="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          {/each}
        </ul>
        {#if visitPlan.visitors >= MAX_VISITORS}
          <p class="mt-3 text-xs text-text-tertiary">{tc('ticketMax', { n: MAX_VISITORS })}</p>
        {/if}
      </div>

      <!-- Total and the action -->
      <div class="mt-6 border-t border-border-strong pt-5">
        <div class="flex items-end justify-between gap-4" aria-live="polite">
          <p class="text-base font-medium">{t('ticketTotal')}</p>
          <p class="font-book text-[2.6rem] font-bold leading-none tabular-nums">{baht(shownTotal)}</p>
        </div>
        <p class="mt-3 text-xs font-light leading-relaxed text-text-tertiary">{t('homePriceSub')} · {t('ticketNamesNote')}</p>
        <p class="mt-1 text-xs font-light leading-relaxed text-text-tertiary">{t('homeRule1')} · {t('homeRule2')}</p>

        <button type="button" class="ct-btn ct-btn-orange mt-6 min-h-[3.4rem] w-full text-[1.05rem]" disabled={!bookingOpen || leaving} onclick={book}>
          {bookingOpen ? t('ctTableBook') : t('homeStatusBookingClosed')}
          {#if bookingOpen}<ArrowRight class="ct-nudge h-4 w-4" aria-hidden="true" />{/if}
        </button>
        <button type="button" class="ct-link mt-3 text-left text-sm" onclick={() => navigate('table-booking')}>{t('ticketTableLink')}</button>
      </div>
    </div>
  </div>
</section>

<style>
  /* Linen from above: a fine weave, the pressed folds, a soft fall-off at the edges. */
  .cloth {
    container-type: inline-size;
    aspect-ratio: 3 / 4;
    max-width: 26rem;
    background-color: #f5f6f5;
    background-image:
      repeating-linear-gradient(0deg, rgba(35, 31, 32, 0.022) 0 1px, transparent 1px 3px),
      repeating-linear-gradient(90deg, rgba(35, 31, 32, 0.018) 0 1px, transparent 1px 3px),
      linear-gradient(90deg, transparent 49.7%, rgba(35, 31, 32, 0.06) 50%, transparent 50.3%),
      linear-gradient(0deg, transparent 33.2%, rgba(35, 31, 32, 0.045) 33.4%, transparent 33.6%),
      linear-gradient(0deg, transparent 66.4%, rgba(35, 31, 32, 0.045) 66.6%, transparent 66.8%),
      radial-gradient(120% 90% at 50% 40%, rgba(255, 255, 255, 0.7), rgba(35, 31, 32, 0.05));
    box-shadow:
      0 0 0 1px rgba(35, 31, 32, 0.06),
      0 40px 60px -36px rgba(35, 31, 32, 0.45);
  }
  @media (min-width: 640px) {
    .cloth {
      aspect-ratio: 16 / 10;
      max-width: none;
    }
  }

  .setting {
    position: absolute;
    left: var(--px);
    top: var(--py);
    width: calc(var(--pw) * 1cqw * var(--s));
    transform: translate(-50%, -50%);
    transition:
      left 520ms var(--ct-ease),
      top 520ms var(--ct-ease),
      width 520ms var(--ct-ease);
  }
  .setting.head {
    left: 50%;
    top: var(--hp);
    transform: translate(-50%, -50%);
  }
  @media (min-width: 640px) {
    .setting {
      left: var(--lx);
      top: var(--ly);
      width: calc(var(--lw) * 1cqw * var(--s));
      transform: translate(-50%, -50%) rotate(var(--lr));
    }
    .setting.head {
      left: var(--hl);
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }

  /* Matte black stoneware: the rim is drawn, the food inside is the book's own plate. */
  .plate {
    aspect-ratio: 1;
    padding: 9%;
    border-radius: 999px;
    background: radial-gradient(circle at 35% 30%, #2c2829, #161314 70%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 1.4cqw 2.4cqw -0.6cqw rgba(35, 31, 32, 0.5);
  }
  .plate img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 999px;
  }
  /* Knife on the right, fork on the left, as laid for the diner. */
  .setting::before,
  .setting::after {
    content: '';
    position: absolute;
    top: 18%;
    width: 3.5%;
    height: 64%;
    border-radius: 999px;
    background: linear-gradient(90deg, #b9bdbe, #e6e8e8 45%, #a9adae);
    box-shadow: 0 0.5cqw 0.8cqw -0.3cqw rgba(35, 31, 32, 0.35);
  }
  .setting::before {
    left: -12%;
  }
  .setting::after {
    right: -12%;
  }
  .setting.head::before,
  .setting.head::after {
    display: none;
  }

  .place-card {
    position: absolute;
    left: 50%;
    top: calc(100% + 0.6rem);
    transform: translateX(-50%);
    padding: 0.2rem 0.55rem;
    border-radius: 3px;
    background: #fff;
    color: var(--ct-ink);
    font-size: 0.72rem;
    white-space: nowrap;
    box-shadow: 0 6px 12px -6px rgba(35, 31, 32, 0.4);
  }

  /* Centred on the seats in use, so the card stays between the two rows. */
  .tent {
    position: absolute;
    left: 50%;
    top: var(--tp);
    transform: translate(-50%, -50%);
    transition:
      left 520ms var(--ct-ease),
      top 520ms var(--ct-ease);
  }
  @media (min-width: 640px) {
    .tent {
      left: var(--tl);
      top: 50%;
    }
  }
  .tent-card {
    min-width: 6.5rem;
    padding: 0.55rem 0.8rem 0.6rem;
    border-radius: 3px;
    background: linear-gradient(180deg, #ffffff 0 48%, #eef0ef 52% 100%);
    color: var(--ct-ink);
    text-align: center;
    box-shadow:
      0 0 0 1px rgba(35, 31, 32, 0.08),
      0 12px 18px -10px rgba(35, 31, 32, 0.45);
  }

  .chip {
    min-height: 2.5rem;
    padding: 0 0.95rem;
    border-radius: 999px;
    border: 1px solid var(--app-border-strong);
    background: var(--surface);
    font-size: 0.875rem;
    cursor: pointer;
    transition:
      border-color 150ms var(--ct-ease),
      transform 120ms var(--ct-ease);
  }
  .step {
    display: inline-flex;
    height: 2.75rem;
    width: 2.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid var(--app-border-strong);
    background: var(--surface);
    cursor: pointer;
    transition:
      border-color 150ms var(--ct-ease),
      transform 120ms var(--ct-ease);
  }
  .step:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  @media (hover: hover) and (pointer: fine) {
    .chip:hover,
    .step:not(:disabled):hover {
      border-color: var(--ct-ink);
    }
  }
  .chip:active,
  .step:not(:disabled):active {
    transform: scale(0.94);
  }
  .chip:focus-visible,
  .step:focus-visible {
    outline: 2px solid var(--ct-orange);
    outline-offset: 3px;
  }
</style>
