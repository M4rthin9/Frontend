<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import CreditCard from '@lucide/svelte/icons/credit-card';
  import Ban from '@lucide/svelte/icons/ban';
  import Wallet from '@lucide/svelte/icons/wallet';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { ui } from '../../lib/store/ui.svelte';
</script>

<section
  id="home-vis-reservation"
  class="px-6 py-10 sm:px-10 lg:px-14"
  aria-labelledby="vis-announcement-title"
>
  <div
    class="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-black/15 bg-[var(--ct-paper)]"
  >
    <div class="grid lg:grid-cols-2">
      <figure class="bg-[#f3e4ce]">
        <img
          src="/banners/vis-family-reservation.webp"
          alt={t('homeVisImageAlt')}
          width="1536"
          height="1024"
          class="h-full w-full object-cover"
          loading="lazy"
        />
      </figure>
      <div class="flex flex-col justify-center p-6 sm:p-8">
        <p class="ct-label">{t('homeVisLabel')}</p>
        <h2
          id="vis-announcement-title"
          class="mt-3 text-2xl font-semibold leading-snug sm:text-3xl"
        >
          {t('homeVisTitle')}
        </h2>
        <p class="mt-4 leading-relaxed text-[var(--ct-ink-2)]">{t('homeVisDescription')}</p>
        <p class="mt-4 text-sm font-medium leading-relaxed">{t('heroSub')}</p>
        <div class="mt-6 flex flex-wrap items-center gap-4">
          <button
            class="ct-btn ct-btn-orange gap-3"
            type="button"
            onclick={() => navigate('booking')}
          >
            {t('homeVisBook')}<ArrowRight size={20} aria-hidden="true" />
          </button>
          <span class="text-sm text-[var(--ct-ink-2)]" role="status">
            {ui.publicSettings.bookingWindow.open
              ? t('homeStatusBookingOpen')
              : t('homeStatusBookingClosed')}
          </span>
        </div>
      </div>
    </div>

    <div class="border-t border-black/15 p-6 sm:p-8">
      <h3 class="text-lg font-semibold">{t('homeVisRulesTitle')}</h3>
      <p class="mt-2 leading-relaxed text-[var(--ct-ink-2)]">{t('homeVisArrival')}</p>
      <dl class="mt-5 grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-black/10 bg-[#fff5e7] p-5">
          <dt class="text-sm font-medium text-[var(--ct-orange-ink)]">
            {t('homeVisRegistration')}
          </dt>
          <dd class="mt-2 text-3xl font-semibold tabular-nums">08:00–10:30</dd>
        </div>
        <div class="rounded-xl border border-black/10 bg-[#fff5e7] p-5">
          <dt class="text-sm font-medium text-[var(--ct-orange-ink)]">{t('homeVisVisit')}</dt>
          <dd class="mt-2 text-3xl font-semibold tabular-nums">11:00–13:00</dd>
        </div>
      </dl>
      <p class="mt-3 text-sm text-[var(--ct-ink-2)]">{t('tblBangkokTime')}</p>
      <ul class="mt-5 grid gap-5 lg:grid-cols-3">
        <li class="flex gap-3">
          <CreditCard
            class="mt-1 shrink-0 text-[var(--ct-orange-ink)]"
            size={22}
            aria-hidden="true"
          />
          <div>
            <h4 class="font-semibold">{t('homeVisIdTitle')}</h4>
            <p class="mt-1 text-sm leading-relaxed text-[var(--ct-ink-2)]">{t('homeVisId')}</p>
          </div>
        </li>
        <li class="flex gap-3">
          <Ban class="mt-1 shrink-0 text-[var(--ct-orange-ink)]" size={22} aria-hidden="true" />
          <div>
            <h4 class="font-semibold">{t('homeVisPhoneTitle')}</h4>
            <p class="mt-1 text-sm leading-relaxed text-[var(--ct-ink-2)]">{t('homeVisPhone')}</p>
          </div>
        </li>
        <li class="flex gap-3">
          <Wallet class="mt-1 shrink-0 text-[var(--ct-orange-ink)]" size={22} aria-hidden="true" />
          <div>
            <h4 class="font-semibold">{t('homeVisWalletTitle')}</h4>
            <p class="mt-1 text-sm leading-relaxed text-[var(--ct-ink-2)]">{t('homeVisWallet')}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</section>
