<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
</script>

<!-- The book's last page: black, with the thanks. -->
<section
  id="home-end"
  data-chapter="ctChEnd"
  class="ct-black pb-8 pt-20 sm:pt-28"
  aria-labelledby="home-end-title"
>
  <div
    class="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16"
  >
    <div>
      <h2
        id="home-end-title"
        class="text-[clamp(2.2rem,1.6rem+2.4vw,3.4rem)] font-medium leading-tight"
      >
        {t('ctEndTitle')}
      </h2>
      <p class="mt-6 max-w-xl text-base font-light leading-relaxed text-text-secondary sm:text-lg">
        {t('ctEndText')}
      </p>
      <p class="mt-4 text-sm text-text-tertiary">{t('ctEndSource')}</p>
    </div>

    <div class="lg:text-right">
      <p class="ct-masthead text-[clamp(3rem,12vw,5.5rem)] text-[var(--ct-orange)]">
        {t('textEndPage1')}<br />{t('textEndPage2')}
      </p>
    </div>
  </div>
</section>
