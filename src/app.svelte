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
  import LineFab from './components/layout/LineFab.svelte';
  import BackToTop from './components/layout/BackToTop.svelte';
  import CookieConsent from './components/consent/CookieConsent.svelte';
  import HomePage from './pages/HomePage.svelte';
  import BookingPage from './pages/BookingPage.svelte';
  import { tableBooking } from './lib/store/booking.svelte';
  import StatusPage from './pages/StatusPage.svelte';
  import TableOpeningCountdown from './components/booking/TableOpeningCountdown.svelte';

  const titles: Record<string, () => string> = {
    home: () => t('appName'),
    booking: () => t('bookingTitle'),
    'table-booking': () => t('tableBookingTitle'),
    status: () => t('btnStatus'),
  };

  let previousRoute = $state(router.route);
  // Every page is printed on the Chef Table paper: always light, with the book's black footer.
  const bookPage = $derived(['home', 'status', 'booking', 'table-booking'].includes(router.route));

  onMount(() => {
    ui.initDarkMode();
    void ui.loadPublicSettings();
    const clock = window.setInterval(() => ui.tick(), 1000);
    const refresh = window.setInterval(() => void ui.loadPublicSettings(), 15000);
    return () => { window.clearInterval(clock); window.clearInterval(refresh); };
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
          {#if ui.publicSettingsLoaded && ui.tableBookingOpen}
            <BookingPage store={tableBooking} />
          {:else if !ui.publicSettingsLoaded}
            <p class="p-8 text-center" role="status">{t('tblSettingsLoading')}</p>
          {/if}
        {:else}
          <StatusPage />
        {/if}
      </div>
    {/key}
  </main>

  <!-- On the home page the footer is the back of the book: the end page's black continues into it.
       The book keeps its own colours there, so the light/dark switch is left to the other pages. -->
  <div class={bookPage ? 'home-book ct-black [--surface:var(--ct-black)] [--footer-link:var(--ct-orange)]' : ''}>
    <Footer themeToggle={!bookPage} />
  </div>
  <LineFab />
  <BackToTop />
  <ChatWidget />
  <Toast />
  <CookieConsent />

  {#if router.route === 'table-booking' && ui.publicSettingsLoaded && !ui.tableBookingOpen}
    <Modal open dismissable={false} title={ui.tableBookingScheduled ? t('tblCountdownTitle') : t('tblClosedTitle')}>
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-3xl">
          ⏸
        </div>
        {#if ui.tableBookingScheduled}
          <TableOpeningCountdown />
        {:else}
          <p class="text-sm leading-relaxed text-text-secondary">{t('tblClosedText')}</p>
        {/if}
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
