<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';

  let root: HTMLElement;
  let track: HTMLElement;

  // A tasting menu in course order. Every plate gets the same label schema:
  // the course, then the dish. Labels describe, they never sell.
  const dishes = $derived([
    { img: '/menu/prawn-top-800.webp', w: 800, h: 814, course: t('courseStarter'), name: t('dishPrawn') },
    { img: '/menu/scallop-1000.webp', w: 1000, h: 424, course: t('courseAppetiser'), name: t('dishScallop') },
    { img: '/menu/salad-800.webp', w: 800, h: 414, course: t('courseSalad'), name: t('dishSalad') },
    { img: '/menu/salmon-top-800.webp', w: 800, h: 891, course: t('courseMain'), name: t('dishSalmon') },
    { img: '/menu/main-set-800.webp', w: 800, h: 596, course: t('courseSet'), name: t('dishMainSet') },
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
  class="kitchen relative overflow-hidden border-t border-border-subtle lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center"
  aria-labelledby="home-kitchen"
>
  <div class="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24 lg:pt-20">
    <p class="home-kicker">{t('homeKitchenKicker')}</p>
    <h2 id="home-kitchen" class="home-h2 mt-4">{t('homeKitchenHeading')}</h2>
    <p class="mt-3 max-w-xl text-base leading-relaxed text-text-secondary">{t('homeKitchenSub')}</p>
  </div>

  <ul
    bind:this={track}
    class="kitchen-track flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-16 pt-10 sm:px-6 sm:pb-24 lg:gap-8 lg:pb-20 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] lg:pr-[12vw]"
  >
    {#each dishes as dish (dish.img)}
      <li data-dish class="w-[78vw] shrink-0 snap-center sm:w-[22rem] lg:w-[24rem]">
        <figure>
          <div class="plate relative flex aspect-[4/3] items-center justify-center rounded-[1.75rem] p-7">
            <img
              src={dish.img}
              width={dish.w}
              height={dish.h}
              alt={dish.name}
              loading="lazy"
              decoding="async"
              class="dish-img relative h-auto max-h-full w-auto max-w-full"
            />
          </div>
          <figcaption class="mt-6 px-1">
            <span class="course block text-xs font-medium tracking-[0.08em]">{dish.course}</span>
            <span class="home-serif mt-2 block text-xl font-medium leading-snug text-text-primary">{dish.name}</span>
          </figcaption>
        </figure>
      </li>
    {/each}
  </ul>
</section>

<style>
  .kitchen {
    background: var(--hp-bg-2);
  }
  .course {
    color: var(--hp-gold);
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
      radial-gradient(58% 55% at 50% 58%, rgba(255, 196, 140, 0.14), rgba(255, 196, 140, 0) 72%),
      linear-gradient(180deg, #1d1716, #161211);
    border: 1px solid var(--hp-line);
    box-shadow:
      0 1px 0 rgba(255, 236, 214, 0.05) inset,
      0 34px 56px -34px rgba(0, 0, 0, 0.9);
  }
  .dish-img {
    filter: drop-shadow(0 -1px 0 rgba(255, 228, 196, 0.2)) drop-shadow(0 22px 28px rgba(0, 0, 0, 0.6));
    transition: transform 500ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  @media (hover: hover) and (pointer: fine) {
    li:hover .dish-img {
      transform: scale(1.04) rotate(-1deg);
    }
  }
</style>
