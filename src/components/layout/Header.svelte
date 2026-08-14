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

<header class="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 backdrop-blur-md">
  <div class="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
    <button
      type="button"
      class="flex items-center gap-2.5 transition-opacity hover:opacity-80"
      aria-label={t('home')}
      onclick={() => navigate('home')}
    >
      <img
        src="/cida-logo-64.webp"
        srcset="/cida-logo-64.webp 64w, /cida-logo-128.webp 128w, /cida-logo-192.webp 192w"
        sizes="36px"
        width="64"
        height="64"
        alt="กรมราชทัณฑ์"
        class="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-100"
      />
      <span class="hidden text-sm font-bold text-text-primary sm:block">{@html t('appName')}</span>
    </button>

    <nav class="ml-auto flex items-center gap-1" aria-label="Main">
      {#each navItems as item (item.path)}
        <button
          type="button"
          onclick={() => navigate(item.path)}
          class="relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 sm:block {isActive(item.path)
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-text-tertiary hover:bg-background-subtle hover:text-text-primary'}"
        >
          {#if isActive(item.path)}
            <span class="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-indigo-600"></span>
          {/if}
          {t(item.key)}
        </button>
      {/each}

      <div class="ml-1 flex items-center gap-0.5">
        <button
          type="button"
          class="rounded-lg p-2 text-text-tertiary transition-all duration-200 hover:bg-background-subtle hover:text-text-primary"
          aria-label={ui.darkMode ? t('themeLight') : t('themeDark')}
          onclick={() => ui.toggleDarkMode()}
        >
          {#if ui.darkMode}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
          {/if}
        </button>

        <div class="ml-0.5">
          <LangSwitcher />
        </div>
      </div>
    </nav>
  </div>
</header>
