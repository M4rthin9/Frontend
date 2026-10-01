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
        .from('[data-enter="light"]', { opacity: 0, scale: 0.85, duration: 2 }, 0)
        .from('[data-enter="back"]', { opacity: 0, y: 40, duration: 1.6 }, 0.15)
        .from('[data-enter="main"]', { opacity: 0, y: 70, scale: 0.95, duration: 1.7 }, 0.25)
        .from('[data-enter="near"]', { opacity: 0, x: -70, y: 70, rotate: -6, duration: 1.8 }, 0.4)
        .from('[data-enter="line"]', { opacity: 0, y: 16, duration: 1.2, stagger: 0.08 }, 0.2);

      // Natural flow, no pin: the planes part at different rates as the hero
      // leaves, the near bowl fastest, the lamp slowest.
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.5 } })
        .to('[data-scroll="light"]', { yPercent: 18, ease: 'none' }, 0)
        .to('[data-scroll="back"]', { y: -40, scale: 0.95, ease: 'none' }, 0)
        .to('[data-scroll="main"]', { y: -110, ease: 'none' }, 0)
        .to('[data-scroll="near"]', { y: -300, rotate: 6, ease: 'none' }, 0)
        .to('[data-scroll="copy"]', { y: -60, opacity: 0.15, ease: 'none' }, 0);
    });

    mm.add(MQ.finePointer, () => {
      const layers = gsap.utils.toArray<HTMLElement>('[data-depth]', root).map((el) => ({
        depth: Number(el.dataset.depth),
        x: gsap.quickTo(el, 'x', { duration: 1, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: 1, ease: 'power3' }),
      }));
      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const mx = (e.clientX - r.left) / r.width - 0.5;
        const my = (e.clientY - r.top) / r.height - 0.5;
        for (const l of layers) {
          l.x(-mx * 42 * l.depth);
          l.y(-my * 24 * l.depth);
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
  <!-- Far plane: one warm lamp over a dark table, film grain, and a vignette that holds the edges. -->
  <div data-scroll="light" class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
    <div data-depth="0.12" class="absolute inset-0">
      <!-- The institution grounds, graded dark and held well back so the copy and the plates stay in front. -->
      <img
        src="/hero-bg-1920.webp"
        srcset="/hero-bg-1024.webp 1024w, /hero-bg-1920.webp 1920w"
        sizes="100vw"
        alt=""
        fetchpriority="high"
        class="hero-bg absolute inset-0 h-full w-full object-cover"
      />
      <div class="hero-scrim absolute inset-0"></div>
      <div data-enter="light" class="hero-light absolute inset-0"></div>
    </div>
  </div>
  <div class="hero-vignette pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>
  <div class="hero-grain pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

  <div
    class="relative mx-auto grid w-full max-w-6xl gap-4 px-4 pb-6 pt-20 sm:px-6 lg:min-h-[min(100svh,900px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8 lg:pb-16 lg:pt-24"
  >
    <div data-scroll="copy" class="relative z-20">
      <div data-enter="line" class="flex items-center gap-3">
        <img
          src="/cida-logo-128.webp"
          width="44"
          height="44"
          alt="กรมราชทัณฑ์"
          class="h-11 w-11 rounded-full object-cover ring-1 ring-[rgba(214,179,124,0.35)]"
        />
        <img
          src="/logo-white-128.webp"
          width="44"
          height="44"
          alt="CC Cafe"
          class="h-11 w-11 rounded-full object-cover ring-1 ring-[rgba(214,179,124,0.35)]"
        />
        <p class="min-w-0 text-xs leading-snug text-text-secondary sm:text-sm">{t('homeAgency')}</p>
      </div>

      <p data-enter="line" class="home-kicker mt-10 sm:mt-12">{t('homeHeroKicker')}</p>
      <h1 data-enter="line" id="home-title" class="hero-title home-serif mt-4">
        <!-- Phrases are marked with "|" so Thai, which has no spaces, never breaks mid-phrase. -->
        {#each t('homeHeroTitle').split('|') as phrase, i (i)}<span class="inline-block">{phrase}</span>{/each}
      </h1>
      <p data-enter="line" class="mt-6 max-w-[34rem] text-base leading-relaxed text-text-secondary [text-wrap:pretty] sm:text-lg">
        {t('heroSub')}
      </p>

      <div data-enter="line" class="mt-9 flex flex-wrap items-center gap-3">
        <button type="button" class="btn-primary" onclick={() => navigate('booking')}>
          {t('homeCtaBook')}
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" class="btn-ghost" onclick={toDates}>
          {t('homeCtaDates')}
          <ArrowDown class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div data-enter="line" class="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span class="inline-flex items-center gap-2" role="status">
          <span class="relative flex h-2 w-2" aria-hidden="true">
            {#if bookingOpen}
              <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping"></span>
            {/if}
            <span class="relative inline-flex h-2 w-2 rounded-full {bookingOpen ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
          </span>
          <span class="text-text-secondary">{bookingOpen ? t('homeStatusBookingOpen') : t('homeStatusBookingClosed')}</span>
        </span>
        <button type="button" class="hero-link" onclick={() => navigate('status')}>
          <Search class="h-4 w-4" aria-hidden="true" />{t('btnStatus')}
        </button>
        <button type="button" class="hero-link" onclick={() => navigate('table-booking')}>
          <UtensilsCrossed class="h-4 w-4" aria-hidden="true" />{t('btnTableBook')}
          {#if settings.tableBooking.maintenance}
            <span class="rounded-full border border-[rgba(214,179,124,0.35)] px-2 py-0.5 text-[11px] font-medium text-[var(--hp-gold)]">
              {t('tblComingSoonTitle')}
            </span>
          {/if}
        </button>
      </div>
    </div>

    <!-- The table: three photographed plates at three depths. Decorative; the copy carries the meaning. -->
    <div class="hero-stage relative z-10" aria-hidden="true">
      <div data-scroll="back" class="absolute right-[-6%] top-[0%] hidden w-[54%] sm:block">
        <div data-depth="0.35">
          <img
            data-enter="back"
            src="/menu/prawn-1100.webp"
            srcset="/menu/prawn-640.webp 640w, /menu/prawn-1100.webp 1100w"
            sizes="(min-width: 1024px) 30vw, 50vw"
            width="1100"
            height="553"
            alt=""
            class="plate h-auto w-full opacity-75 blur-[2px]"
          />
        </div>
      </div>

      <div data-scroll="main" class="absolute left-1/2 top-[56%] w-[96%] -translate-x-1/2 -translate-y-1/2 sm:w-[88%]">
        <div data-depth="0.6">
          <div data-enter="main" class="relative">
            <div class="hero-shadow absolute inset-x-[6%] bottom-[-9%] h-[30%]"></div>
            <img
              src="/menu/salmon-1600.webp"
              srcset="/menu/salmon-860.webp 860w, /menu/salmon-1600.webp 1600w"
              sizes="(min-width: 1024px) 50vw, 94vw"
              width="1600"
              height="852"
              alt=""
              fetchpriority="high"
              class="plate relative h-auto w-full"
            />
          </div>
        </div>
      </div>

      <div data-scroll="near" class="absolute bottom-[-12%] left-[-14%] w-[52%] sm:bottom-[-8%] sm:left-[-10%] sm:w-[46%]">
        <div data-depth="1">
          <img
            data-enter="near"
            src="/menu/scallop-1000.webp"
            srcset="/menu/scallop-560.webp 560w, /menu/scallop-1000.webp 1000w"
            sizes="(min-width: 1024px) 26vw, 50vw"
            width="1000"
            height="424"
            alt=""
            class="plate h-auto w-full blur-[1.2px]"
          />
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    background: var(--hp-bg);
  }
  .hero-title {
    color: var(--hp-ink);
    font-weight: 500;
    font-size: clamp(2.25rem, 1.2rem + 3.3vw, 4.05rem);
    line-height: 1.2;
    letter-spacing: -0.012em;
    text-wrap: balance;
  }
  /* Latin phrases run longer than Thai: one size down keeps the headline to two lines. */
  :global(html[lang='en']) .hero-title,
  :global(html[lang='vi']) .hero-title {
    font-size: clamp(2.05rem, 1rem + 2.6vw, 3.25rem);
    line-height: 1.14;
    max-width: 21ch;
  }

  .hero-bg {
    object-position: 50% 40%;
    opacity: 0.68;
    filter: saturate(0.85) blur(1px);
    transform: scale(1.04);
  }
  /* Dark on the copy side and at the foot, so text keeps its contrast and the hero melts into the page. */
  .hero-scrim {
    background:
      linear-gradient(90deg, rgba(13, 9, 8, 0.92) 0%, rgba(13, 9, 8, 0.7) 38%, rgba(13, 9, 8, 0.25) 70%, rgba(13, 9, 8, 0.45) 100%),
      linear-gradient(180deg, rgba(13, 9, 8, 0.35) 0%, rgba(13, 9, 8, 0) 30%, rgba(13, 9, 8, 0) 65%, var(--hp-bg, #0d0908) 100%);
  }
  @media (max-width: 1023px) {
    .hero-scrim {
      background: linear-gradient(180deg, rgba(13, 9, 8, 0.82) 0%, rgba(13, 9, 8, 0.6) 45%, rgba(13, 9, 8, 0.4) 70%, var(--hp-bg, #0d0908) 100%);
    }
  }

  /* One lamp over the table: a champagne pool behind the plate, falling off to near black. */
  .hero-light {
    background:
      radial-gradient(40% 44% at 72% 54%, rgba(255, 196, 140, 0.24), rgba(255, 196, 140, 0) 70%),
      radial-gradient(62% 70% at 72% 50%, rgba(120, 38, 30, 0.38), rgba(120, 38, 30, 0) 72%);
  }
  @media (max-width: 1023px) {
    .hero-light {
      background:
        radial-gradient(75% 34% at 50% 80%, rgba(255, 196, 140, 0.22), rgba(255, 196, 140, 0) 70%),
        radial-gradient(100% 50% at 50% 78%, rgba(120, 38, 30, 0.36), rgba(120, 38, 30, 0) 72%);
    }
  }
  .hero-vignette {
    background: radial-gradient(120% 90% at 60% 45%, rgba(0, 0, 0, 0) 55%, rgba(0, 0, 0, 0.55) 100%);
  }
  .hero-grain {
    opacity: 0.06;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .hero-stage {
    aspect-ratio: 6 / 5;
    width: 100%;
  }
  @media (min-width: 1024px) {
    .hero-stage {
      aspect-ratio: auto;
      height: min(72svh, 640px);
    }
  }

  /* Black stoneware disappears into a dark room; the lamp catches its upper rim. */
  .plate {
    filter: drop-shadow(0 -1.5px 0 rgba(255, 228, 196, 0.22)) drop-shadow(0 28px 36px rgba(0, 0, 0, 0.55));
  }
  .hero-shadow {
    background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0) 75%);
    filter: blur(10px);
  }

  .btn-primary,
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 3.1rem;
    padding: 0 1.6rem;
    border-radius: 999px;
    font-weight: 500;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition:
      transform 140ms cubic-bezier(0.23, 1, 0.32, 1),
      background-color 180ms cubic-bezier(0.23, 1, 0.32, 1),
      border-color 180ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .btn-primary {
    background: var(--hp-crimson);
    color: #fff;
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.16) inset,
      0 14px 30px -14px rgba(169, 41, 40, 0.95);
  }
  .btn-ghost {
    border: 1px solid rgba(214, 179, 124, 0.45);
    color: var(--hp-ink);
  }
  @media (hover: hover) and (pointer: fine) {
    .btn-primary:hover {
      background: #bf3330;
    }
    .btn-ghost:hover {
      background: rgba(214, 179, 124, 0.08);
      border-color: rgba(214, 179, 124, 0.75);
    }
  }
  .btn-primary:active,
  .btn-ghost:active {
    transform: scale(0.97);
  }
  .btn-primary:focus-visible,
  .btn-ghost:focus-visible,
  .hero-link:focus-visible {
    outline: 2px solid var(--hp-gold);
    outline-offset: 3px;
  }

  .hero-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.75rem;
    color: var(--hp-ink);
    text-decoration: underline;
    text-decoration-color: rgba(214, 179, 124, 0.4);
    text-underline-offset: 0.35em;
    cursor: pointer;
    transition: text-decoration-color 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  @media (hover: hover) and (pointer: fine) {
    .hero-link:hover {
      text-decoration-color: var(--hp-gold);
    }
  }
</style>
