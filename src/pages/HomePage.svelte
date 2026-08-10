<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';

  const infoCards = $derived([
    { icon: '📅', title: t('dayTime'), desc: t('dayTimeDesc'), color: 'indigo' },
    { icon: '💺', title: t('seats'), desc: t('seatsDesc'), color: 'emerald' },
    { icon: '💰', title: t('price'), desc: t('priceDesc'), color: 'amber' },
    { icon: '⚠️', title: t('rules'), desc: t('rulesDesc'), color: 'rose' },
  ]);

  const steps = $derived([t('step1'), t('step2'), t('step3'), t('step4')]);

  const colorMap: Record<string, { tile: string; soft: string }> = {
    indigo: { tile: 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-600/30', soft: 'bg-indigo-50' },
    emerald: { tile: 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-600/30', soft: 'bg-emerald-50' },
    amber: { tile: 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30', soft: 'bg-amber-50' },
    rose: { tile: 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-600/30', soft: 'bg-rose-50' },
  };

  const arrowSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-amber-400/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
</script>

<!-- ================= HERO ================= -->
<section
  class="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-700 text-white shadow-2xl shadow-indigo-900/30"
>
  <!-- glow orbs -->
  <div aria-hidden="true" class="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl"></div>
  <div aria-hidden="true" class="pointer-events-none absolute -right-20 top-16 h-96 w-96 rounded-full bg-indigo-400/25 blur-3xl"></div>
  <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"></div>

  <!-- dot grid -->
  <div
    aria-hidden="true"
    class="absolute inset-0 opacity-[0.08]"
    style="background-image: radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.9) 1.5px, transparent 0); background-size: 34px 34px;"
  ></div>

  <div class="relative mx-auto max-w-3xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16">
    <!-- logos -->
    <div class="flex items-center justify-center gap-3 sm:gap-5">
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-xl shadow-indigo-950/40 ring-1 ring-amber-400/40 backdrop-blur-md transition-transform duration-300 hover:scale-105 sm:h-24 sm:w-24">
        <img src="/cida-logo.png" alt="กรมราชทัณฑ์" class="h-full w-full rounded-xl object-cover" />
      </div>
      <div aria-hidden="true" class="h-10 w-px bg-white/25 sm:h-16"></div>
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-xl shadow-indigo-950/40 ring-1 ring-amber-400/40 backdrop-blur-md transition-transform duration-300 hover:scale-105 sm:h-24 sm:w-24">
        <img src="/Logo-white.png" alt="CC Cafe" class="h-full w-full rounded-xl object-cover" />
      </div>
    </div>

    <!-- badge -->
    <div class="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold tracking-wide text-amber-300 backdrop-blur-sm">
      <span class="relative flex h-1.5 w-1.5">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
        <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400"></span>
      </span>
      {t('heroBadge')}
    </div>

    <h1 class="mx-auto mt-5 max-w-2xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl lg:text-4xl">
      {@html t('heroTitle')}
    </h1>
    <p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">
      {@html t('heroSub')}
    </p>

    <!-- primary CTAs -->
    <div class="mt-9 grid gap-3.5 sm:grid-cols-2 sm:gap-4">
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 py-5 text-left text-indigo-950 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30"
        onclick={() => navigate('booking')}
      >
        <div class="relative z-10 flex items-center gap-3.5">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/25 text-2xl backdrop-blur-sm">
            📋
          </span>
          <span class="flex-1">
            <span class="block text-base font-bold leading-tight">{@html t('btnBook')}</span>
            <small class="mt-0.5 block text-xs font-medium text-indigo-900/70">{@html t('btnBookSub')}</small>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </button>

      <button
        type="button"
        class="group rounded-2xl border border-white/20 bg-white/10 px-5 py-5 text-left text-white shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-xl"
        onclick={() => navigate('status')}
      >
        <div class="flex items-center gap-3.5">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
            🔍
          </span>
          <span class="flex-1">
            <span class="block text-base font-bold leading-tight">{@html t('btnStatus')}</span>
            <small class="mt-0.5 block text-xs font-medium text-slate-300">{@html t('btnStatusSub')}</small>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </button>
    </div>

    <!-- steps strip -->
    <div class="mt-12 flex items-start justify-center gap-2 sm:gap-3">
      {#each steps as label, i (i)}
        <div class="flex flex-col items-center gap-2.5">
          <span class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400/20 text-sm font-bold text-amber-300 ring-4 ring-amber-400/10 backdrop-blur-sm">
            {i + 1}
          </span>
          <span class="hidden w-20 text-center text-[11px] font-semibold leading-snug text-slate-300 sm:block">
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
      <h2 class="text-xl font-bold text-text-primary sm:text-2xl">{t('infoHeading')}</h2>
      <div class="mx-auto mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-amber-400"></div>
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-2">
      {#each infoCards as card, i (i)}
        <div class="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div
            aria-hidden="true"
            class="absolute -right-6 -top-6 h-24 w-24 rounded-full {colorMap[card.color].soft} opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
          ></div>
          <div class="relative flex items-start gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-lg {colorMap[card.color].tile} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            >
              {card.icon}
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
      <h2 class="text-xl font-bold text-text-primary sm:text-2xl">{t('stepsHeading')}</h2>
      <div class="mx-auto mt-3 h-1 w-14 rounded-full bg-gradient-to-r from-indigo-600 to-amber-400"></div>
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-4">
      {#each steps as label, i (i)}
        <div class="relative rounded-2xl border border-border-subtle bg-surface p-4 pt-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div class="absolute inset-x-0 -top-5 flex justify-center">
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 ring-4 ring-white dark:ring-slate-950">
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
  <div class="mx-auto max-w-4xl rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-amber-50/70 p-6 shadow-sm sm:p-8">
    <div class="flex items-start gap-4">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-lg text-white shadow-md shadow-indigo-600/30">
        📘
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
  <div class="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-700 px-6 py-12 text-center text-white shadow-xl shadow-indigo-600/20 sm:px-10">
    <div aria-hidden="true" class="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -bottom-16 left-0 h-56 w-56 rounded-full bg-indigo-400/25 blur-3xl"></div>
    <div
      aria-hidden="true"
      class="absolute inset-0 opacity-[0.07]"
      style="background-image: radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.9) 1.5px, transparent 0); background-size: 28px 28px;"
    ></div>

    <div class="relative">
      <span class="text-4xl">🤝</span>
      <h2 class="mx-auto mt-4 max-w-md text-xl font-bold leading-snug sm:text-2xl">{t('appName')}</h2>
      <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">{@html t('heroSub')}</p>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          class="rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 px-7 py-3 text-sm font-bold text-indigo-950 shadow-lg shadow-amber-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/40"
          onclick={() => navigate('booking')}
        >
          {t('ctaJoin')}
        </button>
        <button
          type="button"
          class="rounded-xl border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20"
          onclick={() => navigate('status')}
        >
          {t('ctaCheck')}
        </button>
      </div>
    </div>
  </div>
</section>
