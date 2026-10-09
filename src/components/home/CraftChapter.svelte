<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { EASE_OUT, MQ, gsap } from '../../lib/motion';

  let wall: HTMLElement;
  let skills: HTMLElement;

  const quote = $derived(t('ctWallQuote').split('|'));
  const words = $derived(t('ctSkillsWords').split('|'));
  const areas = $derived(
    [1, 2, 3, 4].map((n) => ({ title: t(`ctSkill${n}T`), desc: t(`ctSkill${n}D`) })),
  );

  onMount(() => {
    const mm = gsap.matchMedia();

    // The one scrubbed act on the page: a block wall lowers into the ground and
    // the ingredients behind it come up into the light, the stylist's line with it.
    mm.add(MQ.motion, () => {
      gsap
        .timeline({
          scrollTrigger: { trigger: wall, start: 'top 72%', end: 'center 42%', scrub: 0.6 },
        })
        .fromTo(
          '[data-wall]',
          { clipPath: 'inset(0% 0% 0% 0%)' },
          { clipPath: 'inset(100% 0% 0% 0%)', ease: 'none' },
          0,
        )
        .fromTo('[data-wall-photo]', { scale: 1.12 }, { scale: 1, ease: 'none' }, 0)
        .fromTo(
          '[data-quote]',
          { opacity: 0.12 },
          { opacity: 1, ease: 'none', stagger: 0.12 },
          0.1,
        );

      gsap.from(skills.querySelectorAll('[data-skill]'), {
        opacity: 0,
        y: 24,
        duration: 1,
        ease: EASE_OUT,
        stagger: 0.08,
        scrollTrigger: { trigger: skills, start: 'top 65%', once: true },
      });
    });
    return () => mm.revert();
  });
</script>

<section
  bind:this={wall}
  id="home-craft"
  data-chapter="ctChCraft"
  class="py-20 sm:py-28"
  aria-labelledby="home-craft-title"
>
  <div
    class="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16"
  >
    <figure class="relative aspect-[1168/1099] overflow-hidden bg-[#ccd3d4]">
      <img
        data-wall-photo
        src="/chef/ingredients-1168.webp"
        srcset="/chef/ingredients-700.webp 700w, /chef/ingredients-1168.webp 1168w"
        sizes="(min-width: 1024px) 38rem, 100vw"
        width="1168"
        height="1099"
        alt={t('ctWallAlt')}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div data-wall class="wall absolute inset-0 motion-reduce:hidden" aria-hidden="true"></div>
    </figure>

    <div class="lg:text-right">
      <h2 id="home-craft-title" class="ct-masthead craft-mast">
        {t('textCraftChapter1')}<br />{t('textCraftChapter2')}
      </h2>
      <p class="quote mt-6 font-light leading-snug lg:mt-8">
        {#each quote as line, i (i)}<span data-quote class="block">{line}</span>{/each}
      </p>
    </div>
  </div>
</section>

<section
  bind:this={skills}
  id="home-skills"
  data-chapter="ctChSkills"
  class="ct-black py-20 sm:py-28"
  aria-labelledby="home-skills-title"
>
  <div
    class="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16"
  >
    <div>
      <p class="ct-label">{t('ctSkillsLabel')}</p>
      <h2 id="home-skills-title" class="words mt-6 font-medium">
        {#each words as word, i (i)}<span class="block">{word}</span>{/each}
      </h2>
      <p class="mt-8 max-w-md text-base font-light leading-relaxed text-text-secondary">
        {t('ctSkillsIntro')}
      </p>
    </div>

    <div>
      <ol class="grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {#each areas as area, i (i)}
          <li data-skill class="border-t border-border-strong pt-5">
            <span class="font-book text-3xl font-bold text-[var(--ct-orange)]">{i + 1}.</span>
            <h3 class="mt-3 text-lg font-medium leading-snug">{area.title}</h3>
            <p class="mt-2 text-sm font-light leading-relaxed text-text-secondary">{area.desc}</p>
          </li>
        {/each}
      </ol>
      <blockquote
        class="mt-14 border-l-2 border-[var(--ct-orange)] pl-6 text-lg font-light leading-relaxed sm:text-xl"
      >
        {t('ctSkillsQuote')}
      </blockquote>
    </div>
  </div>
</section>

<style>
  /* Grey block wall, half-bond, lit from above. */
  .wall {
    background-color: #3a3536;
    background-image:
      linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.25)),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='60'%3E%3Cg fill='none' stroke='%23231f20' stroke-width='3'%3E%3Cpath d='M0 1.5h120M0 31.5h120M1.5 0v30M61.5 30v30'/%3E%3C/g%3E%3C/svg%3E");
    background-size:
      100% 100%,
      120px 60px;
  }
  .craft-mast {
    font-size: clamp(3.4rem, 14vw, 6.2rem);
  }
  .quote {
    font-size: clamp(1.45rem, 1.1rem + 1.4vw, 2.1rem);
  }
  .words {
    font-size: clamp(3rem, 2rem + 5vw, 5.4rem);
    line-height: 1.08;
    letter-spacing: -0.01em;
  }
</style>
