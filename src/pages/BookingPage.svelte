<script lang="ts">
  import { onMount } from 'svelte';
  import {
    booking as defaultBooking,
    CHILD_RELATIONS,
    RELIGION_OPTIONS,
    type BookingStore,
  } from '../lib/store/booking.svelte';
  import { t } from '../lib/i18n/i18n.svelte';
  import { navigate } from '../lib/router.svelte';
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

  const COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

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

<div class="booking-app">
  <div class="booking-head">
    <button type="button" class="booking-back" onclick={() => navigate('home')}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg
      >
      {t('backHomeShort')}
    </button>

    <div class="booking-head-title">
      <span class="booking-badge">{isTable ? t('tableBookingBadge') : t('bookingBadge')}</span>
      <h1 class="booking-h1">{isTable ? t('tableBookingTitle') : t('bookingTitle')}</h1>
      <p class="booking-p">{isTable ? t('tableBookingP') : t('bookingP')}</p>
    </div>
  </div>
  <div class="mb-6">
    <Stepper {steps} current={store.step} />
  </div>

  {#if store.inlineError && store.step === 1}
    <div class="error-text-inline">{store.inlineError}</div>
  {/if}

  {#if store.step === 1}
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
          placeholder="เช่น สมชาย ใจดี"
          bind:value={store.visitorName}
          error={store.errors.visitorName}
        />
        <Input
          id="visitorId"
          label={t('idLabel')}
          required
          placeholder="X-XXXX-XXXXX-XX-X หรือ Passport No."
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
          placeholder="08X-XXX-XXXX"
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
              <option value={t(key)}>{t(key)}</option>
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
          {#each RELIGION_OPTIONS as r (r)}
            <option value={r === '-- เลือก --' ? '' : r}>{r}</option>
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
            label="อายุ (ปี)"
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
          <label for="visitorCount" class="mb-1.5 block text-sm font-semibold text-text-primary">
            {t('visitorCountLabel')} <span class="text-rose-500 ml-0.5">*</span>
            <span style="font-weight:400;color:var(--app-text-secondary)"
              >({t('visitorCountSub')})</span
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
              class="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-xs font-bold text-red-700"
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
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-red-700 text-xs font-bold text-white"
                  >{num}</span
                >
                ผู้เข้าร่วมกิจกรรม {num}
              </div>
              <div class="form-grid">
                <Input
                  id="extraVisitorName{num}"
                  label="ชื่อ-นามสกุล"
                  required
                  placeholder="เช่น สมหญิง ใจดี"
                  bind:value={extra.name}
                  error={store.errors[`extraName${num}`]}
                />
                <Input
                  id="extraVisitorId{num}"
                  label="เลขบัตรประชาชน"
                  required
                  placeholder="เลขบัตร ปชช. หรือ Passport"
                  maxlength={20}
                  bind:value={extra.id}
                  error={store.errors[`extraId${num}`]}
                />
                <Select
                  id="extraVisitorReligion{num}"
                  label="ศาสนา"
                  required
                  bind:value={extra.religion}
                  error={store.errors[`extraReligion${num}`]}
                >
                  {#each RELIGION_OPTIONS as r (r)}
                    <option value={r === '-- เลือก --' ? '' : r}>{r}</option>
                  {/each}
                </Select>
                <Input
                  id="extraVisitorAllergy{num}"
                  label="การแพ้อาหาร"
                  required
                  placeholder={t('allergyPlaceholder')}
                  bind:value={extra.allergy}
                  error={store.errors[`extraAllergy${num}`]}
                />
                {#if !isTable}
                  <Select
                    id="extraVisitorRelation{num}"
                    label="ความสัมพันธ์"
                    required
                    bind:value={extra.relation}
                    error={store.errors[`extraRelation${num}`]}
                  >
                    <option value="">{t('relationPlaceholder')}</option>
                    {#each RELATION_KEYS as key (key)}
                      <option value={t(key)}>{t(key)}</option>
                    {/each}
                  </Select>
                {/if}
              </div>
              {#if CHILD_RELATIONS.includes(extra.relation)}
                <div class="mt-3">
                  <Input
                    id="extraVisitorAge{num}"
                    label="อายุ (ปี)"
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
      <span>{t('rulesDesc')}</span><br />
      {#if isTable}
        รับจองวันละ <strong>{store.perDay} โต๊ะ</strong> · ค่าร่วมกิจกรรม
        <strong>1,000 บาท / คน</strong><br />
        <span style="color:var(--emerald-600)">
          จองแล้วชำระเงินได้ทันที — ระบบจะกันโต๊ะไว้ให้ <strong>{store.holdMinutes} นาที</strong>
          หากยังไม่ชำระเงินภายในเวลาดังกล่าว การจองจะถูกยกเลิกอัตโนมัติ</span
        ><br />
      {:else}
        รับจองวันละ <strong>{store.perDay} โต๊ะ</strong> · ค่าร่วมกิจกรรม
        <strong>1,000 บาท / คน</strong> (คิดรวมผู้ต้องขัง 1 คนด้วย)<br />
      {/if}
      {#if !isTable}
        <span style="color:var(--emerald-600)" class="child-price-note"
          >บุตร/ธิดา (ผู้เข้าร่วมคนที่ 2+): อายุ &lt;5 ปี ฟรี, 5-8 ปี 500 บาท, &gt;8 ปี 1,000 บาท</span
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
        <span class="bs-value">{totalPersons} คน</span>
      </div>
      <div class="bs-item">
        <span class="bs-label">{t('lblCost')}</span>
        <span class="bs-value bs-total">{totalCost.toLocaleString()} บาท</span>
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
      <p>กำลังส่งคำขอจอง...</p>
    </div>
  {/if}
</div>
