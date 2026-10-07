<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
</script>

<div class="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="note">
  <h3 class="mb-2 text-sm font-bold">{t('tblAgreementTitle')}</h3>
  <p class="text-sm leading-relaxed">{t('tblNoPrisonerSeating')}</p>
  <p class="mt-2 text-sm font-semibold leading-relaxed">{t('tblNoChangesText')}</p>
  <p class="mt-2 text-sm font-semibold leading-relaxed">{t('tblNoRefundText')}</p>
</div>
