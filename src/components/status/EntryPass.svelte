<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
  import { getVisitorEntryQr } from '../../lib/api/endpoints';

  let { ref }: { ref: string } = $props();
  let visitorId = $state('');
  let busy = $state(false);
  let error = $state('');
  let pass = $state<{ qrDataUrl: string; payload: string; visitDateISO: string } | null>(null);
  let generation = 0;
  $effect(() => {
    void ref;
    generation++;
    pass = null;
    visitorId = '';
    error = '';
  });

  async function generate() {
    if (busy || !visitorId.trim()) return;
    const current = generation;
    busy = true;
    error = '';
    pass = null;
    try {
      const result = await getVisitorEntryQr(ref, visitorId.trim());
      if (current === generation) {
        pass = result;
        visitorId = '';
      }
    } catch (e) {
      if (current === generation) error = e instanceof Error ? e.message : t('entryQrError');
    } finally {
      busy = false;
    }
  }
</script>

<section
  class="mx-5 mb-6 rounded-2xl border border-border-subtle p-5 sm:mx-8"
  aria-label={t('entryQrTitle')}
>
  <h2 class="text-base font-semibold">{t('entryQrTitle')}</h2>
  <p class="mt-2 text-sm leading-relaxed text-text-secondary">{t('entryQrInstructions')}</p>
  {#if pass}
    <div class="mt-4 flex flex-col items-center gap-3" aria-live="polite">
      <img
        src={pass.qrDataUrl}
        alt={t('entryQrTitle')}
        width="260"
        height="260"
        class="rounded-xl bg-white p-3"
      />
      <p class="font-mono text-sm">{ref} · {pass.visitDateISO}</p>
      <a class="text-sm font-medium underline" href={pass.qrDataUrl} download={`${ref}-entry.svg`}
        >{t('entryQrSave')}</a
      >
      <label class="w-full text-xs text-text-secondary"
        >{t('entryQrText')}<textarea
          class="mt-1 w-full rounded-lg border border-border-subtle bg-transparent p-2 font-mono text-xs"
          readonly
          rows="3"
          value={pass.payload}></textarea></label
      >
    </div>
  {:else}
    <form
      class="mt-4 space-y-3"
      onsubmit={(event) => {
        event.preventDefault();
        void generate();
      }}
    >
      <label class="block text-sm"
        >{t('entryQrIdentity')}
        <input
          class="mt-1 w-full rounded-xl border border-border-subtle bg-transparent px-3 py-2"
          type="password"
          bind:value={visitorId}
          autocomplete="off"
          maxlength="64"
          required
          disabled={busy}
        />
      </label>
      <button
        class="rounded-xl bg-text-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        type="submit"
        disabled={busy || !visitorId.trim()}>{busy ? t('entryQrLoading') : t('entryQrGet')}</button
      >
    </form>
  {/if}
  {#if error}<p role="alert" class="mt-3 text-sm text-red-600">{error}</p>{/if}
</section>
