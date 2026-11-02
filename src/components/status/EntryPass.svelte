<script lang="ts">
  import { onDestroy } from 'svelte';
  import { i18n, t } from '../../lib/i18n/i18n.svelte';
  import { getVisitorEntryQr } from '../../lib/api/endpoints';
  import { createEntryCard } from '../../lib/utils/entryCard';
  import { formatDateIn } from '../../lib/utils/date';
  import Download from '@lucide/svelte/icons/download';
  import Share2 from '@lucide/svelte/icons/share-2';
  import QrCode from '@lucide/svelte/icons/qr-code';

  let { ref }: { ref: string } = $props();
  let visitorId = $state('');
  let busy = $state(false);
  let preparing = $state(false);
  let error = $state('');
  let cardError = $state('');
  let pass = $state<{ qrDataUrl: string; payload: string; visitDateISO: string } | null>(null);
  let cardUrl = $state('');
  let cardFile = $state<File | null>(null);
  let canShare = $state(false);
  let sharing = $state(false);
  let generation = 0;
  const dateText = $derived(
    pass
      ? formatDateIn(pass.visitDateISO, i18n.lang, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
  );

  $effect(() => {
    void ref;
    generation++;
    pass = null;
    visitorId = '';
    error = '';
    busy = false;
  });
  $effect(() => {
    const currentPass = pass;
    const date = dateText;
    const labels = {
      institution: t('bankName'),
      title: t('entryCardTitle'),
      reference: t('refLabel'),
      date: t('entryCardDate'),
      show: t('entryCardShow'),
      note: t('entryCardNote'),
    };
    let active = true;
    let url = '';
    cardUrl = '';
    cardFile = null;
    cardError = '';
    canShare = false;
    preparing = Boolean(currentPass);
    if (currentPass) {
      createEntryCard({ qrDataUrl: currentPass.qrDataUrl, ref, date, labels })
        .then((blob) => {
          if (!active) return;
          url = URL.createObjectURL(blob);
          cardUrl = url;
          cardFile = new File([blob], `${ref}-entry.png`, { type: 'image/png' });
          canShare =
            typeof navigator.canShare === 'function' && navigator.canShare({ files: [cardFile] });
        })
        .catch(() => {
          if (active) cardError = t('entryCardError');
        })
        .finally(() => {
          if (active) preparing = false;
        });
    }
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  });
  onDestroy(() => {
    generation++;
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
      if (current === generation) busy = false;
    }
  }
  async function share() {
    if (!cardFile || sharing) return;
    sharing = true;
    cardError = '';
    try {
      await navigator.share({ files: [cardFile], title: t('entryCardTitle') });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError'))
        cardError = t('entryCardShareError');
    } finally {
      sharing = false;
    }
  }
</script>

<section class="entry-pass mx-5 mb-6 sm:mx-8" aria-label={t('entryQrTitle')}>
  <div class="entry-heading">
    <span class="entry-icon"><QrCode size={22} aria-hidden="true" /></span>
    <div>
      <h2>{t('entryQrTitle')}</h2>
      <p>{t('entryQrInstructions')}</p>
    </div>
  </div>
  {#if pass}
    <div class="entry-card-wrap" aria-live="polite">
      {#if cardUrl}
        <img
          class="entry-card"
          src={cardUrl}
          alt={`${t('entryCardTitle')} · ${ref} · ${dateText}`}
          width="1080"
          height="1580"
        />
      {:else}
        <div class="entry-fallback">
          <p>{t('entryCardTitle')}</p>
          <img src={pass.qrDataUrl} alt={t('entryQrTitle')} width="300" height="300" /><strong
            >{ref}</strong
          ><span>{dateText}</span>
        </div>
      {/if}
      {#if preparing}<p role="status" class="entry-hint">{t('entryCardPreparing')}</p>{/if}
      {#if cardUrl}
        <div class="entry-actions">
          <a class="entry-save" href={cardUrl} download={`${ref}-entry.png`}
            ><Download size={19} aria-hidden="true" />{t('entryQrSave')}</a
          >{#if canShare}<button
              type="button"
              class="entry-share"
              disabled={sharing}
              onclick={() => void share()}
              ><Share2 size={19} aria-hidden="true" />{t('entryCardShare')}</button
            >{/if}
        </div>
        <p class="entry-hint">{t('entryCardSaveHint')}</p>
      {/if}
      <p class="entry-hint">{t('entryCardOffline')}</p>
      {#if cardError}<p class="entry-error" role="alert">{cardError}</p>{/if}
      <details class="entry-text">
        <summary>{t('entryQrText')}</summary><textarea
          aria-label={t('entryQrText')}
          readonly
          rows="4"
          value={pass.payload}></textarea>
      </details>
    </div>
  {:else}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        void generate();
      }}
    >
      <label
        >{t('entryQrIdentity')}<input
          type="password"
          bind:value={visitorId}
          autocomplete="off"
          maxlength="64"
          required
          disabled={busy}
        /></label
      >
      <button class="entry-save" type="submit" disabled={busy || !visitorId.trim()}
        >{t(busy ? 'entryQrLoading' : 'entryQrGet')}</button
      >
    </form>
  {/if}
  {#if error}<p role="alert" class="entry-error">{error}</p>{/if}
</section>

<style>
  .entry-pass {
    border: 1px solid #dce3e8;
    border-radius: 16px;
    padding: clamp(18px, 4vw, 28px);
    background: var(--surface);
  }
  .entry-heading {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }
  .entry-icon {
    background: #0b1f33;
    color: #e4d1ae;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    border-radius: 12px;
  }
  h2 {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--app-text);
  }
  .entry-heading p,
  .entry-hint {
    font-size: 0.875rem;
    line-height: 1.7;
    color: var(--app-text-secondary);
    margin-top: 6px;
  }
  form {
    display: grid;
    gap: 16px;
    margin-top: 22px;
  }
  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--app-text);
  }
  input {
    display: block;
    width: 100%;
    min-height: 48px;
    margin-top: 8px;
    border: 1px solid var(--app-border-subtle);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 16px;
    background: var(--app-bg);
  }
  input:focus-visible,
  a:focus-visible,
  button:focus-visible,
  summary:focus-visible {
    outline: 2px solid #c6a66b;
    outline-offset: 3px;
  }
  .entry-save,
  .entry-share {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 12px 18px;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
  }
  .entry-save {
    background: #0b1f33;
    color: #fff;
  }
  .entry-share {
    background: var(--surface);
    border: 1px solid var(--app-border-subtle);
    color: var(--app-text);
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .entry-card-wrap {
    margin: 24px auto 0;
    max-width: 400px;
    text-align: center;
  }
  .entry-card {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 14px;
    box-shadow: 0 12px 32px #0b1f3314;
    border: 1px solid #e2e7ec;
  }
  .entry-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 20px 0 12px;
  }
  .entry-actions > * {
    flex: 1 1 150px;
  }
  .entry-fallback {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: 18px;
    background: white;
    color: #0b1f33;
    border: 1px solid #dce3e8;
    border-radius: 12px;
  }
  .entry-fallback img {
    width: 100%;
    max-width: 300px;
    height: auto;
  }
  .entry-error {
    margin-top: 12px;
    font-size: 0.875rem;
    line-height: 1.6;
    color: #b42318;
  }
  .entry-text {
    margin-top: 20px;
    text-align: left;
    color: var(--app-text-secondary);
    font-size: 0.75rem;
  }
  .entry-text summary {
    padding: 10px 0;
    cursor: pointer;
  }
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--app-border-subtle);
    border-radius: 8px;
    font: 0.75rem monospace;
    overflow-wrap: anywhere;
  }
</style>
