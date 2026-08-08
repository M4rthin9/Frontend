<script lang="ts">
  import { router, navigate } from '../../lib/router.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import LangSwitcher from './LangSwitcher.svelte';

  const navItems: { path: string; key: string }[] = [
    { path: 'home', key: 'home' },
    { path: 'booking', key: 'bookingTitle' },
    { path: 'status', key: 'btnStatus' },
  ];

  function isActive(path: string) {
    return router.route === path;
  }
</script>

<header class="sticky top-0 z-40 border-b border-border-strong bg-surface/90 backdrop-blur">
  <div class="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
    <button
      type="button"
      class="flex items-center gap-2"
      aria-label={t('home')}
      onclick={() => navigate('home')}
    >
      <img src="/cida-logo.png" alt="กรมราชทัณฑ์" class="h-10 w-10 rounded-full object-cover" />
      <span class="hidden text-sm font-bold text-text sm:block">{@html t('appName')}</span>
    </button>

    <nav class="ml-auto flex items-center gap-1" aria-label="Main">
      {#each navItems as item (item.path)}
        <button
          type="button"
          onclick={() => navigate(item.path)}
          class="hidden rounded-lg px-3 py-2 text-sm font-semibold transition sm:block {isActive(item.path)
            ? 'bg-bg-subtle text-text'
            : 'text-text-tertiary hover:bg-bg-subtle hover:text-text'}"
        >
          {t(item.key)}
        </button>
      {/each}

      <button
        type="button"
        class="rounded-lg p-2 text-text-tertiary transition hover:bg-bg-subtle hover:text-text"
        aria-label={ui.darkMode ? t('themeLight') : t('themeDark')}
        onclick={ui.toggleDarkMode}
      >
        {#if ui.darkMode}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" /></svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        {/if}
      </button>

      <div class="ml-1">
        <LangSwitcher />
      </div>
    </nav>
  </div>
</header>
