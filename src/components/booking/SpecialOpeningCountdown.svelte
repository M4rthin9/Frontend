<script lang="ts">
  import { ui } from '../../lib/store/ui.svelte';
  import { i18n, t, tc } from '../../lib/i18n/i18n.svelte';
  import { scheduledOpenings } from '../../lib/utils/calendar';
  import { formatDateIn } from '../../lib/utils/date';

  const rounds = $derived(scheduledOpenings(new Date(ui.now), ui.publicSettings.bookingWindow));
  function countdown(at: Date): string {
    const seconds = Math.max(0, Math.ceil((at.getTime() - ui.now) / 1000));
    return (
      `${Math.floor(seconds / 86400)} ${t('homeUnitDays')} ` +
      [Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
        .map((n) => String(n).padStart(2, '0'))
        .join(':')
    );
  }
  function openingLabel(at: Date): string {
    const locale = { th: 'th-TH', en: 'en-GB', zh: 'zh-CN', vi: 'vi-VN' }[i18n.lang];
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Bangkok',
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(at);
  }
</script>

{#if ui.publicSettingsLoaded && !ui.publicSettingsError && ui.publicSettings.bookingWindow.open && rounds.length}
  <aside
    class="my-6 rounded-xl border border-current/20 p-4 sm:p-6"
    aria-label={t('bookingSpecialRounds')}
  >
    <h3 class="text-base font-semibold">{t('bookingSpecialRounds')}</h3>
    <ul class="mt-3 grid gap-3 sm:grid-cols-2">
      {#each rounds as round (round.date)}
        <li class="min-w-0 rounded-lg bg-black/5 p-3">
          <p class="text-sm font-medium">
            {tc('bookingSpecialVisit', {
              date: formatDateIn(round.date, i18n.lang, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            })}
          </p>
          <p class="mt-1 text-xs">{tc('bookingSpecialOpens', { at: openingLabel(round.at) })}</p>
          <p
            class="mt-2 font-mono text-2xl font-bold tabular-nums"
            role="timer"
            aria-live="off"
            aria-label={t('bookingSpecialRemaining')}
          >
            {countdown(round.at)}
          </p>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
