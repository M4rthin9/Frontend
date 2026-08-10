<script lang="ts">
  import { t, tc } from '../../lib/i18n/i18n.svelte';
  import { uploadSlip, updateSlipAndStatus } from '../../lib/api/endpoints';
  import type { PublicReservation } from '../../lib/api/types';

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

  const visitorCount = $derived(parseInt(String(booking.visitorCount)) || 1);
  const totalPersons = $derived(visitorCount + 1);
  const total = $derived(parseInt(String(booking.total)) || totalPersons * 1000);

  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
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
    clearAlert();
    void readAsDataURL(file).then((url) => {
      previewUrl = url;
    });
  }

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
      const base64Data = await readAsDataURL(slipFile);
      const url = await uploadSlip({
        ref: booking.ref,
        fileName: slipFile.name,
        mimeType: slipFile.type,
        base64Data,
      });
      progress = 70;
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
        tc('uploadSlipFail', { msg: err instanceof Error ? err.message : t('retryBtn') })
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

    <div class="qr-frame">
      <img src="/promptpay-qr.png" alt="PromptPay QR" />
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
      <input
        type="file"
        accept="image/*"
        bind:this={fileInput}
        onchange={onFileChange}
      />
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
          <span style="font-size:11px">{tc('sizeKB', { size: (slipFile.size / 1024).toFixed(1) })}</span>
        </div>
      {/if}
    </div>

    {#if progressVisible}
      <div class="upload-progress" style="display:block">
        <div class="upload-progress-bar" style="width:{progress}%"></div>
      </div>
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
        clearAlert();
        oncancel();
      }}
    >
      ← {t('payCancel')}
    </button>
    <button type="button" class="btn-primary" style="flex:1" disabled={submitting} onclick={() => void submit()}>
      ✅ {t('confirmPay')}
    </button>
  </div>
</div>
