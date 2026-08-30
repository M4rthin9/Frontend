<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { router } from './lib/router.svelte';
  import { i18n, t } from './lib/i18n/i18n.svelte';
  import { ui } from './lib/store/ui.svelte';
  import DevBanner from './components/layout/DevBanner.svelte';
  import Footer from './components/layout/Footer.svelte';
  import Toast from './components/ui/Toast.svelte';
  import ChatWidget from './components/chat/ChatWidget.svelte';
  import HomePage from './pages/HomePage.svelte';
  import BookingPage from './pages/BookingPage.svelte';
  import { tableBooking } from './lib/store/booking.svelte';
  import StatusPage from './pages/StatusPage.svelte';

  const titles: Record<string, () => string> = {
    home: () => t('appName'),
    booking: () => t('bookingTitle'),
    'table-booking': () => t('tableBookingTitle'),
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
  <DevBanner />

  <main class="flex-1">
    {#key router.route}
      <div
        in:fade={{
          duration:
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 0
              : 150,
        }}
      >
        {#if router.route === 'home'}
          <HomePage />
        {:else if router.route === 'booking'}
          <BookingPage />
        {:else if router.route === 'table-booking'}
          <!-- Same page, driven by the no-prisoner store. -->
          <BookingPage store={tableBooking} />
        {:else}
          <StatusPage />
        {/if}
      </div>
    {/key}
  </main>

  <Footer />
  <ChatWidget />
  <Toast />
</div>
