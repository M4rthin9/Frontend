<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n/i18n.svelte';
  import { ScrollTrigger } from '../lib/motion';
  import { ui } from '../lib/store/ui.svelte';
  import PromoPopup from '../components/promo/PromoPopup.svelte';
  import PromoCarousel from '../components/promo/PromoCarousel.svelte';
  import HomeHero from '../components/home/HomeHero.svelte';
  import DateRail from '../components/home/DateRail.svelte';
  import VisitSteps from '../components/home/VisitSteps.svelte';
  import KitchenGallery from '../components/home/KitchenGallery.svelte';
  import HomeFaq from '../components/home/HomeFaq.svelte';
  import VisitTicket from '../components/home/VisitTicket.svelte';

  const promo = $derived(ui.publicSettings.promo);
  const bookingWindow = $derived(ui.publicSettings.bookingWindow);
  const hasNews = $derived(promo.notice.enabled || promo.ads.length > 0 || !bookingWindow.open);

  // Pinned sections remember where they start. Anything that changes the page's
  // height above them (news arriving, the date rail filling, a picked-date hint)
  // would leave them pinning at stale positions, so re-measure on every real
  // height change. The comparison against the post-refresh height stops the
  // pin spacers' own resizing from looping.
  let page: HTMLElement;
  onMount(() => {
    let measured = 0;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(page.offsetHeight - measured) < 2) return;
        ScrollTrigger.refresh();
        measured = page.offsetHeight;
      }, 120);
    });
    ro.observe(page);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  });
</script>

<!--
  The home page plans a visit (see scrollcraft/builds/ccc-visit/BRIEF.md):
  the table, the free dates, the five stations, the kitchen, the questions,
  and finally the ticket the visitor tears off to book.
-->
<PromoPopup />

<div bind:this={page}>
  <HomeHero />

  <!-- Announcements stay reachable on the page when the popup is off or was dismissed. -->
  {#if hasNews}
    <section class="pt-16 sm:pt-20" aria-labelledby="home-news">
      <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h2 id="home-news" class="home-h2">{t('newsHeading')}</h2>
        <div class="mt-8 flex flex-col gap-4">
          {#if !bookingWindow.open}
            <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30" role="status">
              <h3 class="text-sm font-bold text-amber-800 dark:text-amber-300">{t('bookingClosedTitle')}</h3>
              <p class="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {bookingWindow.closedMessage || t('bookingClosedText')}
              </p>
            </div>
          {/if}
          {#if promo.notice.enabled && (promo.notice.title || promo.notice.body)}
            <div class="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
              {#if promo.notice.title}
                <h3 class="text-base font-bold text-text-primary">{promo.notice.title}</h3>
              {/if}
              {#if promo.notice.body}
                <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{promo.notice.body}</p>
              {/if}
            </div>
          {/if}
          {#if promo.ads.length > 0}
            <div class="rounded-2xl border border-border-subtle bg-surface p-3 sm:p-4">
              <PromoCarousel ads={promo.ads} />
            </div>
          {/if}
        </div>
      </div>
    </section>
  {/if}

  <DateRail />
  <VisitSteps />
  <KitchenGallery />
  <HomeFaq />
  <VisitTicket />
</div>
