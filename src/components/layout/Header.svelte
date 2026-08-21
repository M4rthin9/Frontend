<script lang="ts">
  import { router, navigate } from '../../lib/router.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { ui } from '../../lib/store/ui.svelte';
  import LangSwitcher from './LangSwitcher.svelte';
  import Sun from '@lucide/svelte/icons/sun';
  import Moon from '@lucide/svelte/icons/moon';

  const navItems: { path: string; key: string }[] = [
    { path: 'home', key: 'home' },
    { path: 'booking', key: 'bookingTitle' },
    { path: 'status', key: 'btnStatus' },
  ];

  function isActive(path: string) {
    return router.route === path;
  }
</script>

<header class="sticky top-0 z-40 border-b border-border-subtle bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/80 shadow-sm">
  <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-200/40 to-transparent"></div>
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
        class="h-9 w-9 rounded-full object-cover ring-2 ring-border-subtle"
      />
      <span class="hidden text-sm font-bold text-text-primary sm:block">{@html t('appName')}</span>
    </button>

    <nav class="ml-auto flex items-center gap-1" aria-label="Main">
      {#each navItems as item (item.path)}
        <button
          type="button"
          onclick={() => navigate(item.path)}
          class="relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 sm:block {isActive(item.path)
            ? 'bg-red-50 text-red-700'
            : 'text-text-tertiary hover:bg-background-subtle hover:text-text-primary'}"
        >
          {#if isActive(item.path)}
            <span class="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-red-700"></span>
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
            <Sun class="h-5 w-5" />
          {:else}
            <Moon class="h-5 w-5" />
          {/if}
        </button>

        <div class="ml-0.5">
          <LangSwitcher />
        </div>
      </div>
    </nav>
  </div>
</header>
