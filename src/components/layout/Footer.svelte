<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import LangSwitcher from './LangSwitcher.svelte';
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
      class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 transition-colors hover:text-indigo-800"
    >
      main.correct.go.th
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M7 7h10v10"/></svg>
    </a>

    <div class="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
      <LangSwitcher />
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-tertiary transition-all duration-200 hover:bg-background-subtle hover:text-text-primary"
        aria-label={ui.darkMode ? t('themeLight') : t('themeDark')}
        onclick={() => ui.toggleDarkMode()}
      >
        {#if ui.darkMode}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>
          {t('themeLight')}
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          {t('themeDark')}
        {/if}
      </button>
    </div>

    <div class="mt-6 flex items-center justify-center gap-6 text-xs text-text-tertiary">
      <span>© {new Date().getFullYear()}</span>
      <span class="h-1 w-1 rounded-full bg-border-strong"></span>
      <span>กรมราชทัณฑ์</span>
    </div>
  </div>
</footer>
