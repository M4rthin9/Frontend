<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import LangSwitcher from './LangSwitcher.svelte';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';
  import ExternalLink from '@lucide/svelte/icons/external-link';
</script>

<footer class="border-t border-border-subtle bg-surface">
  <div aria-hidden="true" class="h-px w-full bg-gradient-to-r from-transparent via-gold-200/60 to-transparent"></div>
  <div class="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
    <div class="mb-4 flex items-center justify-center gap-2">
      <img
        src="/cida-logo-64.webp"
        srcset="/cida-logo-64.webp 64w, /cida-logo-128.webp 128w, /cida-logo-192.webp 192w"
        sizes="32px"
        width="64"
        height="64"
        alt="กรมราชทัณฑ์"
        class="h-8 w-8 rounded-full object-cover opacity-70"
      />
      <span class="text-sm font-semibold text-text-secondary">{@html t('appName')}</span>
    </div>
    <p class="text-sm leading-relaxed text-text-tertiary">{@html t('footer')}</p>
    <a
      href="https://main.correct.go.th"
      target="_blank"
      rel="noopener"
      class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 transition-colors hover:text-red-800"
    >
      main.correct.go.th
      <ExternalLink class="h-3.5 w-3.5" />
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
          <Sun class="h-4 w-4" />
          {t('themeLight')}
        {:else}
          <Moon class="h-4 w-4" />
          {t('themeDark')}
        {/if}
      </button>
    </div>

    <div class="mt-6 flex items-center justify-center gap-6 text-xs text-text-tertiary">
      <span>© {new Date().getFullYear()}</span>
      <span class="h-1 w-1 rounded-full bg-border-strong"></span>
      <span>กรมราชทัณฑ์</span>
    </div>

    <div class="mt-4 border-t border-border-subtle pt-4">
      <p class="text-xs text-text-tertiary">
        ออกแบบและพัฒนาโดย <span class="font-semibold text-text-secondary">พงศ์สิน พวษ์วชิรินทร์</span>
      </p>
    </div>
  </div>
</footer>
