<script lang="ts">
  import { onMount } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import CirclePause from '@lucide/svelte/icons/circle-pause';
  import {
    booking as defaultBooking,
    CHILD_RELATIONS,
    RELIGION_OPTIONS,
    type BookingStore,
  } from '../lib/store/booking.svelte';
  import { t, tc, defaultText } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';
  import { ui } from '../lib/store/ui.svelte';
  import Stepper from '../components/ui/Stepper.svelte';
  import Input from '../components/ui/Input.svelte';
  import Select from '../components/ui/Select.svelte';
  import Button from '../components/ui/Button.svelte';
  import PrisonerSearch from '../components/booking/PrisonerSearch.svelte';
  import Calendar from '../components/booking/Calendar.svelte';
  import BookingConfirm from '../components/booking/BookingConfirm.svelte';
  import BookingSuccess from '../components/booking/BookingSuccess.svelte';
  import { toThaiLong } from '../lib/utils/date';

  // One page serves both flows. `store.mode` decides whether the prisoner step
  // is shown and which endpoint the submit hits — see BookingStore.
  let { store = defaultBooking }: { store?: BookingStore } = $props();
  const isTable = $derived(store.isTable);

  onMount(() => {
    store.init();
  });

  const steps = $derived([t('stepBooking'), t('stepConfirm'), t('stepRef')]);

  const RELATION_KEYS = [
    'relationFather',
    'relationPartner',
    'relationChild',
    'relationSibling',
    'relationRelative',
    'relationFriend',
    'relationLawyer',
    'relationOther',
  ];

  // One table seats 5 people (the person who books included). The prisoner-visit
  // flow has no seat limit, so it keeps the original 1-10 picker.
  const COUNT_OPTIONS = $derived(Array.from({ length: store.isTable ? 5 : 10 }, (_, i) => i + 1));

  function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  const visitDateLabel = $derived(
    store.selectedDate ? toThaiLong(parseLocalDate(store.selectedDate)) : '',
  );
  const totalPersons = $derived(store.totalPersons);
  const totalCost = $derived(store.cost.total);
</script>

<!-- Printed on the Chef Table paper, like the home and status pages. -->
<div class="home-book book-paper">
  <header class="ct-black">
    <div class="mx-auto w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6 sm:pb-28">
      <button type="button" class="ct-link text-sm" onclick={() => navigate('home')}>
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        {t('backHomeShort')}
      </button>
      <p class="ct-label mt-10 flex sm:mt-14">
        {isTable ? t('tableBookingBadge') : t('bookingBadge')}
      </p>
      <h1
        class="mt-4 text-balance text-[clamp(2.1rem,1.5rem+2.6vw,3.25rem)] font-medium leading-[1.15] tracking-[-0.01em]"
      >
        {isTable ? t('tableBookingTitle') : t('bookingTitle')}
      </h1>
      <p class="mt-3 max-w-xl text-base font-light leading-relaxed text-text-secondary">
        {isTable ? t('tableBookingP') : t('bookingP')}
      </p>
    </div>
  </header>

  <div class="mx-auto -mt-14 w-full max-w-3xl px-4 sm:px-6">
    <div class="booking-app">
      <div class="stepper-card mb-6">
        <Stepper {steps} current={store.step} />
      </div>

      {#if store.inlineError && store.step === 1}
        <div class="error-text-inline">{store.inlineError}</div>
      {/if}

      {#if store.step === 1 && !ui.publicSettings.bookingWindow.open}
        <!-- Admin closed all public booking: no form, just the reason. -->
        <div class="section text-center" role="status">
          <div
            class="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#fff1e5] text-[var(--ct-orange-ink)]"
          >
            <CirclePause class="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 class="text-lg font-bold text-text-primary">{t('bookingClosedTitle')}</h2>
          <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
            {ui.publicSettings.bookingWindow.closedMessage || t('bookingClosedText')}
          </p>
          <button type="button" class="ct-btn ct-btn-ink mt-6" onclick={() => navigate('home')}>
            {t('backHomeShort')}
          </button>
        </div>
      {:else if store.step === 1}
        <!-- ===== STEP 1: FORM ===== -->
        <div class="section">
          <div class="section-title">
            <span class="section-num">1</span>
            {t('visitorInfo')}
          </div>
          <div class="form-grid">
            <Input
              id="visitorName"
              label={t('nameLabel')}
              required
              placeholder={t('textBookingPage1')}
              bind:value={store.visitorName}
              error={store.errors.visitorName}
            />
            <Input
              id="visitorId"
              label={t('idLabel')}
              required
              placeholder={t('textBookingPage2')}
              maxlength={20}
              bind:value={store.visitorId}
              error={store.errors.visitorId}
              hint="สามารถกรอกเลขบัตรประชาชน หรือ Passport No."
            />
            <Input
              id="visitorPhone"
              label={t('phoneLabel')}
              required
              type="tel"
              placeholder={t('textBookingPage3')}
              bind:value={store.visitorPhone}
              error={store.errors.visitorPhone}
            />
            {#if !isTable}
              <Select
                id="relation"
                label={t('relationLabel')}
                required
                bind:value={store.relation}
                error={store.errors.relation}
              >
                <option value="">{t('relationPlaceholder')}</option>
                {#each RELATION_KEYS as key (key)}
                  <option value={defaultText(key)}>{t(key)}</option>
                {/each}
              </Select>
            {/if}
            <Select
              id="visitorReligion"
              label={t('religionLabel')}
              required
              bind:value={store.religion}
              error={store.errors.religion}
            >
              {#each RELIGION_OPTIONS as r, i (r)}
                <option value={i === 0 ? '' : r}>{t(`religionOption${i}`)}</option>
              {/each}
            </Select>
            <Input
              id="visitorAllergy"
              label={t('allergyLabel')}
              required
              placeholder={t('allergyPlaceholder')}
              bind:value={store.allergy}
              error={store.errors.allergy}
            />
            {#if CHILD_RELATIONS.includes(store.relation)}
              <Input
                id="visitorAge"
                label={t('textBookingPage4')}
                required
                type="number"
                min={0}
                max={120}
                placeholder={t('ageChildRule')}
                bind:value={store.visitorAge}
                error={store.errors.visitorAge}
              />
            {/if}
            <div class="form-group full">
              <label
                for="visitorCount"
                class="mb-1.5 block text-sm font-semibold text-text-primary"
              >
                {t('visitorCountLabel')} <span class="text-rose-500 ml-0.5">*</span>
                <span style="font-weight:400;color:var(--app-text-secondary)"
                  >({isTable ? t('visitorCountSubTable') : t('visitorCountSub')})</span
                >
              </label>
              <div class="count-grid" role="group" aria-label={t('visitorCountLabel')}>
                {#each COUNT_OPTIONS as n (n)}
                  <button
                    type="button"
                    class="count-btn {n === store.visitorCount ? 'active' : ''}"
                    onclick={() => store.updateVisitorCount(n)}
                    aria-pressed={n === store.visitorCount}
                  >
                    {n}
                  </button>
                {/each}
              </div>
            </div>
          </div>

          {#if store.visitorCount > 1}
            <div class="extra-visitors-wrap">
              <div class="extra-visitors-title">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-[#f3eee9] text-xs font-bold text-text-primary"
                  >+</span
                >
                {t('extraVisitorTitle')}
                <span style="font-weight:400;color:var(--app-text-secondary)"
                  >({t('extraVisitorSub')})</span
                >
              </div>
              {#each store.extras as extra, i (i)}
                {@const num = i + 2}
                <div class="extra-visitor-block">
                  <div class="extra-visitor-num">
                    <span
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ct-ink)] text-xs font-bold text-white"
                      >{num}</span
                    >
                    {t('textBookingPage5')}
                    {num}
                  </div>
                  <div class="form-grid">
                    <Input
                      id="extraVisitorName{num}"
                      label={t('textBookingPage6')}
                      required
                      placeholder={t('textBookingPage7')}
                      bind:value={extra.name}
                      error={store.errors[`extraName${num}`]}
                    />
                    <Input
                      id="extraVisitorId{num}"
                      label={t('textBookingPage8')}
                      required
                      placeholder={t('textBookingPage9')}
                      maxlength={20}
                      bind:value={extra.id}
                      error={store.errors[`extraId${num}`]}
                    />
                    <Select
                      id="extraVisitorReligion{num}"
                      label={t('textBookingPage10')}
                      required
                      bind:value={extra.religion}
                      error={store.errors[`extraReligion${num}`]}
                    >
                      {#each RELIGION_OPTIONS as r, i (r)}
                        <option value={i === 0 ? '' : r}>{t(`religionOption${i}`)}</option>
                      {/each}
                    </Select>
                    <Input
                      id="extraVisitorAllergy{num}"
                      label={t('textBookingPage11')}
                      required
                      placeholder={t('allergyPlaceholder')}
                      bind:value={extra.allergy}
                      error={store.errors[`extraAllergy${num}`]}
                    />
                    {#if !isTable}
                      <Select
                        id="extraVisitorRelation{num}"
                        label={t('textBookingPage12')}
                        required
                        bind:value={extra.relation}
                        error={store.errors[`extraRelation${num}`]}
                      >
                        <option value="">{t('relationPlaceholder')}</option>
                        {#each RELATION_KEYS as key (key)}
                          <option value={defaultText(key)}>{t(key)}</option>
                        {/each}
                      </Select>
                    {/if}
                  </div>
                  {#if CHILD_RELATIONS.includes(extra.relation)}
                    <div class="mt-3">
                      <Input
                        id="extraVisitorAge{num}"
                        label={t('textBookingPage13')}
                        required
                        type="number"
                        min={0}
                        max={120}
                        placeholder={t('ageChildRule')}
                        bind:value={extra.age}
                        error={store.errors[`extraAge${num}`]}
                      />
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>

        {#if !isTable}
          <div class="section">
            <div class="section-title">
              <span class="section-num">2</span>
              {t('prisonerInfo')}
            </div>
            <PrisonerSearch {store} />
          </div>
        {/if}

        <div class="section">
          <div class="section-title">
            <span class="section-num">{isTable ? 2 : 3}</span>
            {t('selectDate')}
          </div>
          <Calendar {store} />
        </div>

        <div class="rules">
          <strong>{t('confirmRules')}</strong><br />
          <span class="whitespace-pre-line">{t(isTable ? 'rulesDesc' : 'homeVisRulesText')}</span
          ><br />
          {#if isTable}
            {t('textBookingPage14')} <strong>{store.perDay} {t('textBookingPage15')}</strong>
            {t('textBookingPage16')} <strong>{t('textBookingPage17')}</strong><br />
            <span style="color:var(--emerald-600)">
              {t('textBookingPage18')} <strong>{store.holdMinutes} {t('textBookingPage19')}</strong>
              {t('textBookingPage20')}</span
            ><br />
          {:else}
            {t('textBookingPage21')} <strong>{store.perDay} {t('textBookingPage22')}</strong>
            {t('textBookingPage23')} <strong>{t('textBookingPage24')}</strong>
            {t('textBookingPage25')}<br />
          {/if}
          {#if !isTable}
            <span style="color:var(--emerald-600)" class="child-price-note"
              >{t('textBookingPage26')}</span
            ><br />
          {/if}
          <strong>{t('selectDate')}:</strong> <br />
          <span>{t('extraVisitorSub')}</span><br />
          <span>{t('paymentInfoText')}</span>
        </div>

        <div class="booking-summary">
          <div class="bs-item">
            <span class="bs-label">{t('lblVisitDate')}</span>
            <span class="bs-value">{visitDateLabel || '—'}</span>
          </div>
          <div class="bs-item">
            <span class="bs-label">{t('lblCount')}</span>
            <span class="bs-value"
              >{isTable ? tc('countFormatTable', { n: totalPersons }) : totalPersons + ' คน'}</span
            >
          </div>
          <div class="bs-item">
            <span class="bs-label">{t('lblCost')}</span>
            <span class="bs-value bs-total"
              >{totalCost.toLocaleString()} {t('textBookingPage27')}</span
            >
          </div>
        </div>

        <div class="consent-row" class:consent-checked={store.consent}>
          <input
            type="checkbox"
            id="consent"
            bind:checked={store.consent}
            onchange={() => {
              if (store.consent) {
                const errs = { ...store.errors };
                delete errs.consent;
                store.errors = errs;
              }
            }}
          />
          <label for="consent">{t('confirmRules')}</label>
        </div>

        <Button variant="primary" size="lg" fullWidth onclick={() => store.goToConfirm()}>
          {t('stepConfirm')} →
        </Button>
      {:else if store.step === 2}
        <!-- ===== STEP 2: CONFIRM ===== -->
        <div class="section">
          <div class="section-title">
            <span class="section-num">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg
              >
            </span>
            {t('confirmInfo')}
          </div>
          <BookingConfirm {store} />
        </div>
      {:else if store.step === 3}
        <!-- ===== STEP 3: SUCCESS ===== -->
        <BookingSuccess {store} />
      {/if}

      {#if store.submitting}
        <div class="overlay show">
          <div class="spinner"></div>
          <p>{t('textBookingPage28')}</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .stepper-card {
    position: relative;
    background: var(--surface);
    border: 1px solid var(--app-border-subtle);
    border-radius: 8px;
    box-shadow: 0 24px 40px -30px rgba(35, 31, 32, 0.6);
    padding: 1.25rem 1.25rem 0.75rem;
  }
  @media (min-width: 640px) {
    .stepper-card {
      padding: 1.5rem 2rem 1rem;
    }
  }
</style>
