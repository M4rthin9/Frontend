<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from './lib/router.svelte';
  import { i18n, t } from './lib/i18n/i18n.svelte';
  import { ui } from './lib/store/ui.svelte';
  import Footer from './components/layout/Footer.svelte';
  import Toast from './components/ui/Toast.svelte';
  import ChatWidget from './components/chat/ChatWidget.svelte';
  import HomePage from './pages/HomePage.svelte';
  import BookingPage from './pages/BookingPage.svelte';
  import StatusPage from './pages/StatusPage.svelte';

  const titles: Record<string, () => string> = {
    home: () => t('appName'),
    booking: () => t('bookingTitle'),
    status: () => t('btnStatus'),
  };

  let previousRoute = $state(router.route);

  onMount(() => {
    ui.initDarkMode();
  });

  $effect(() => {
    document.documentElement.lang = i18n.lang;
  });

  $effect(() => {
    if (router.route !== previousRoute) {
      window.scrollTo(0, 0);
      previousRoute = router.route;
    }
  });
</script>

<svelte:head>
  <title>{titles[router.route]()}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-background">
  <main class="flex-1">
    {#if router.route === 'home'}
      <HomePage />
    {:else if router.route === 'booking'}
      <BookingPage />
    {:else}
      <StatusPage />
    {/if}
  </main>

  <Footer />
  <ChatWidget />
  <Toast />
</div>
