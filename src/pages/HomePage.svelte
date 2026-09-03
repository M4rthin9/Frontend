<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';

  const infoCards = $derived([
    {
      icon: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      title: t('dayTime'),
      desc: t('dayTimeDesc'),
      color: 'crimson',
    },
    {
      icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      title: t('seats'),
      desc: t('seatsDesc'),
      color: 'gold',
    },
    {
      icon: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
      title: t('price'),
      desc: t('priceDesc'),
      color: 'crimson',
    },
    {
      icon: '<path d="M12 3l7 3v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/><path d="M12 9v4m0 3h.01"/>',
      title: t('rules'),
      desc: t('rulesDesc'),
      color: 'gold',
    },
  ]);

  const steps = $derived([t('step1'), t('step2'), t('step3'), t('step4')]);

  const colorMap: Record<string, { tile: string; soft: string }> = {
    crimson: {
      tile: 'bg-red-700 shadow-red-900/20',
      soft: 'bg-red-50',
    },
    gold: {
      tile: 'bg-gold-500 shadow-gold-700/20',
      soft: 'bg-gold-50',
    },
  };

  const arrowSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-gold-300/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
</script>

<!-- ================= HERO ================= -->
<section
  class="relative overflow-hidden rounded-b-[1.5rem] bg-gradient-to-br from-red-950 via-red-900 to-red-800 text-white shadow-xl shadow-red-900/20"
>
  <!-- glow orbs — reduced for official tone -->
  <div aria-hidden="true" class="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gold-400/8 blur-3xl"></div>
  <div aria-hidden="true" class="pointer-events-none absolute -right-20 top-16 h-96 w-96 rounded-full bg-red-400/8 blur-3xl"></div>

  <!-- dot grid overlay -->
  <div
    aria-hidden="true"
    class="absolute inset-0 opacity-[0.03]"
    style="background-image: radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.9) 1.5px, transparent 0); background-size: 34px 34px;"
  ></div>

  <!-- gold accent line at top -->
  <div aria-hidden="true" class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-40"></div>

  <div class="relative mx-auto max-w-3xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16">
    <!-- logos -->
    <div class="flex items-center justify-center gap-3 sm:gap-5">
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-lg shadow-red-950/20 ring-1 ring-gold-300/30 backdrop-blur-md sm:h-24 sm:w-24">
        <img
          src="/cida-logo-192.webp"
          srcset="/cida-logo-64.webp 64w, /cida-logo-128.webp 128w, /cida-logo-192.webp 192w"
          sizes="96px"
          width="192"
          height="192"
          fetchpriority="high"
          alt="กรมราชทัณฑ์"
          class="h-full w-full rounded-xl object-cover"
        />
      </div>
      <div aria-hidden="true" class="h-10 w-px bg-white/25 sm:h-16"></div>
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-lg shadow-red-950/20 ring-1 ring-gold-300/30 backdrop-blur-md sm:h-24 sm:w-24">
        <img
          src="/logo-white-128.webp"
          srcset="/logo-white-64.webp 64w, /logo-white-128.webp 128w, /logo-white-192.webp 192w"
          sizes="96px"
          width="192"
          height="192"
          alt="CC Cafe"
          class="h-full w-full rounded-xl object-cover"
        />
      </div>
    </div>

    <!-- badge -->
    <div class="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-wide text-gold-200 backdrop-blur-sm">
      <span class="relative flex h-1.5 w-1.5">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60"></span>
        <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-400"></span>
      </span>
      {t('heroBadge')}
    </div>

    <h1 class="mx-auto mt-5 max-w-2xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl lg:text-4xl [text-wrap:balance]" style="font-family: var(--font-display);">
      {@html t('heroTitle')}
    </h1>
    <p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-red-100/75 sm:text-base [text-wrap:balance]">
      {@html t('heroSub')}
    </p>

    <!-- primary CTAs -->
    <div
      class="mt-9 grid items-stretch gap-3.5 sm:grid-cols-2 sm:gap-4 lg:-mx-16 lg:w-[calc(100%+8rem)] xl:-mx-24 xl:w-[calc(100%+12rem)]"
    >
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl bg-gold-500 h-full px-4 py-5 lg:px-5 text-left text-white shadow-md transition-colors duration-200 hover:bg-gold-600"
        onclick={() => navigate('booking')}
      >
        <div class="relative z-10 flex h-full items-center gap-3 lg:gap-3.5">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1M9 11h6m-6 4h4"/></svg>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-bold leading-tight lg:text-base">{@html t('btnBook')}</span>
            <small class="mt-0.5 block text-xs font-medium text-white/80">{@html t('btnBookSub')}</small>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="hidden h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 xl:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </button>

      <button
        type="button"
        class="group rounded-2xl border border-white/15 bg-white/5 h-full px-4 py-5 lg:px-5 text-left text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/10"
        onclick={() => navigate('status')}
      >
        <div class="relative z-10 flex h-full items-center gap-3 lg:gap-3.5">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-bold leading-tight lg:text-base">{@html t('btnStatus')}</span>
            <small class="mt-0.5 block text-xs font-medium text-red-100/60">{@html t('btnStatusSub')}</small>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="hidden h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 xl:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </button>
    </div>

    <!-- steps strip — hidden on sm, guide below is the primary steps UI for official tone -->
    <div class="mt-10 hidden items-start justify-center gap-2 sm:flex sm:gap-3">
      {#each steps as label, i (i)}
        <div class="flex flex-col items-center gap-2.5">
          <span class="flex h-10 w-10 items-center justify-center rounded-full border border-gold-300/40 bg-white/10 text-sm font-bold text-gold-200">
            {i + 1}
          </span>
          <span class="hidden w-20 text-center text-[11px] font-semibold leading-snug text-red-100/60 sm:block">
            {@html label}
          </span>
        </div>
        {#if i < steps.length - 1}
          <div class="mt-3.5">{@html arrowSvg}</div>
        {/if}
      {/each}
    </div>
  </div>
</section>

<!-- ================= INFO CARDS ================= -->
<section class="app-container py-12 sm:py-16">
  <div class="mx-auto max-w-4xl">
    <div class="text-center">
      <h2 class="text-xl font-bold text-text-primary sm:text-2xl" style="font-family: var(--font-display);">{t('infoHeading')}</h2>
      <div class="mx-auto mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-red-600 to-gold-400"></div>
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      {#each infoCards as card, i (i)}
        <div class="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div
            aria-hidden="true"
            class="absolute -right-6 -top-6 h-24 w-24 rounded-full {colorMap[card.color].soft} opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-100"
          ></div>
          <div class="relative flex items-start gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md {colorMap[card.color].tile}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html card.icon}</svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-bold text-text-primary">{card.title}</h3>
              <p class="mt-1.5 text-xs leading-relaxed text-text-tertiary">{@html card.desc}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ================= HOW IT WORKS ================= -->
<section class="app-container pb-4">
  <div class="mx-auto max-w-4xl">
    <div class="text-center">
      <h2 class="text-xl font-bold text-text-primary sm:text-2xl" style="font-family: var(--font-display);">{t('stepsHeading')}</h2>
      <div class="mx-auto mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-red-600 to-gold-400"></div>
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-4">
      {#each steps as label, i (i)}
        <div class="relative rounded-2xl border border-border-subtle bg-surface p-4 pt-7 text-center shadow-sm">
          <div class="absolute inset-x-0 -top-5 flex justify-center">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-red-700 text-sm font-bold text-white shadow-md ring-4 ring-white dark:ring-slate-950">
              {i + 1}
            </span>
          </div>
          <p class="text-xs font-semibold leading-relaxed text-text-secondary">{@html label}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ================= GUIDE ================= -->
<section class="app-container py-10">
  <div class="mx-auto max-w-4xl rounded-2xl border border-border-subtle bg-gradient-to-br from-navy-50 to-white p-6 shadow-sm sm:p-8">
    <div class="flex items-start gap-4">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="text-base font-bold text-text-primary">{t('stepsHeading')}</h2>
        <div class="mt-3 text-sm leading-relaxed text-text-secondary">{@html t('stepGuide')}</div>
      </div>
    </div>
  </div>
</section>

<!-- ================= CTA BANNER ================= -->
<section class="app-container pb-16 sm:pb-20">
  <div class="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-red-900 to-red-800 px-6 py-12 text-center text-white shadow-lg sm:px-10">
    <div aria-hidden="true" class="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl"></div>
    <div
      aria-hidden="true"
      class="absolute inset-0 opacity-[0.03]"
      style="background-image: radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.9) 1.5px, transparent 0); background-size: 28px 28px;"
    ></div>
    <!-- gold top line -->
    <div aria-hidden="true" class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent opacity-40"></div>

    <div class="relative">
      <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gold-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L6 21l6-3 6 3-2.5-7.5"/></svg>
      <h2 class="mx-auto mt-4 max-w-md text-xl font-bold leading-snug sm:text-2xl" style="font-family: var(--font-display);">{t('appName')}</h2>
      <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-red-100/70">{@html t('heroSub')}</p>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          class="rounded-xl bg-gold-500 px-7 py-3 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:bg-gold-600"
          onclick={() => navigate('booking')}
        >
          {t('ctaJoin')}
        </button>
        <button
          type="button"
          class="rounded-xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/10"
          onclick={() => navigate('status')}
        >
          {t('ctaCheck')}
        </button>
      </div>
    </div>
  </div>
</section>
