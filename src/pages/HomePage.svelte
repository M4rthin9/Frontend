<script lang="ts">
  import { t } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';

  const infoCards = $derived([
    { icon: '📅', title: t('dayTime'), desc: t('dayTimeDesc') },
    { icon: '💺', title: t('seats'), desc: t('seatsDesc') },
    { icon: '💰', title: t('price'), desc: t('priceDesc') },
    { icon: '⚠️', title: t('rules'), desc: t('rulesDesc') },
  ]);

  const steps = $derived([
    t('step1'),
    t('step2'),
    t('step3'),
    t('step4'),
  ]);
</script>

<section class="bg-navy-900 text-white">
  <div class="mx-auto max-w-3xl px-4 py-14 text-center">
    <div class="flex items-center justify-center gap-8">
      <div class="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-gold bg-white/10 p-1.5">
        <img src="/cida-logo.png" alt="กรมราชทัณฑ์" class="h-full w-full rounded-full object-cover" />
      </div>
      <div class="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-gold bg-white/10 p-1.5">
        <img src="/Logo-white.png" alt="CC Cafe" class="h-full w-full rounded-full object-cover" />
      </div>
    </div>

    <div class="mt-6 inline-block rounded-full border border-gold/60 bg-gold/10 px-4 py-1.5 text-xs font-bold tracking-wide text-gold-400">
      {t('heroBadge')}
    </div>

    <h1 class="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
      {@html t('heroTitle')}
    </h1>
    <p class="mt-3 text-sm text-slate-300 sm:text-base">
      {@html t('heroSub')}
    </p>

    <div class="mt-8 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        class="group flex items-center gap-3 rounded-2xl bg-gold px-5 py-4 text-left text-navy-900 shadow-lg transition hover:bg-gold-400"
        onclick={() => navigate('booking')}
      >
        <span class="text-2xl">📋</span>
        <span class="flex-1">
          <span class="block font-bold leading-tight">{@html t('btnBook')}</span>
          <small class="block text-xs font-medium text-navy-900/70">{@html t('btnBookSub')}</small>
        </span>
        <span class="text-2xl font-bold transition group-hover:translate-x-0.5">›</span>
      </button>
      <button
        type="button"
        class="group flex items-center gap-3 rounded-2xl bg-navy-600 px-5 py-4 text-left text-white shadow-lg transition hover:bg-navy-500"
        onclick={() => navigate('status')}
      >
        <span class="text-2xl">🔍</span>
        <span class="flex-1">
          <span class="block font-bold leading-tight">{@html t('btnStatus')}</span>
          <small class="block text-xs font-medium text-slate-300">{@html t('btnStatusSub')}</small>
        </span>
        <span class="text-2xl font-bold transition group-hover:translate-x-0.5">›</span>
      </button>
    </div>

    <div class="mt-10 grid grid-cols-4 items-start gap-2">
      {#each steps as label, i (i)}
        <div class="flex flex-col items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold bg-gold/20 text-sm font-bold text-gold-400">
            {i + 1}
          </span>
          <span class="text-[11px] font-semibold leading-snug text-slate-200">{@html label}</span>
        </div>
        {#if i < steps.length - 1}
          <span class="mt-2 text-xl text-gold-400" aria-hidden="true">›</span>
        {/if}
      {/each}
    </div>
  </div>
</section>

<section class="app-container py-10">
  <h2 class="text-center text-lg font-bold text-text">{t('infoHeading')}</h2>

  <div class="mt-5 grid gap-4 sm:grid-cols-2">
    {#each infoCards as card, i (i)}
      <div class="flex items-start gap-4 rounded-2xl border border-border-strong bg-surface p-5 shadow-sm">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-subtle text-2xl">
          {card.icon}
        </div>
        <div>
          <h3 class="text-sm font-bold text-text">{card.title}</h3>
          <p class="mt-1 text-xs leading-relaxed text-text-tertiary">{@html card.desc}</p>
        </div>
      </div>
    {/each}
  </div>

  <h2 class="mt-10 text-center text-lg font-bold text-text">{t('stepsHeading')}</h2>
  <div class="mt-4 rounded-2xl border border-border-strong bg-surface p-6 text-sm leading-relaxed text-text-secondary shadow-sm">
    {@html t('stepGuide')}
  </div>

  <div class="mt-6 flex flex-wrap justify-center gap-3">
    <button
      type="button"
      class="rounded-lg bg-navy-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-navy-700"
      onclick={() => navigate('booking')}
    >
      {t('ctaJoin')}
    </button>
    <button
      type="button"
      class="rounded-lg border border-border-strong px-6 py-3 text-sm font-bold text-text transition hover:bg-bg-subtle"
      onclick={() => navigate('status')}
    >
      {t('ctaCheck')}
    </button>
  </div>
</section>
