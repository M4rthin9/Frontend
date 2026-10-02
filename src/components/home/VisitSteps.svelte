<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { MQ, ScrollTrigger, gsap } from '../../lib/motion';
  import Headline from './Headline.svelte';

  let list: HTMLElement;

  const steps = $derived([1, 2, 3, 4, 5].map((n) => ({ title: t(`homeStep${n}T`), desc: t(`homeStep${n}D`) })));

  // Numbered like the book. Each numeral inks in orange as it reaches the
  // middle of the screen; without motion every step is inked from the start.
  onMount(() => {
    const mm = gsap.matchMedia(list);
    mm.add(MQ.motion, () => {
      const items = gsap.utils.toArray<HTMLElement>('[data-step]');
      items.forEach((el) => el.classList.remove('is-inked'));
      items.forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 62%', end: 'max', toggleClass: 'is-inked' }));
      return () => items.forEach((el) => el.classList.add('is-inked'));
    });
    return () => mm.revert();
  });
</script>

<section id="home-steps" data-chapter="ctChSteps" class="py-20 sm:py-28" aria-labelledby="home-steps-title">
  <div class="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
    <div class="lg:sticky lg:top-16 lg:self-start">
      <p class="ct-label">{t('ctChSteps')}</p>
      <Headline id="home-steps-title" text={t('ctStepsTitle')} class="ct-h2 mt-4" />
      <p class="mt-3 max-w-md text-base font-light leading-relaxed text-text-secondary">{t('homeStepsSub')}</p>

      <figure class="mt-10">
        <img
          src="/chef/venue-900.webp"
          srcset="/chef/venue-900.webp 900w, /chef/venue-1600.webp 1600w"
          sizes="(min-width: 1024px) 30rem, 100vw"
          width="1600"
          height="899"
          alt={t('ctVenueAlt')}
          loading="lazy"
          class="aspect-[16/10] w-full object-cover"
        />
        <figcaption class="mt-3 text-xs text-text-tertiary">{t('ctVenueCaption')}</figcaption>
      </figure>
    </div>

    <ol bind:this={list} class="border-t border-border-strong">
      {#each steps as step, i (i)}
        <li data-step class="step is-inked grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 border-b border-border-subtle py-7 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
          <span class="num font-book text-[2.6rem] font-bold leading-none tabular-nums sm:text-[3.2rem]" aria-hidden="true">{i + 1}.</span>
          <div>
            <h3 class="text-lg font-medium leading-snug sm:text-xl">{step.title}</h3>
            <p class="mt-2 max-w-[46ch] text-base font-light leading-relaxed text-text-secondary">{step.desc}</p>
          </div>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .num {
    color: var(--app-border-strong);
    transition: color 420ms var(--ct-ease);
  }
  .step.is-inked .num {
    color: var(--ct-orange);
  }
</style>
