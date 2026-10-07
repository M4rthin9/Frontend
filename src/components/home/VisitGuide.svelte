<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import UtensilsCrossed from '@lucide/svelte/icons/utensils-crossed';
  import Search from '@lucide/svelte/icons/search';
  import Check from '@lucide/svelte/icons/check';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';

  const bookingOpen = $derived(ui.publicSettings.bookingWindow.open);
  const tableClosed = $derived(!ui.tableBookingOpen);
  const shortcuts = $derived([
    { id: 'home-steps', label: t('ctChSteps') },
    { id: 'home-table', label: t('price') },
    { id: 'home-faq', label: t('ctChFaq') },
    { id: 'home-story', label: t('guideStory') },
  ]);

  function jump(id: string): void {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  }
</script>

<section id="home-guide" data-chapter="guideLabel" class="guide" aria-labelledby="guide-title">
  <div class="guide-inner">
    <div class="guide-heading">
      <div>
        <p class="ct-label">{t('guideLabel')}</p>
        <h2 id="guide-title">{t('guideTitle')}</h2>
        <p class="guide-sub">{t('guideSub')}</p>
      </div>
      <nav aria-label={t('guideLabel')} class="shortcuts">
        {#each shortcuts as shortcut (shortcut.id)}
          <button type="button" onclick={() => jump(shortcut.id)}
            >{shortcut.label}<ArrowRight size={14} aria-hidden="true" /></button
          >
        {/each}
      </nav>
    </div>

    <div class="options">
      <article class="option option-featured">
        <div class="option-top">
          <CalendarDays size={24} aria-hidden="true" /><span class="availability"
            >{bookingOpen ? t('homeStatusBookingOpen') : t('homeStatusBookingClosed')}</span
          >
        </div>
        <h3>{t('guideVisitTitle')}</h3>
        <p>{t('guideVisitDesc')}</p>
        <button type="button" class="ct-btn ct-btn-orange reservation-button" onclick={() => navigate('booking')}
          >{t('homeCtaVisit')}<ArrowRight size={22} aria-hidden="true" /></button
        >
      </article>
      <article class="option">
        <div class="option-top">
          <UtensilsCrossed size={24} aria-hidden="true" />{#if tableClosed}<span class="availability"
              >{ui.tableBookingScheduled ? t('tblCountdownTitle') : t('tblClosedTitle')}</span
            >{/if}
        </div>
        <h3>{t('guideTableTitle')}</h3>
        <p>{t('guideTableDesc')}</p>
        <button type="button" class="ct-btn ct-btn-orange reservation-button" onclick={() => navigate('table-booking')}
          >{t('btnTableBook')}<ArrowRight
            size={22}
            aria-hidden="true"
          /></button
        >
      </article>
      <article class="option option-status">
        <div class="option-top"><Search size={24} aria-hidden="true" /></div>
        <h3>{t('guideStatusTitle')}</h3>
        <p>{t('guideStatusDesc')}</p>
        <button type="button" class="ct-btn ct-btn-ink" onclick={() => navigate('status')}
          >{t('btnStatus')}<ArrowRight size={18} aria-hidden="true" /></button
        >
      </article>
    </div>

    <div class="prepare">
      <div>
        <Check size={20} aria-hidden="true" />
        <div>
          <h3>{t('guidePrepareTitle')}</h3>
          <p>{t('guidePrepareDesc')}</p>
        </div>
      </div>
      <div>
        <Check size={20} aria-hidden="true" />
        <div>
          <h3>{t('guideArrivalTitle')}</h3>
          <p>{t('guideArrivalDesc')}</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .guide {
    padding: clamp(3rem, 6vw, 5.5rem) 1.5rem;
    background: linear-gradient(145deg, #fff9f0, var(--ct-paper) 65%);
    border-bottom: 1px solid var(--app-border-subtle);
  }
  .guide-inner {
    max-width: 72rem;
    margin: auto;
  }
  .guide-heading {
    display: flex;
    justify-content: space-between;
    align-items: end;
    gap: 2rem;
    flex-wrap: wrap;
  }
  h2 {
    margin-top: 1rem;
    font-size: clamp(1.8rem, 3.2vw, 2.8rem);
    line-height: 1.25;
    font-weight: 500;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }
  .guide-sub {
    margin-top: 1rem;
    max-width: 42rem;
    color: var(--ct-ink-2);
    line-height: 1.7;
  }
  .shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .shortcuts button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0.55rem 0.9rem;
    border: 1px solid var(--app-border-subtle);
    border-radius: 99px;
    background: #fff;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .options {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 2.5rem;
  }
  .option {
    display: flex;
    flex-direction: column;
    align-items: start;
    padding: clamp(1.25rem, 2.5vw, 2rem);
    background: #fff;
    border: 1px solid var(--app-border-subtle);
    border-radius: 1rem;
    box-shadow: 0 12px 36px -26px #6e422d55;
  }
  .option-featured {
    border-top: 3px solid var(--ct-orange);
    background: #fffaf3;
  }
  .option-status {
    background: var(--ct-linen);
  }
  .option-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 2rem;
    color: var(--ct-orange-ink);
  }
  .availability {
    max-width: 80%;
    border-radius: 99px;
    padding: 0.3rem 0.65rem;
    background: #fff;
    border: 1px solid var(--app-border-subtle);
    font-size: 0.75rem;
    color: var(--ct-ink-2);
  }
  .option h3 {
    margin-top: 1.5rem;
    font-size: 1.3rem;
    font-weight: 500;
    line-height: 1.4;
    text-wrap: balance;
  }
  .option p {
    margin: 0.75rem 0 1.5rem;
    color: var(--ct-ink-2);
    line-height: 1.75;
  }
  .option button {
    margin-top: auto;
    width: 100%;
    justify-content: space-between;
    text-align: left;
    gap: 0.75rem;
    white-space: normal;
  }
  .prepare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--app-border-subtle);
  }
  .option .reservation-button {
    min-height: 4.5rem;
    padding: 1rem 1.25rem;
    border-radius: 0.85rem;
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1.5;
  }
  .reservation-button :global(svg) { flex-shrink: 0; }
  .prepare > div {
    display: flex;
    align-items: start;
    gap: 0.75rem;
  }
  .prepare :global(svg) {
    color: var(--ct-orange-ink);
    flex-shrink: 0;
    margin-top: 0.15rem;
  }
  .prepare h3 {
    font-size: 0.95rem;
    font-weight: 600;
  }
  .prepare p {
    font-size: 0.9rem;
    line-height: 1.7;
    margin-top: 0.4rem;
    color: var(--ct-ink-2);
  }
  button:focus-visible {
    outline: 2px solid var(--ct-orange-ink);
    outline-offset: 4px;
  }
  @media (hover: hover) {
    .shortcuts button:hover {
      border-color: var(--ct-orange-ink);
      background: #fff4e5;
    }
  }
  @media (max-width: 767px) {
    .options,
    .prepare {
      grid-template-columns: 1fr;
    }
    .guide {
      padding-inline: 1rem;
    }
    .option h3 {
      margin-top: 1rem;
    }
    .prepare {
      gap: 1.25rem;
    }
  }
  :global(.home-book > section[id]) {
    scroll-margin-top: 2rem;
  }
</style>
