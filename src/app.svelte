<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { router, navigate } from './lib/router.svelte';
  import { i18n, t } from './lib/i18n/i18n.svelte';
  import { ui } from './lib/store/ui.svelte';
  import DevBanner from './components/layout/DevBanner.svelte';
  import LangSwitcher from './components/layout/LangSwitcher.svelte';
  import Footer from './components/layout/Footer.svelte';
  import Toast from './components/ui/Toast.svelte';
  import Modal from './components/ui/Modal.svelte';
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

  <div class="fixed right-4 top-4 z-50">
    <LangSwitcher />
  </div>

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

  {#if router.route === 'table-booking'}
    <Modal open title={t('tblComingSoonTitle')}>
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-3xl">
          🚧
        </div>
        <p class="text-sm leading-relaxed text-text-secondary">{@html t('tblComingSoonText')}</p>
        <button
          type="button"
          class="mt-6 w-full rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:bg-red-800"
          onclick={() => navigate('home')}
        >
          {t('tblComingSoonOk')}
        </button>
      </div>
    </Modal>
  {/if}
</div>
