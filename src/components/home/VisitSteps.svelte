<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { MQ, ScrollTrigger, gsap } from '../../lib/motion';

  let list: HTMLElement;

  const steps = $derived([1, 2, 3, 4, 5].map((n) => ({ title: t(`homeStep${n}T`), desc: t(`homeStep${n}D`) })));

  // The line is drawn by the scroll itself; each station lights when the line
  // reaches it. Without motion the line is simply complete and every station lit.
  onMount(() => {
    const mm = gsap.matchMedia(list);
    mm.add(MQ.motion, () => {
      gsap.fromTo(
        '[data-line]',
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: 0.4 } },
      );
      const stations = gsap.utils.toArray<HTMLElement>('[data-station]');
      stations.forEach((el) => el.classList.remove('is-reached'));
      stations.forEach((el) =>
        // Lit from the moment the line reaches it until the visitor scrolls back above it.
        ScrollTrigger.create({ trigger: el, start: 'top 62%', end: 'max', toggleClass: 'is-reached' }),
      );
      return () => stations.forEach((el) => el.classList.add('is-reached'));
    });
    return () => mm.revert();
  });
</script>

<section class="bg-background-subtle py-16 sm:py-24" aria-labelledby="home-steps">
  <div class="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
    <div class="lg:sticky lg:top-24 lg:self-start">
      <h2 id="home-steps" class="home-h2">{t('homeStepsHeading')}</h2>
      <p class="mt-3 max-w-md text-base leading-relaxed text-text-secondary">{t('homeStepsSub')}</p>
    </div>

    <ol bind:this={list} class="relative">
      <span class="absolute bottom-6 left-[1.15rem] top-6 w-px bg-border-strong" aria-hidden="true"></span>
      <span data-line class="absolute bottom-6 left-[1.1rem] top-6 w-[3px] origin-top rounded-full bg-red-700 dark:bg-red-400" aria-hidden="true"></span>

      {#each steps as step, i (i)}
        <li data-station class="station is-reached relative pb-12 pl-16 last:pb-0">
          <span
            class="station-dot absolute left-0 top-0 flex h-[2.4rem] w-[2.4rem] items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <h3 class="pt-1.5 text-lg font-semibold leading-snug text-text-primary">{step.title}</h3>
          <p class="mt-2 max-w-[46ch] text-base leading-relaxed text-text-secondary">{step.desc}</p>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .station-dot {
    background: var(--color-surface);
    border-color: var(--color-border-strong);
    color: var(--color-text-tertiary);
    transition:
      background-color 240ms cubic-bezier(0.23, 1, 0.32, 1),
      border-color 240ms cubic-bezier(0.23, 1, 0.32, 1),
      color 240ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 240ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .station.is-reached .station-dot {
    background: #a92928;
    border-color: #a92928;
    color: #fff;
    transform: scale(1.06);
  }
  .station h3,
  .station p {
    transition: opacity 240ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .station:not(.is-reached) h3,
  .station:not(.is-reached) p {
    opacity: 0.55;
  }
</style>
