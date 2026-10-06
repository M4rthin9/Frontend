<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n/i18n.svelte';
  import { ScrollTrigger } from '../lib/motion';
  import { ui } from '../lib/store/ui.svelte';
  import PromoPopup from '../components/promo/PromoPopup.svelte';
  import PromoCarousel from '../components/promo/PromoCarousel.svelte';
  import Headline from '../components/home/Headline.svelte';
  import VisitGuide from '../components/home/VisitGuide.svelte';
  import CoverSpread from '../components/home/CoverSpread.svelte';
  import DateRail from '../components/home/DateRail.svelte';
  import HomeStatusCheck from '../components/home/HomeStatusCheck.svelte';
  import ChefTable from '../components/home/ChefTable.svelte';
  import CraftChapter from '../components/home/CraftChapter.svelte';
  import VisitSteps from '../components/home/VisitSteps.svelte';
  import HomeFaq from '../components/home/HomeFaq.svelte';
  import SetTable from '../components/home/SetTable.svelte';
  import EndPage from '../components/home/EndPage.svelte';
  import FolioBar from '../components/home/FolioBar.svelte';

  const promo = $derived(ui.publicSettings.promo);
  const bookingWindow = $derived(ui.publicSettings.bookingWindow);
  const hasNews = $derived(promo.notice.enabled || promo.ads.length > 0 || !bookingWindow.open);
  const hasNotice = $derived(promo.notice.enabled && !!(promo.notice.title || promo.notice.body));

  // Scroll-linked sections remember where they start. Anything that changes the
  // page's height above them (news arriving, the date rail filling) would leave
  // them measuring stale positions, so re-measure on every real height change.
  // The comparison against the post-refresh height stops a refresh from looping.
  let page = $state<HTMLElement>();
  onMount(() => {
    let measured = 0;
    let timer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!page || Math.abs(page.offsetHeight - measured) < 2) return;
        ScrollTrigger.refresh();
        measured = page.offsetHeight;
      }, 120);
    });
    if (page) ro.observe(page);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  });
</script>

<!--
  The home page is the printed book "Chef Table ในเรือนจำ" made usable
  (see scrollcraft/builds/ccc-chef-table/BRIEF.md). Chapters are the page's
  direct children with data-chapter; the folio bar numbers and names them.
-->
<PromoPopup />

<div bind:this={page} class="home-book">
  <CoverSpread />
  <VisitGuide />

  <!-- Announcements stay reachable on the page when the popup is off or was dismissed. -->
  {#if hasNews}
    <section data-chapter="ctChNews" class="py-20 sm:py-24" aria-labelledby="home-news">
      <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p class="ct-label">{t('ctChNews')}</p>
        <Headline id="home-news" text={t('ctNewsTitle')} class="ct-h2 mt-4" />
        {#if !bookingWindow.open || hasNotice}
          <!-- The book's black text panel. -->
          <div class="ct-black mt-10 grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
            {#if !bookingWindow.open}
              <div role="status">
                <h3 class="flex items-center gap-2 text-base font-medium text-[var(--ct-orange)]">
                  <span class="h-2 w-2 rounded-full bg-[var(--ct-orange)]" aria-hidden="true"></span>
                  {t('bookingClosedTitle')}
                </h3>
                <p class="mt-2 whitespace-pre-line text-sm font-light leading-relaxed text-text-secondary sm:text-base">
                  {bookingWindow.closedMessage || t('bookingClosedText')}
                </p>
              </div>
            {/if}
            {#if hasNotice}
              <div>
                {#if promo.notice.title}
                  <h3 class="text-lg font-medium text-white">{promo.notice.title}</h3>
                {/if}
                {#if promo.notice.body}
                  <p
                    class="mt-2 whitespace-pre-line text-sm font-light leading-relaxed text-text-secondary sm:text-base"
                  >
                    {promo.notice.body}
                  </p>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>
      <!-- Full page width: the active card centred, its neighbours peeking in at both edges. -->
      {#if promo.ads.length > 0}
        <div class="mt-10 sm:mt-12">
          <PromoCarousel ads={promo.ads} />
        </div>
      {/if}
    </section>
  {/if}

  <DateRail />
  <HomeStatusCheck />
  <VisitSteps />
  <SetTable />
  <HomeFaq />
  <ChefTable />
  <CraftChapter />
  <EndPage />

  <!-- Inside the book so it inherits the book's colours; it carries no data-chapter. -->
  <FolioBar root={page} />
</div>
