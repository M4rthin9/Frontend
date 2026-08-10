<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
</script>

<footer class="border-t border-border-subtle bg-surface">
  <div class="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
    <div class="mb-4 flex items-center justify-center gap-2">
      <img src="/cida-logo.png" alt="กรมราชทัณฑ์" class="h-8 w-8 rounded-full object-cover opacity-70" />
      <span class="text-sm font-semibold text-text-secondary">{@html t('appName')}</span>
    </div>
    <p class="text-sm leading-relaxed text-text-tertiary">{@html t('footer')}</p>
    <a
      href="https://main.correct.go.th"
      target="_blank"
      rel="noopener"
      class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700"
    >
      main.correct.go.th
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
    </a>
    <div class="mt-6 flex items-center justify-center gap-6 text-xs text-text-tertiary">
      <span>© {new Date().getFullYear()}</span>
      <span class="h-1 w-1 rounded-full bg-border-strong"></span>
      <span>กรมราชทัณฑ์</span>
    </div>
  </div>
</footer>
