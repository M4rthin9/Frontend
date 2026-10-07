<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { navigate } from '../../lib/router.svelte';
  import TableOpeningCountdown from '../booking/TableOpeningCountdown.svelte';
</script>

{#if ui.publicSettingsLoaded && ui.publicSettings.tableBooking.enabled && !ui.publicSettings.tableBooking.maintenance}
  <section class="px-6 py-10 sm:px-10 lg:px-14" aria-labelledby="tbl-announcement-title">
    <div class="mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-2xl border border-black/15 bg-[var(--ct-paper)] lg:grid-cols-2">
      <img src="/banners/tbl-public-opening.png" alt={t('tblBannerAlt')} width="1536" height="1024" class="h-full w-full object-contain" loading="lazy" />
      <div class="flex flex-col justify-center p-6 sm:p-8">
        <p class="ct-label">CHANCE &amp; CHANGE CAFE · TBL</p>
        <h2 id="tbl-announcement-title" class="mt-3 text-2xl font-semibold sm:text-3xl">{t('tblPublicAnnouncement')}</h2>
        <div class="mt-5">
          {#if ui.tableBookingScheduled}
            <TableOpeningCountdown />
          {:else}
            <p class="text-lg font-semibold">{ui.tableBookingOpen ? t('tblNowOpen') : t('tblClosedTitle')}</p>
          {/if}
        </div>
        <p class="mt-5 text-sm leading-relaxed">{t('tblNoPrisonerSeating')}</p>
        <p class="mt-2 text-sm font-semibold leading-relaxed">{t('tblNoRefundText')}</p>
        <div class="mt-6 flex flex-wrap gap-4">
          <button class="ct-btn ct-btn-orange" type="button" onclick={() => navigate('table-booking')}>{ui.tableBookingScheduled ? t('tblCountdownTitle') : t('btnTableBook')}</button>
          <a class="self-center text-sm underline underline-offset-4" href="/banners/tbl-public-opening.png" download="TBL-บุคคลภายนอก.png">{t('tblDownloadBanner')}</a>
        </div>
      </div>
    </div>
  </section>
{/if}
