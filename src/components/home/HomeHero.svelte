<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import Search from '@lucide/svelte/icons/search';
  import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';

  let root: HTMLElement;

  const settings = $derived(ui.publicSettings);
  const bookingOpen = $derived(settings.bookingWindow.open);

  function toDates(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('home-dates')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  // Each plane is three nested boxes: [data-scroll] travels with the page,
  // [data-depth] answers the pointer, [data-enter] plays the entrance. Keeping
  // them apart means no two tweens ever fight over one element's transform.
  onMount(() => {
    const mm = gsap.matchMedia(root);

    mm.add(MQ.motion, () => {
      gsap
        .timeline({ defaults: { ease: EASE_OUT } })
        .from('[data-enter="light"]', { opacity: 0, scale: 0.8, duration: 1.6 }, 0)
        .from('[data-enter="mat"]', { opacity: 0, y: 50, duration: 1.3 }, 0.1)
        .from('[data-enter="bento"]', { opacity: 0, y: 80, scale: 0.94, duration: 1.4 }, 0.18)
        .from('[data-enter="ebi"]', { opacity: 0, x: 80, y: 90, rotate: 10, duration: 1.5 }, 0.32)
        .from('[data-enter="line"]', { opacity: 0, y: 18, duration: 1, stagger: 0.07 }, 0.12);

      // Natural flow, no pin: the planes simply part at different rates as the
      // hero leaves, the near shrimp fastest, the light slowest.
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 } })
        .to('[data-scroll="light"]', { yPercent: 22, ease: 'none' }, 0)
        .to('[data-scroll="mat"]', { y: -40, scale: 0.94, ease: 'none' }, 0)
        .to('[data-scroll="bento"]', { y: -120, ease: 'none' }, 0)
        .to('[data-scroll="ebi"]', { y: -320, rotate: -8, ease: 'none' }, 0)
        .to('[data-scroll="copy"]', { y: -70, opacity: 0.15, ease: 'none' }, 0);
    });

    mm.add(MQ.finePointer, () => {
      const layers = gsap.utils.toArray<HTMLElement>('[data-depth]', root).map((el) => ({
        depth: Number(el.dataset.depth),
        x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
      }));
      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width - 0.5;
        const my = (e.clientY - r.top) / r.height - 0.5;
        for (const l of layers) {
          l.x(-mx * 46 * l.depth);
          l.y(-my * 26 * l.depth);
        }
      };
      const onLeave = () => layers.forEach((l) => (l.x(0), l.y(0)));
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerleave', onLeave);
      return () => {
        root.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerleave', onLeave);
      };
    });

    return () => mm.revert();
  });
</script>

<section bind:this={root} class="hero relative isolate overflow-hidden" aria-labelledby="home-title">
  <!-- Far plane: one warm lamp over the table, and film grain so the dark ground reads as a room. -->
  <div data-scroll="light" class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
    <div data-depth="0.15" class="absolute inset-0">
      <div data-enter="light" class="hero-light absolute inset-0"></div>
    </div>
  </div>
  <div class="hero-grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

  <div
    class="relative mx-auto grid w-full max-w-6xl gap-6 px-4 pb-6 pt-20 sm:px-6 lg:min-h-[min(100svh,880px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:items-center lg:gap-10 lg:pb-16 lg:pt-24"
  >
    <div data-scroll="copy" class="relative z-20">
      <div data-enter="line" class="flex items-center gap-3">
        <img src="/cida-logo-128.webp" width="44" height="44" alt="กรมราชทัณฑ์" class="h-11 w-11 rounded-full object-cover ring-1 ring-white/15" />
        <img src="/logo-white-128.webp" width="44" height="44" alt="CC Cafe" class="h-11 w-11 rounded-full object-cover ring-1 ring-white/15" />
        <p class="hero-soft min-w-0 text-xs leading-snug sm:text-sm">{t('homeAgency')}</p>
      </div>

      <p data-enter="line" class="hero-kicker mt-8 text-sm font-medium sm:mt-10">{t('homeHeroKicker')}</p>
      <h1 data-enter="line" id="home-title" class="hero-title mt-3">
        <!-- Phrases are marked with "|" so Thai, which has no spaces, never breaks mid-phrase. -->
        {#each t('homeHeroTitle').split('|') as phrase, i (i)}<span class="inline-block">{phrase}</span>{/each}
      </h1>
      <p data-enter="line" class="hero-soft mt-5 max-w-[36rem] text-base leading-relaxed [text-wrap:pretty] sm:text-lg">{t('heroSub')}</p>

      <div data-enter="line" class="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" class="btn-primary" onclick={() => navigate('booking')}>
          {t('homeCtaBook')}
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" class="btn-ghost" onclick={toDates}>
          {t('homeCtaDates')}
          <ArrowDown class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div data-enter="line" class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span class="inline-flex items-center gap-2" role="status">
          <span class="h-2 w-2 rounded-full {bookingOpen ? 'bg-emerald-400' : 'bg-amber-400'}" aria-hidden="true"></span>
          <span class="hero-soft">{bookingOpen ? t('homeStatusBookingOpen') : t('homeStatusBookingClosed')}</span>
        </span>
        <button type="button" class="hero-link" onclick={() => navigate('status')}>
          <Search class="h-4 w-4" aria-hidden="true" />{t('btnStatus')}
        </button>
        <button type="button" class="hero-link" onclick={() => navigate('table-booking')}>
          <UtensilsCrossed class="h-4 w-4" aria-hidden="true" />{t('btnTableBook')}
          {#if settings.tableBooking.maintenance}
            <span class="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold">{t('tblComingSoonTitle')}</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- The table: three photographed planes at three depths. Decorative; the copy carries the meaning. -->
    <div class="hero-stage relative z-10" aria-hidden="true">
      <div data-scroll="mat" class="absolute right-[-4%] top-[2%] hidden w-[58%] sm:block">
        <div data-depth="0.35">
          <img
            data-enter="mat"
            src="/menu/roll-mat-1100.webp"
            srcset="/menu/roll-mat-640.webp 640w, /menu/roll-mat-1100.webp 1100w"
            sizes="(min-width: 1024px) 34vw, 50vw"
            width="1100"
            height="605"
            alt=""
            class="h-auto w-full opacity-80 blur-[1.5px]"
          />
        </div>
      </div>

      <div data-scroll="bento" class="absolute left-1/2 top-[54%] w-[92%] -translate-x-1/2 -translate-y-1/2 sm:w-[84%]">
        <div data-depth="0.6">
          <div data-enter="bento" class="relative">
            <div class="hero-shadow absolute inset-x-[8%] bottom-[-6%] h-[22%]"></div>
            <div class="hero-steam absolute left-[56%] top-[-4%] h-[40%] w-[30%]">
              <span></span><span></span><span></span>
            </div>
            <img
              src="/menu/bento-1400.webp"
              srcset="/menu/bento-760.webp 760w, /menu/bento-1400.webp 1400w"
              sizes="(min-width: 1024px) 46vw, 90vw"
              width="1400"
              height="1070"
              alt=""
              fetchpriority="high"
              class="relative h-auto w-full"
            />
          </div>
        </div>
      </div>

      <div data-scroll="ebi" class="absolute bottom-[-14%] left-[-10%] w-[46%] sm:bottom-[-10%] sm:left-auto sm:right-[-12%] sm:w-[44%]">
        <div data-depth="1">
          <img
            data-enter="ebi"
            src="/menu/ebi-1000.webp"
            srcset="/menu/ebi-560.webp 560w, /menu/ebi-1000.webp 1000w"
            sizes="(min-width: 1024px) 24vw, 46vw"
            width="1000"
            height="884"
            alt=""
            class="h-auto w-full blur-[0.6px] drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    --stage: #160909;
    --stage-ink: #f7ede6;
    --stage-ink-soft: #d8c2ba;
    background: var(--stage);
    color: var(--stage-ink);
  }
  .hero-soft {
    color: var(--stage-ink-soft);
  }
  .hero-kicker {
    color: #f2b8a8;
    letter-spacing: 0.01em;
  }
  .hero-title {
    font-weight: 600;
    font-size: clamp(2.3rem, 1.25rem + 3.9vw, 4.35rem);
    line-height: 1.12;
    letter-spacing: -0.012em;
    text-wrap: balance;
    max-width: 14ch;
  }
  /* Latin phrases run longer than Thai: one size down keeps the headline to two lines. */
  :global(html[lang='en']) .hero-title,
  :global(html[lang='vi']) .hero-title {
    font-size: clamp(2.05rem, 1rem + 2.6vw, 3.1rem);
    max-width: 21ch;
  }

  /* One lamp over the table: a warm pool behind the dish, falling off into oxblood. */
  .hero-light {
    background:
      radial-gradient(42% 46% at 72% 52%, rgba(255, 173, 112, 0.26), rgba(255, 173, 112, 0) 70%),
      radial-gradient(60% 70% at 70% 45%, rgba(169, 41, 40, 0.42), rgba(169, 41, 40, 0) 72%),
      radial-gradient(90% 80% at 0% 0%, rgba(74, 15, 15, 0.9), rgba(74, 15, 15, 0) 60%);
  }
  @media (max-width: 1023px) {
    .hero-light {
      background:
        radial-gradient(70% 34% at 50% 78%, rgba(255, 173, 112, 0.24), rgba(255, 173, 112, 0) 70%),
        radial-gradient(100% 50% at 50% 75%, rgba(169, 41, 40, 0.4), rgba(169, 41, 40, 0) 72%);
    }
  }
  .hero-grain {
    opacity: 0.07;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .hero-stage {
    aspect-ratio: 5 / 4;
    width: 100%;
  }
  @media (min-width: 1024px) {
    .hero-stage {
      aspect-ratio: auto;
      height: min(70svh, 620px);
    }
  }

  /* Contact shadow: the box sits on the table, so its shadow travels with it. */
  .hero-shadow {
    background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0) 75%);
    filter: blur(6px);
  }

  .hero-steam span {
    position: absolute;
    bottom: 0;
    width: 34%;
    height: 70%;
    border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
    filter: blur(8px);
    opacity: 0;
  }
  .hero-steam span:nth-child(1) {
    left: 4%;
  }
  .hero-steam span:nth-child(2) {
    left: 34%;
  }
  .hero-steam span:nth-child(3) {
    left: 62%;
  }
  @media (prefers-reduced-motion: no-preference) {
    .hero-steam span {
      animation: steam 5.4s cubic-bezier(0.23, 1, 0.32, 1) infinite;
    }
    .hero-steam span:nth-child(2) {
      animation-delay: 1.8s;
    }
    .hero-steam span:nth-child(3) {
      animation-delay: 3.6s;
    }
  }
  @keyframes steam {
    0% {
      transform: translateY(20%) scale(0.7);
      opacity: 0;
    }
    30% {
      opacity: 0.22;
    }
    100% {
      transform: translateY(-90%) scale(1.25);
      opacity: 0;
    }
  }

  .btn-primary,
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 3rem;
    padding: 0 1.4rem;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 140ms cubic-bezier(0.23, 1, 0.32, 1),
      background-color 160ms cubic-bezier(0.23, 1, 0.32, 1),
      border-color 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .btn-primary {
    background: #c4302b;
    color: #fff;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.18) inset,
      0 12px 28px -12px rgba(196, 48, 43, 0.9);
  }
  .btn-ghost {
    border: 1px solid rgba(247, 237, 230, 0.28);
    color: var(--stage-ink);
  }
  @media (hover: hover) and (pointer: fine) {
    .btn-primary:hover {
      background: #d63a34;
    }
    .btn-ghost:hover {
      background: rgba(247, 237, 230, 0.08);
      border-color: rgba(247, 237, 230, 0.45);
    }
  }
  .btn-primary:active,
  .btn-ghost:active {
    transform: scale(0.97);
  }
  .btn-primary:focus-visible,
  .btn-ghost:focus-visible,
  .hero-link:focus-visible {
    outline: 2px solid #f2b8a8;
    outline-offset: 3px;
  }

  .hero-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.75rem;
    color: var(--stage-ink);
    text-decoration: underline;
    text-decoration-color: rgba(247, 237, 230, 0.35);
    text-underline-offset: 0.3em;
    cursor: pointer;
    transition: text-decoration-color 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  @media (hover: hover) and (pointer: fine) {
    .hero-link:hover {
      text-decoration-color: currentColor;
    }
  }
</style>
