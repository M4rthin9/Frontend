<script lang="ts">
  import Cookie from '@lucide/svelte/icons/cookie';
  import Modal from '../ui/Modal.svelte';
  import { t, tc } from '../../lib/i18n/i18n.svelte';
  import { consent } from '../../lib/store/consent.svelte';
  import { ui } from '../../lib/store/ui.svelte';

  // Toggle state for the settings dialog, seeded from the stored decision
  // each time it opens so "cancel" never leaks a half-made choice.
  let preferences = $state(false);
  let analytics = $state(false);

  $effect(() => {
    if (consent.settingsOpen) {
      preferences = consent.allows('preferences');
      analytics = consent.allows('analytics');
    }
  });

  const pdpa = $derived(ui.publicSettings.pdpa);

  const btn = 'rounded-xl px-4 py-2.5 text-sm font-bold transition-colors duration-200';
  const btnPrimary = `${btn} bg-red-700 text-white shadow-md hover:bg-red-800`;
  const btnOutline = `${btn} border border-border-strong text-text-primary hover:bg-background-subtle`;
</script>

{#if consent.showBanner}
  <div class="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4" role="region" aria-label={t('ckBannerTitle')}>
    <div class="mx-auto max-w-3xl rounded-2xl border border-border-subtle bg-surface p-4 shadow-2xl sm:p-5">
      <div class="flex items-start gap-3">
        <Cookie class="mt-0.5 h-6 w-6 shrink-0 text-gold-500" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-bold text-text-primary">{t('ckBannerTitle')}</h2>
          <p class="mt-1 text-xs leading-relaxed text-text-secondary">
            {t('ckBannerText')}
            <button type="button" class="font-semibold text-red-700 underline underline-offset-2" onclick={() => consent.openSettings()}>
              {t('ckPolicyLink')}
            </button>
          </p>
        </div>
      </div>
      <!-- Reject is as prominent and as close as accept: PDPA consent must be freely given. -->
      <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" class={btnOutline} onclick={() => consent.openSettings()}>{t('ckSettings')}</button>
        <button type="button" class={btnOutline} onclick={() => consent.rejectAll()}>{t('ckRejectAll')}</button>
        <button type="button" class={btnPrimary} onclick={() => consent.acceptAll()}>{t('ckAcceptAll')}</button>
      </div>
    </div>
  </div>
{/if}

<Modal bind:open={consent.settingsOpen} title={t('ckSettingsTitle')}>
  <div class="-mr-2 max-h-[60vh] overflow-y-auto pr-2">
    <div class="flex flex-col gap-3">
      <div class="rounded-xl border border-border-subtle p-4">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-bold text-text-primary">{t('ckNecessaryTitle')}</h3>
          <span class="shrink-0 text-xs font-semibold text-emerald-600">{t('ckAlwaysOn')}</span>
        </div>
        <p class="mt-1.5 text-xs leading-relaxed text-text-tertiary">{t('ckNecessaryDesc')}</p>
      </div>

      <label class="block cursor-pointer rounded-xl border border-border-subtle p-4">
        <span class="flex items-center justify-between gap-3">
          <span class="text-sm font-bold text-text-primary">{t('ckPreferencesTitle')}</span>
          <input type="checkbox" role="switch" bind:checked={preferences} class="h-5 w-5 shrink-0 accent-red-700" />
        </span>
        <span class="mt-1.5 block text-xs leading-relaxed text-text-tertiary">{t('ckPreferencesDesc')}</span>
      </label>

      <label class="block cursor-pointer rounded-xl border border-border-subtle p-4">
        <span class="flex items-center justify-between gap-3">
          <span class="text-sm font-bold text-text-primary">{t('ckAnalyticsTitle')}</span>
          <input type="checkbox" role="switch" bind:checked={analytics} class="h-5 w-5 shrink-0 accent-red-700" />
        </span>
        <span class="mt-1.5 block text-xs leading-relaxed text-text-tertiary">{t('ckAnalyticsDesc')}</span>
      </label>

      <details class="rounded-xl border border-border-subtle p-4">
        <summary class="cursor-pointer text-sm font-bold text-text-primary">{t('ckPolicyTitle')}</summary>
        <div class="mt-3 flex flex-col gap-2.5 text-xs leading-relaxed text-text-secondary">
          <p>{t('ckPolicy1')}</p>
          <p>{t('ckPolicy2')}</p>
          <p>{t('ckPolicy3')}</p>
          <p>{t('ckPolicy4')}</p>
          <p class="font-semibold text-text-primary">{t('ckController')}</p>
          <p>
            {t('ckContactLabel')}:
            <span class="whitespace-pre-line">{pdpa.contact || t('ckContactFallback')}</span>
          </p>
          <p class="text-text-tertiary">{tc('ckPolicyVersion', { v: pdpa.policyVersion })}</p>
        </div>
      </details>
    </div>
  </div>

  <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <button type="button" class={btnOutline} onclick={() => consent.rejectAll()}>{t('ckRejectAll')}</button>
    <button type="button" class={btnOutline} onclick={() => consent.save(preferences, analytics)}>{t('ckSave')}</button>
    <button type="button" class={btnPrimary} onclick={() => consent.acceptAll()}>{t('ckAcceptAll')}</button>
  </div>
</Modal>
