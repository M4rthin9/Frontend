<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
</script>

<footer class="border-t border-border-strong bg-surface py-8">
  <div class="mx-auto max-w-3xl px-4 text-center">
    <p class="text-sm leading-relaxed text-text-tertiary">{@html t('footer')}</p>
    <a
      href="https://main.correct.go.th"
      target="_blank"
      rel="noopener"
      class="mt-2 inline-block text-sm font-semibold text-navy-600 underline"
    >
      main.correct.go.th
    </a>
  </div>
</footer>
