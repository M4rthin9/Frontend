<script module lang="ts">
  // Once per page load: coming back to the home route must not reopen it.
  let shownThisSession = false;
</script>

<script lang="ts">
  import Modal from '../ui/Modal.svelte';
  import PromoCarousel from './PromoCarousel.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import { consent } from '../../lib/store/consent.svelte';
  import { safeGetItem, safeSetItem } from '../../lib/utils/storage';
  import { todayStr } from '../../lib/utils/date';

  const HIDE_KEY = 'ccc_promo_hidden_on';

  let open = $state(false);
  let hideToday = $state(false);

  const promo = $derived(ui.publicSettings.promo);

  $effect(() => {
    // The cookie banner goes first; two overlays at once would hide one of them.
    if (shownThisSession || !ui.publicSettingsLoaded || !consent.decided) return;
    if (!promo.popupEnabled || promo.ads.length === 0) return;
    if (safeGetItem(window.localStorage, HIDE_KEY) === todayStr()) return;
    shownThisSession = true;
    open = true;
  });

  function remember(): void {
    if (hideToday) safeSetItem(window.localStorage, HIDE_KEY, todayStr());
  }

  function close(): void {
    remember();
    open = false;
  }
</script>

<Modal bind:open title={t('promoTitle')} fullWidth onClose={remember}>
  <PromoCarousel ads={promo.ads} />
  <div class="mt-5 flex items-center justify-between gap-3">
    <!-- Remembering it is functional storage; without that consent it could not stick. -->
    {#if consent.allows('preferences')}
      <label class="flex cursor-pointer items-center gap-2 text-xs text-text-tertiary">
        <input type="checkbox" bind:checked={hideToday} class="h-4 w-4 rounded accent-red-700" />
        {t('promoHideToday')}
      </label>
    {:else}
      <span></span>
    {/if}
    <button
      type="button"
      class="rounded-xl bg-red-700 px-5 py-2 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:bg-red-800"
      onclick={close}
    >
      {t('promoClose')}
    </button>
  </div>
</Modal>
