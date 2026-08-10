<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';

  const infoCards = $derived([
    { icon: '📅', title: t('dayTime'), desc: t('dayTimeDesc'), color: 'indigo' },
    { icon: '💺', title: t('seats'), desc: t('seatsDesc'), color: 'emerald' },
    { icon: '💰', title: t('price'), desc: t('priceDesc'), color: 'amber' },
    { icon: '⚠️', title: t('rules'), desc: t('rulesDesc'), color: 'rose' },
  ]);

  const steps = $derived([
    t('step1'),
    t('step2'),
    t('step3'),
    t('step4'),
  ]);

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600' },
  };
</script>

<section class="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 text-white">
  <div class="absolute inset-0 opacity-10">
    <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
  </div>

  <div class="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
    <div class="flex items-center justify-center gap-6">
      <div class="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-amber-400 bg-white/10 p-1.5 backdrop-blur-sm">
        <img src="/cida-logo.png" alt="กรมราชทัณฑ์" class="h-full w-full rounded-full object-cover" />
      </div>
      <div class="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-amber-400 bg-white/10 p-1.5 backdrop-blur-sm">
        <img src="/Logo-white.png" alt="CC Cafe" class="h-full w-full rounded-full object-cover" />
      </div>
    </div>

    <div class="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-xs font-bold tracking-wide text-amber-300">
      <span class="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
      {t('heroBadge')}
    </div>

    <h1 class="mt-5 text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl">
      {@html t('heroTitle')}
    </h1>
    <p class="mt-3.5 text-sm text-slate-300 sm:text-base max-w-lg mx-auto leading-relaxed">
      {@html t('heroSub')}
    </p>

    <div class="mt-9 grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 px-5 py-5 text-left text-indigo-950 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
        onclick={() => navigate('booking')}
      >
        <div class="relative z-10 flex items-center gap-3.5">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
            📋
          </span>
          <span class="flex-1">
            <span class="block font-bold leading-tight text-base">{@html t('btnBook')}</span>
            <small class="block text-xs font-medium text-indigo-900/70 mt-0.5">{@html t('btnBookSub')}</small>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </button>
      <button
        type="button"
        class="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-5 text-left text-white shadow-lg transition-all duration-300 hover:bg-white/20 hover:shadow-xl hover:scale-[1.02]"
        onclick={() => navigate('status')}
      >
        <div class="flex items-center gap-3.5">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
            🔍
          </span>
          <span class="flex-1">
            <span class="block font-bold leading-tight text-base">{@html t('btnStatus')}</span>
            <small class="block text-xs font-medium text-slate-300 mt-0.5">{@html t('btnStatusSub')}</small>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </button>
    </div>

    <div class="mt-12 flex items-center justify-center gap-2">
      {#each steps as label, i (i)}
        <div class="flex flex-col items-center gap-2">
          <span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400/20 text-sm font-bold text-amber-300 backdrop-blur-sm">
            {i + 1}
          </span>
          <span class="text-[11px] font-semibold leading-snug text-slate-200 hidden sm:block">{@html label}</span>
        </div>
        {#if i < steps.length - 1}
          <span class="text-xl text-amber-400/60" aria-hidden="true">›</span>
        {/if}
      {/each}
    </div>
  </div>
</section>

<section class="app-container py-12 sm:py-16">
  <div class="text-center mb-10">
    <h2 class="text-xl font-bold text-text-primary">{t('infoHeading')}</h2>
    <div class="mt-2 mx-auto h-1 w-12 rounded-full bg-indigo-600"></div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    {#each infoCards as card, i (i)}
      <div class="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {colorMap[card.color].bg} {colorMap[card.color].border} border text-2xl transition-transform duration-300 group-hover:scale-110">
            {card.icon}
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold text-text-primary">{card.title}</h3>
            <p class="mt-1.5 text-xs leading-relaxed text-text-tertiary">{@html card.desc}</p>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="mt-12">
    <div class="text-center mb-8">
      <h2 class="text-xl font-bold text-text-primary">{t('stepsHeading')}</h2>
      <div class="mt-2 mx-auto h-1 w-12 rounded-full bg-indigo-600"></div>
    </div>
    <div class="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8 text-sm leading-relaxed text-text-secondary shadow-sm">
      {@html t('stepGuide')}
    </div>
  </div>

  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <button
      type="button"
      class="rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md hover:scale-[1.02]"
      onclick={() => navigate('booking')}
    >
      {t('ctaJoin')}
    </button>
    <button
      type="button"
      class="rounded-xl border border-border-strong px-7 py-3 text-sm font-bold text-text-primary transition-all duration-200 hover:bg-background-subtle hover:border-indigo-300 hover:scale-[1.02]"
      onclick={() => navigate('status')}
    >
      {t('ctaCheck')}
    </button>
  </div>
</section>
