<script lang="ts">
  import { onMount } from 'svelte';
  import { booking, CHILD_RELATIONS, RELIGION_OPTIONS } from '../lib/store/booking.svelte';
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

  onMount(() => {
    booking.init();
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
    booking.selectedDate ? toThaiLong(parseLocalDate(booking.selectedDate)) : ''
  );
  const totalPersons = $derived(booking.visitorCount + 1);
  const totalCost = $derived(booking.cost.total);
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
        stroke-linejoin="round"
      ><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
      {t('backHomeShort')}
    </button>

    <div class="booking-head-title">
      <span class="booking-badge">{t('bookingBadge')}</span>
      <h1 class="booking-h1">{t('bookingTitle')}</h1>
      <p class="booking-p">{t('bookingP')}</p>
    </div>
  </div>

  <div class="mb-6">
    <Stepper steps={steps} current={booking.step} />
  </div>

  {#if booking.inlineError && booking.step === 1}
    <div class="error-text-inline">{booking.inlineError}</div>
  {/if}

  {#if booking.step === 1}
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
          bind:value={booking.visitorName}
          error={booking.errors.visitorName}
        />
        <Input
          id="visitorId"
          label={t('idLabel')}
          required
          placeholder="X-XXXX-XXXXX-XX-X หรือ Passport No."
          maxlength={20}
          bind:value={booking.visitorId}
          error={booking.errors.visitorId}
          hint="สามารถกรอกเลขบัตรประชาชน หรือ Passport No."
        />
        <Input
          id="visitorPhone"
          label={t('phoneLabel')}
          required
          type="tel"
          placeholder="08X-XXX-XXXX"
          bind:value={booking.visitorPhone}
          error={booking.errors.visitorPhone}
        />
        <Select
          id="relation"
          label={t('relationLabel')}
          required
          bind:value={booking.relation}
          error={booking.errors.relation}
        >
          <option value="">{t('relationPlaceholder')}</option>
          {#each RELATION_KEYS as key (key)}
            <option value={t(key)}>{t(key)}</option>
          {/each}
        </Select>
        <Select
          id="visitorReligion"
          label={t('religionLabel')}
          required
          bind:value={booking.religion}
          error={booking.errors.religion}
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
          bind:value={booking.allergy}
          error={booking.errors.allergy}
        />
        <div class="form-group full">
          <label for="visitorCount" class="mb-1.5 block text-sm font-semibold text-text-primary">
            {t('visitorCountLabel')} <span class="text-rose-500 ml-0.5">*</span>
            <span style="font-weight:400;color:var(--app-text-secondary)">({t('visitorCountSub')})</span>
          </label>
          <div class="count-grid" role="group" aria-label={t('visitorCountLabel')}>
            {#each COUNT_OPTIONS as n (n)}
              <button
                type="button"
                class="count-btn {n === booking.visitorCount ? 'active' : ''}"
                onclick={() => booking.updateVisitorCount(n)}
                aria-pressed={n === booking.visitorCount}
              >
                {n}
              </button>
            {/each}
          </div>
        </div>
      </div>

      {#if booking.visitorCount > 1}
        <div class="extra-visitors-wrap">
          <div class="extra-visitors-title">
            <span class="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-700">+</span>
            {t('extraVisitorTitle')} <span style="font-weight:400;color:var(--app-text-secondary)">({t('extraVisitorSub')})</span>
          </div>
          {#each booking.extras as extra, i (i)}
            {@const num = i + 2}
            <div class="extra-visitor-block">
              <div class="extra-visitor-num">
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{num}</span>
                ผู้เข้าร่วมกิจกรรม {num}
              </div>
              <div class="form-grid">
                <Input
                  id="extraVisitorName{num}"
                  label="ชื่อ-นามสกุล"
                  required
                  placeholder="เช่น สมหญิง ใจดี"
                  bind:value={extra.name}
                  error={booking.errors[`extraName${num}`]}
                />
                <Input
                  id="extraVisitorId{num}"
                  label="เลขบัตรประชาชน"
                  required
                  placeholder="เลขบัตร ปชช. หรือ Passport"
                  maxlength={20}
                  bind:value={extra.id}
                  error={booking.errors[`extraId${num}`]}
                />
                <Select
                  id="extraVisitorReligion{num}"
                  label="ศาสนา"
                  required
                  bind:value={extra.religion}
                  error={booking.errors[`extraReligion${num}`]}
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
                  error={booking.errors[`extraAllergy${num}`]}
                />
                <Select
                  id="extraVisitorRelation{num}"
                  label="ความสัมพันธ์"
                  required
                  bind:value={extra.relation}
                  error={booking.errors[`extraRelation${num}`]}
                >
                  <option value="">{t('relationPlaceholder')}</option>
                  {#each RELATION_KEYS as key (key)}
                    <option value={t(key)}>{t(key)}</option>
                  {/each}
                </Select>
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
                    error={booking.errors[`extraAge${num}`]}
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="section">
      <div class="section-title">
        <span class="section-num">2</span>
        {t('prisonerInfo')}
      </div>
      <PrisonerSearch />
    </div>

    <div class="section">
      <div class="section-title">
        <span class="section-num">3</span>
        {t('selectDate')}
      </div>
      <Calendar />
    </div>

    <div class="rules">
      <strong>{t('confirmRules')}</strong><br />
      <span>{t('rulesDesc')}</span><br />
      รับจองวันละ <strong>20 โต๊ะ</strong> · ค่าร่วมกิจกรรม <strong>1,000 บาท / คน</strong> (คิดรวมผู้ต้องขัง 1 คนด้วย)<br />
      <span style="color:var(--emerald-600)" class="child-price-note">บุตร/ธิดา (ผู้เข้าร่วมคนที่ 2+): อายุ &lt;5 ปี ฟรี, 5-8 ปี 500 บาท, &gt;8 ปี 1,000 บาท</span><br />
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

    <div class="consent-row">
      <input
        type="checkbox"
        id="consent"
        bind:checked={booking.consent}
        onchange={() => {
          if (booking.consent) {
            const errs = { ...booking.errors };
            delete errs.consent;
            booking.errors = errs;
          }
        }}
      />
      <label for="consent">{t('confirmRules')}</label>
    </div>

    <Button variant="primary" size="lg" fullWidth onclick={() => booking.goToConfirm()}>
      {t('stepConfirm')} →
    </Button>
  {:else if booking.step === 2}
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
            stroke-linejoin="round"
          ><path d="M20 6L9 17l-5-5" /></svg>
        </span>
        {t('confirmInfo')}
      </div>
      <BookingConfirm />
    </div>
  {:else if booking.step === 3}
    <!-- ===== STEP 3: SUCCESS ===== -->
    <BookingSuccess />
  {/if}

  {#if booking.submitting}
    <div class="overlay show">
      <div class="spinner"></div>
      <p>กำลังส่งคำขอจอง...</p>
    </div>
  {/if}
</div>
