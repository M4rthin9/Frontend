<script lang="ts">
  import { onMount } from 'svelte';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';
  import Headline from './Headline.svelte';

  let story: HTMLElement;
  let menu: HTMLElement;

  // The book's six plates, in its order. x/y place a marker on the table
  // photograph (percent of the 1600x1096 frame); the dessert is not on it.
  const dishes = $derived([
    { key: 'salad', course: t('courseSalad'), name: t('dishSalad'), x: 18, y: 71.1 },
    { key: 'scallop', course: t('courseCurry'), name: t('dishScallop'), x: 12.8, y: 36.5 },
    { key: 'salmon', course: t('coursePlah'), name: t('dishSalmon'), x: 66.3, y: 59.2 },
    { key: 'prawn', course: t('courseMain'), name: t('dishPrawn'), x: 64.4, y: 26.5 },
    { key: 'rice', course: t('courseSet'), name: t('dishMainSet'), x: 40.6, y: 44.6 },
    { key: 'dessert', course: t('courseDessert'), name: t('dishCheesecake'), x: -1, y: -1 },
  ]);
  const onTable = $derived(dishes.filter((d) => d.x >= 0));
  // The book breaks its stacked lines by hand; a newline in the string marks
  // those breaks, kept on wide screens only.
  const sep = $derived(i18n.lang === 'en' || i18n.lang === 'vi' ? ' ' : '');

  let picked = $state(0);
  const dish = $derived(dishes[picked]);
  const src = (key: string, w: number) =>
    key === 'dessert' ? '/chef/dish-dessert-620.webp' : `/chef/dish-${key}-${w}.webp`;

  /** A plate on the table photograph opens its page in the menu. */
  function fromTable(key: string): void {
    picked = dishes.findIndex((d) => d.key === key);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    menu.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  onMount(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      // The table drifts a little slower than the page; its type sets line by line.
      gsap.fromTo(
        '[data-story-img]',
        { yPercent: -4 },
        {
          yPercent: 4,
          ease: 'none',
          scrollTrigger: { trigger: story, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        },
      );
      gsap.from(story.querySelectorAll('[data-story-line]'), {
        opacity: 0,
        y: 16,
        duration: 1,
        ease: EASE_OUT,
        stagger: 0.08,
        scrollTrigger: { trigger: story, start: 'top 60%', once: true },
      });
      // Opacity only: the markers' transforms belong to CSS (centring, hover).
      gsap.from(story.querySelectorAll('[data-marker]'), {
        opacity: 0,
        duration: 0.6,
        ease: 'power1.out',
        stagger: 0.12,
        scrollTrigger: { trigger: story, start: 'top 45%', once: true },
      });
      gsap.from(menu.querySelectorAll('[data-menu-row]'), {
        opacity: 0,
        x: -18,
        duration: 0.9,
        ease: EASE_OUT,
        stagger: 0.06,
        scrollTrigger: { trigger: menu, start: 'top 70%', once: true },
      });
    });
    return () => mm.revert();
  });
</script>

{#snippet lines(text: string)}{#each text.split('\n') as seg, i (i)}{i > 0 ? sep : ''}<span
      class={i > 0 ? 'lg:block' : ''}>{seg}</span
    >{/each}{/snippet}

<!-- The book's spread "CHEF TABLE ในเรือนจำ": the whole menu from above, the type set on the linen. -->
<section
  bind:this={story}
  id="home-story"
  data-chapter="ctChStory"
  class="relative overflow-hidden"
  aria-labelledby="home-story-title"
>
  <div class="relative mx-auto max-w-[1680px]">
    <div class="table-photo relative aspect-[1600/1096] w-full overflow-hidden">
      <!-- Photo and markers move together, so a marker never slides off its plate. -->
      <div data-story-img class="absolute inset-0 scale-[1.09]">
        <img
          src="/chef/table-1600.webp"
          srcset="/chef/table-900.webp 900w, /chef/table-1600.webp 1600w"
          sizes="(min-width: 1680px) 1680px, 100vw"
          width="1600"
          height="1096"
          alt={t('ctTableAlt')}
          loading="lazy"
          class="absolute inset-0 h-full w-full object-cover"
        />
        {#each onTable as d (d.key)}
          <button
            type="button"
            data-marker
            class="marker absolute"
            style="left: {d.x}%; top: {d.y}%"
            aria-label={tc('ctMenuPick', { dish: d.name })}
            onclick={() => fromTable(d.key)}
          >
            <span class="marker-dot font-book" aria-hidden="true">{dishes.indexOf(d) + 1}</span>
            <span class="marker-cap" aria-hidden="true">{d.name}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- On wide screens the type sits on the linen at the right, right-aligned as in the book. -->
    <div
      class="story-type px-4 pb-4 pt-10 sm:px-6 lg:absolute lg:right-[2.5%] lg:top-[5%] lg:w-[21%] lg:p-0 lg:text-right"
    >
      <h2 id="home-story-title" data-story-line class="ct-masthead story-mast">
        {t('textChefTable1')}<br />{t('textChefTable2')}
      </h2>
      <p data-story-line class="mt-2 text-[1.35em] font-light">{t('ctMastIn')}</p>
      <p data-story-line class="mt-3 font-light leading-snug text-text-secondary">
        {@render lines(t('ctStoryNot'))}
      </p>
      <div class="mt-6 flex flex-col gap-3 leading-snug">
        {#each [t('ctStoryFirst'), t('ctStorySecond')] as line, i (i)}
          {@const [when, where] = line.split('|')}
          <p data-story-line class="font-light">
            <span class="font-medium">{when}</span>{@render lines(where ?? '')}
          </p>
        {/each}
      </div>
    </div>
  </div>

  <div
    class="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-20 pt-8 sm:px-6 sm:pb-24 lg:grid-cols-2 lg:gap-16 lg:pt-16"
  >
    <div>
      <h3 class="text-lg font-medium">{t('ctStoryP1T')}</h3>
      <p class="mt-3 text-base font-light leading-relaxed text-text-secondary">{t('ctStoryP1')}</p>
    </div>
    <div>
      <h3 class="text-lg font-medium">{t('ctStoryP2T')}</h3>
      <p class="mt-3 text-base font-light leading-relaxed text-text-secondary">{t('ctStoryP2')}</p>
    </div>
  </div>
</section>

<!-- The book gives each plate its own page. Here the reader turns them. -->
<section
  bind:this={menu}
  id="home-menu"
  data-chapter="ctChMenu"
  class="scroll-mt-6 bg-background-subtle py-20 sm:py-28"
  aria-labelledby="home-menu-title"
>
  <div
    class="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-0"
  >
    <div class="lg:col-start-1 lg:row-start-1">
      <p class="ct-label">{t('ctChMenu')}</p>
      <Headline id="home-menu-title" text={t('ctMenuTitle')} class="ct-h2 mt-4" />
      <p class="mt-3 max-w-md text-sm font-light leading-relaxed text-text-secondary">
        {t('homeKitchenSub')}
      </p>
    </div>

    <figure class="lg:col-start-2 lg:row-span-2 lg:row-start-1">
      <div class="dish-stage relative aspect-square overflow-hidden">
        {#each dishes as d, i (d.key)}
          <img
            src={src(d.key, 960)}
            srcset={d.key === 'dessert'
              ? undefined
              : `${src(d.key, 560)} 560w, ${src(d.key, 960)} 960w`}
            sizes="(min-width: 1024px) 34rem, 100vw"
            width="960"
            height="960"
            alt={i === picked ? `${d.course} · ${d.name}` : ''}
            aria-hidden={i !== picked}
            loading="lazy"
            decoding="async"
            class="dish-img absolute inset-0 h-full w-full object-cover"
            class:is-picked={i === picked}
          />
        {/each}
      </div>
      <figcaption class="mt-4 flex items-baseline justify-between gap-4" aria-live="polite">
        <span class="min-w-0">
          <span class="block text-xs font-medium tracking-[0.06em] text-[var(--ct-orange-ink)]"
            >{dish.course}</span
          >
          <span class="mt-1 block text-lg font-medium leading-snug">{dish.name}</span>
        </span>
        <span class="shrink-0 font-book text-sm font-bold tabular-nums text-text-tertiary">
          {String(picked + 1).padStart(2, '0')} / {String(dishes.length).padStart(2, '0')}
        </span>
      </figcaption>
    </figure>

    <ol class="border-t border-border-strong lg:col-start-1 lg:row-start-2 lg:mt-10 lg:self-start">
      {#each dishes as d, i (d.key)}
        <li data-menu-row class="border-b border-border-subtle">
          <button
            type="button"
            class="row flex min-h-[4.25rem] w-full items-center gap-5 py-3 text-left"
            class:is-picked={i === picked}
            aria-pressed={i === picked}
            onclick={() => (picked = i)}
            onpointerenter={(e) => e.pointerType === 'mouse' && (picked = i)}
          >
            <span class="num w-8 shrink-0 font-book text-lg font-bold tabular-nums"
              >{String(i + 1).padStart(2, '0')}</span
            >
            <span class="min-w-0 flex-1">
              <span class="block text-xs tracking-[0.06em] text-text-tertiary">{d.course}</span>
              <span class="name block text-base leading-snug sm:text-lg">{d.name}</span>
            </span>
            <span class="bar h-[2px] w-6 shrink-0" aria-hidden="true"></span>
          </button>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .table-photo {
    background: #ccd3d4;
  }
  .story-type {
    font-size: 1.05rem;
  }
  .story-mast {
    font-size: clamp(3.4rem, 15vw, 5rem);
  }
  @media (min-width: 1024px) {
    .story-type {
      font-size: clamp(0.95rem, 1.15vw, 1.3rem);
    }
    .story-mast {
      font-size: min(4.6vw, 5.4rem);
    }
  }

  /* A numbered dot on each plate; its name comes up like the book's captions. */
  .marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    transform: translate(-50%, -50%);
    cursor: pointer;
  }
  .marker-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 999px;
    background: #fff;
    color: var(--ct-ink);
    font-size: 0.9rem;
    box-shadow:
      0 0 0 4px rgba(255, 255, 255, 0.35),
      0 8px 16px -6px rgba(0, 0, 0, 0.5);
    transition:
      transform 200ms var(--ct-ease),
      background-color 200ms var(--ct-ease),
      color 200ms var(--ct-ease);
  }
  .marker-cap {
    position: absolute;
    bottom: calc(100% + 0.1rem);
    left: 50%;
    padding: 0.3rem 0.65rem;
    border-radius: 4px;
    background: #fff;
    color: var(--ct-ink);
    font-size: 0.8rem;
    white-space: nowrap;
    box-shadow: 0 10px 20px -10px rgba(0, 0, 0, 0.45);
    opacity: 0;
    transform: translate(-50%, 6px);
    pointer-events: none;
    transition:
      opacity 180ms var(--ct-ease),
      transform 220ms var(--ct-ease);
  }
  .marker:focus-visible {
    outline: none;
  }
  .marker:focus-visible .marker-dot {
    outline: 2px solid var(--ct-orange);
    outline-offset: 3px;
  }
  .marker:focus-visible .marker-cap {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  @media (hover: hover) and (pointer: fine) {
    .marker:hover .marker-dot {
      transform: scale(1.12);
      background: var(--ct-orange);
    }
    .marker:hover .marker-cap {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  @media (max-width: 639px) {
    .marker-dot {
      width: 1.4rem;
      height: 1.4rem;
      font-size: 0.75rem;
    }
  }

  .dish-stage {
    background: #ccd3d4;
  }
  /* The chosen plate is set down: it turns and settles into place. Leaving is quicker. */
  .dish-img {
    opacity: 0;
    transform: rotate(-5deg) scale(1.16);
    transition:
      opacity 240ms var(--ct-ease),
      transform 240ms var(--ct-ease);
  }
  .dish-img.is-picked {
    opacity: 1;
    transform: none;
    transition:
      opacity 420ms var(--ct-ease),
      transform 900ms var(--ct-ease);
  }
  @media (prefers-reduced-motion: reduce) {
    .dish-img,
    .dish-img.is-picked {
      transform: none;
      transition: opacity 200ms linear;
    }
  }

  .row {
    cursor: pointer;
    color: var(--app-text-secondary);
    transition: color 180ms var(--ct-ease);
  }
  .row .num {
    color: var(--app-text-tertiary);
    transition: color 180ms var(--ct-ease);
  }
  .row .bar {
    background: var(--ct-orange);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 260ms var(--ct-ease);
  }
  .row.is-picked {
    color: var(--app-text);
  }
  .row.is-picked .name {
    font-weight: 500;
  }
  .row.is-picked .num {
    color: var(--ct-orange-ink);
  }
  .row.is-picked .bar {
    transform: none;
  }
  .row:focus-visible {
    outline: 2px solid var(--ct-orange);
    outline-offset: 2px;
  }
</style>
