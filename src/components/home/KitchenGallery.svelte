<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';

  let root: HTMLElement;
  let track: HTMLElement;

  // Every object gets the same label schema: the dish name, then a plain line
  // in the visitor's language. Labels describe, they never sell.
  const dishes = $derived([
    { img: '/menu/bento-760.webp', w: 760, h: 581, name: t('dishBento'), note: t('dishBentoNote') },
    { img: '/menu/ebi-560.webp', w: 560, h: 495, name: t('dishEbi'), note: t('dishEbiNote') },
    { img: '/menu/kani-mat-760.webp', w: 760, h: 467, name: t('dishKani'), note: t('dishKaniNote') },
    { img: '/menu/tamago-mat-760.webp', w: 760, h: 506, name: t('dishTamago'), note: t('dishTamagoNote') },
    { img: '/menu/tobiko-mat-760.webp', w: 760, h: 507, name: t('dishTobiko'), note: t('dishTobikoNote') },
    { img: '/menu/roll-mat-640.webp', w: 640, h: 352, name: t('dishRoll'), note: t('dishRollNote') },
  ]);

  onMount(() => {
    const mm = gsap.matchMedia(root);

    // Desktop: the row is walked sideways while the section holds.
    mm.add(MQ.desktop, () => {
      gsap.set(track, { overflow: 'visible' });
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    });

    // Everywhere with motion: each plate settles as it arrives.
    mm.add(MQ.motion, () => {
      gsap.from('[data-dish]', {
        opacity: 0,
        y: 40,
        duration: 1.1,
        ease: EASE_OUT,
        stagger: 0.07,
        scrollTrigger: { trigger: root, start: 'top 75%', once: true },
      });
    });

    return () => mm.revert();
  });
</script>

<section
  bind:this={root}
  class="kitchen relative overflow-hidden lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center"
  aria-labelledby="home-kitchen"
>
  <div class="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24 lg:pt-20">
    <h2 id="home-kitchen" class="home-h2 kitchen-ink">{t('homeKitchenHeading')}</h2>
    <p class="kitchen-soft mt-3 max-w-xl text-base leading-relaxed">{t('homeKitchenSub')}</p>
  </div>

  <ul
    bind:this={track}
    class="kitchen-track flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-16 pt-10 sm:px-6 sm:pb-24 lg:gap-8 lg:pb-20 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] lg:pr-[12vw]"
  >
    {#each dishes as dish (dish.img)}
      <li data-dish class="w-[78vw] shrink-0 snap-center sm:w-[22rem] lg:w-[24rem]">
        <figure>
          <div class="plate relative flex aspect-[4/3] items-center justify-center rounded-[1.75rem] p-6">
            <img
              src={dish.img}
              width={dish.w}
              height={dish.h}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              class="relative h-auto max-h-full w-auto max-w-full drop-shadow-[0_24px_30px_rgba(0,0,0,0.5)]"
            />
          </div>
          <figcaption class="mt-5 px-1">
            <span class="kitchen-ink block text-lg font-semibold leading-snug">{dish.name}</span>
            <span class="kitchen-soft mt-1 block text-sm">{dish.note}</span>
          </figcaption>
        </figure>
      </li>
    {/each}
  </ul>
</section>

<style>
  .kitchen {
    background: #1b0c0c;
  }
  .kitchen-ink {
    color: #f7ede6;
  }
  .kitchen-soft {
    color: #cdb4ab;
  }
  .kitchen-track {
    scrollbar-width: none;
  }
  .kitchen-track::-webkit-scrollbar {
    display: none;
  }
  /* Each dish sits on its own lit patch of table, so the row reads as a counter. */
  .plate {
    background:
      radial-gradient(60% 55% at 50% 60%, rgba(255, 173, 112, 0.16), rgba(255, 173, 112, 0) 70%),
      linear-gradient(180deg, #2a1313, #221010);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.06) inset,
      0 30px 50px -30px rgba(0, 0, 0, 0.8);
  }
</style>
