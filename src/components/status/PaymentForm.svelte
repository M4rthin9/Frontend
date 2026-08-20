<script lang="ts">
  import { onMount } from 'svelte';
  import { t, tc } from '../../lib/i18n/i18n.svelte';
  import { uploadSlip, updateSlipAndStatus, getPaymentQr } from '../../lib/api/endpoints';
  import type { PublicReservation, SlipVerifyResult } from '../../lib/api/types';

  let {
    booking,
    onpaid = () => {},
    oncancel = () => {},
  }: {
    booking: PublicReservation;
    onpaid?: () => void;
    oncancel?: () => void;
  } = $props();

  let slipFile = $state<File | null>(null);
  let previewUrl = $state('');
  let alertMsg = $state('');
  let alertType = $state<'err' | 'success'>('err');
  let progress = $state(0);
  let progressVisible = $state(false);
  let dragOver = $state(false);
  let submitting = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);
  let qrSrc = $state('');
  let qrCardSvg = $state('');
  let qrError = $state(false);
  let verifyResult = $state<SlipVerifyResult | null>(null);

  const visitorCount = $derived(parseInt(String(booking.visitorCount)) || 1);
  const totalPersons = $derived(visitorCount + 1);
  const total = $derived(parseInt(String(booking.total)) || totalPersons * 1000);

  const SLIP_MAX_BASE64 = 2 * 1024 * 1024 - 1024;

  // Fetch the per-booking bill-payment QR (rendered server-side, Pillar 1).
  // The worker mints this booking's stable ref1 on first request; nothing is
  // generated or persisted client-side anymore.
  onMount(async () => {
    try {
      const qr = await getPaymentQr(booking.ref);
      qrSrc = qr.qrDataUrl;
      qrCardSvg = qr.qrCardSvg ?? '';
    } catch (err) {
      console.error('Failed to load PromptPay QR:', err);
      qrError = true;
    }
  });

  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image load failed'));
      img.src = src;
    });
  }

  async function toUploadableDataUrl(file: File): Promise<string> {
    const dataUrl = await readAsDataURL(file);
    if (dataUrl.length <= SLIP_MAX_BASE64) return dataUrl;
    try {
      const img = await loadImage(dataUrl);
      const MAX_EDGE = 1600;
      let w = img.naturalWidth || MAX_EDGE;
      let h = img.naturalHeight || Math.round(MAX_EDGE * 0.75);
      const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return dataUrl;
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      let out = canvas.toDataURL('image/jpeg', quality);
      while (out.length > SLIP_MAX_BASE64 && quality > 0.35) {
        quality -= 0.1;
        out = canvas.toDataURL('image/jpeg', quality);
      }
      return out;
    } catch {
      return dataUrl;
    }
  }

  function showAlert(type: 'err' | 'success', msg: string): void {
    alertType = type;
    alertMsg = msg;
  }

  function clearAlert(): void {
    alertMsg = '';
  }

  function processFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      showAlert('err', t('fileTooBig'));
      return;
    }
    const mime = (file.type || '').toLowerCase();
    if (!mime.startsWith('image/')) {
      showAlert('err', t('fileTypeInvalid'));
      return;
    }
    slipFile = file;
    verifyResult = null;
    clearAlert();
    void readAsDataURL(file).then((url) => {
      previewUrl = url;
    });
  }

  function mismatchFields(result: SlipVerifyResult | null): string {
    const labels: Record<string, string> = {
      amount: t('slipMismatchAmount'),
      ref1: t('slipMismatchRefs'),
      ref2: t('slipMismatchRefs'),
      biller: t('slipMismatchBiller'),
    };
    return (result?.mismatch ?? []).map((f) => labels[f] || f).join(', ');
  }

  function verifyNotice(result: SlipVerifyResult | null): string {
    if (!result) return '';
    if (result.status === 'ok') return t('slipVerifyOk');
    if (result.status === 'slip_verify') return t('slipVerifyReview');
    if (result.status === 'mismatch') return tc('slipVerifyMismatch', { fields: mismatchFields(result) });
    if (result.status === 'duplicate') return t('slipVerifyDuplicate');
    return t('slipVerifyUnreadable');
  }

  // Tag-62 fields the worker read back off the slip's payment QR (bill number
  // + store label) — shown under the verify badge as extra confirmation.
  const slipQrRefs = $derived.by(() => {
    const ad = verifyResult?.detail?.additionalData as Record<string, unknown> | undefined;
    if (!ad) return '';
    const parts: string[] = [];
    if (ad.billNumber) parts.push(`${t('slipQrBillNumber')}: ${String(ad.billNumber)}`);
    if (ad.storeLabel) parts.push(`${t('slipQrStoreLabel')}: ${String(ad.storeLabel)}`);
    return parts.join(' · ');
  });

  function onFileChange(event: Event & { currentTarget: HTMLInputElement }): void {
    const file = event.currentTarget.files?.[0];
    if (file) processFile(file);
    event.currentTarget.value = '';
  }

  function onDrop(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }

  function onDragOver(event: DragEvent): void {
    event.preventDefault();
    dragOver = true;
  }

  function onDragLeave(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
  }

  async function submit(): Promise<void> {
    if (!slipFile) {
      showAlert('err', t('slipRequired'));
      return;
    }
    submitting = true;
    progressVisible = true;
    progress = 15;

    try {
      const base64Data = await toUploadableDataUrl(slipFile);
      const mimeType = base64Data.slice(base64Data.indexOf(':') + 1, base64Data.indexOf(';'));

      progress = 30;
      const { url, verify } = await uploadSlip({
        ref: booking.ref,
        fileName: slipFile.name,
        mimeType,
        base64Data,
      });
      progress = 70;

      if (verify) {
        verifyResult = verify;
        const v = verify;
        if (v.status === 'mismatch' || v.status === 'unreadable' || v.status === 'duplicate') {
          showAlert(
            'err',
            `${verifyNotice(v)}<br/><span style="font-size:12px">${t('slipVerifyBlocked')}</span>`,
          );
          progressVisible = false;
          return;
        }
      }

      await updateSlipAndStatus({
        ref: booking.ref,
        status: 'ชำระแล้ว',
        slipImage: url,
      });
      progress = 100;
      onpaid();
    } catch (err) {
      console.error('Payment submit error:', err);
      progressVisible = false;
      showAlert(
        'err',
        tc('uploadSlipFail', { msg: err instanceof Error ? err.message : t('retryBtn') }),
      );
    } finally {
      submitting = false;
    }
  }
</script>

<div>
  <div class="section-title" style="margin-top:0.5rem">
    💳 {t('paymentTitle')}
  </div>

  <div class="pay-bank-card">
    <div class="promptpay-tag">📱 {t('promptpayTag')}</div>

    <div class="qr-card-box">
      {#if qrCardSvg}
        {@html qrCardSvg}
        <div class="qr-card-hint">{t('qrCardHint')}</div>
      {:else}
        <div class="qr-frame">
          {#if qrSrc}
            <img src={qrSrc} alt={t('promptpayTag')} />
          {:else}
            <div class="qr-pending">
              {#if qrError}
                ⚠️
              {:else}
                <span class="spinner"></span>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="bank-name">{t('bankName')}</div>
    <div class="account-name">{t('accountName')}</div>

    <div class="pay-amount-box">
      💰 {t('amountDueShort')} <strong>{total.toLocaleString()} บาท</strong>
      <br />
      <span class="pay-per-person">{tc('perPerson', { n: totalPersons })}</span>
    </div>

    <div class="pay-ref-note">📝 {@html tc('refOnTransfer', { ref: booking.ref })}</div>
  </div>

  <div class="upload-card">
    <div class="section-title" style="margin-top:0">
      📤 {t('uploadSlipTitle')}
    </div>

    <div class="upload-note">{t('uploadSlipNote')}</div>

    <div
      class="upload-area {dragOver ? 'drag-over' : ''}"
      role="button"
      tabindex="0"
      aria-label={t('uploadPrompt')}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput?.click();
        }
      }}
    >
      <input type="file" accept="image/*" bind:this={fileInput} onchange={onFileChange} />
      {#if previewUrl}
        <img src={previewUrl} class="preview-img" alt="slip preview" style="display:block" />
      {:else}
        <div class="upload-icon">📄</div>
        <p>{t('uploadPrompt')}</p>
        <p class="hint">{t('uploadHint')}</p>
      {/if}
      {#if slipFile}
        <div style="font-size:12px;color:var(--text-secondary);text-align:center;line-height:1.7">
          <strong>✓ {tc('fileSelected', { name: slipFile.name })}</strong><br />
          <span style="font-size:11px"
            >{tc('sizeKB', { size: (slipFile.size / 1024).toFixed(1) })}</span
          >
        </div>
      {/if}
    </div>

    {#if progressVisible}
      <div class="upload-progress" style="display:block">
        <div class="upload-progress-bar" style="width:{progress}%"></div>
      </div>
    {/if}

    {#if verifyResult}
      <div class="slip-verify-badge {verifyResult.status}">
        {verifyNotice(verifyResult)}
      </div>
      {#if slipQrRefs}
        <div class="slip-qr-refs">{slipQrRefs}</div>
      {/if}
    {/if}

    {#if alertMsg}
      <div class="alert-strip {alertType}">
        {@html alertMsg}
      </div>
    {/if}
  </div>

  <div style="display:flex;gap:10px;margin-bottom:1rem">
    <button
      type="button"
      class="btn-secondary"
      style="flex:0.4"
      onclick={() => {
        if (fileInput) fileInput.value = '';
        slipFile = null;
        previewUrl = '';
        verifyResult = null;
        clearAlert();
        oncancel();
      }}
    >
      ← {t('payCancel')}
    </button>
    <button
      type="button"
      class="btn-primary"
      style="flex:1"
      disabled={submitting}
      onclick={() => void submit()}
    >
      ✅ {t('confirmPay')}
    </button>
  </div>
</div>

<style>
  .qr-pending {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .qr-card-box {
    margin: 1rem auto 1.25rem;
    max-width: 300px;
  }

  .qr-card-box :global(svg) {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }

  .qr-card-hint {
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    color: var(--app-text-secondary);
  }

  .slip-qr-refs {
    margin-top: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.6;
    background: rgba(46, 160, 67, 0.08);
    color: var(--app-text-secondary);
  }

  .slip-verify-badge {
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
  }

  .slip-verify-badge.ok {
    background: rgba(46, 160, 67, 0.12);
    color: #2ea043;
    border: 1px solid rgba(46, 160, 67, 0.4);
  }

  .slip-verify-badge.slip_verify {
    background: rgba(219, 171, 9, 0.12);
    color: #d29922;
    border: 1px solid rgba(219, 171, 9, 0.4);
  }

  .slip-verify-badge.mismatch,
  .slip-verify-badge.unreadable,
  .slip-verify-badge.duplicate {
    background: rgba(248, 81, 73, 0.12);
    color: #f85149;
    border: 1px solid rgba(248, 81, 73, 0.4);
  }
</style>
