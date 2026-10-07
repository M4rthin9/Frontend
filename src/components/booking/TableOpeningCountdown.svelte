<script lang="ts">
  import { i18n, t } from '../../lib/i18n/i18n.svelte';
  import { ui } from '../../lib/store/ui.svelte';

  const remaining = $derived(Math.max(0, Math.ceil((Date.parse(ui.publicSettings.tableBooking.opensAt) - ui.now) / 1000)));
  const countdown = $derived([Math.floor(remaining / 3600), Math.floor(remaining / 60) % 60, remaining % 60].map(n => String(n).padStart(2, '0')).join(':'));
  const openingTime = $derived(new Intl.DateTimeFormat(i18n.lang === 'th' ? 'th-TH' : i18n.lang === 'zh' ? 'zh-CN' : i18n.lang === 'vi' ? 'vi-VN' : 'en-GB', {
    timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(ui.publicSettings.tableBooking.opensAt)));
</script>

<p class="text-sm leading-relaxed">{t('tblCountdownText')}</p>
<p class="my-4 font-mono text-4xl font-bold tabular-nums sm:text-5xl" role="timer" aria-label={t('tblCountdownTitle')}>{countdown}</p>
<p class="text-sm">{t('tblOpensAt')} {openingTime} ({t('tblBangkokTime')})</p>
