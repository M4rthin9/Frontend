<script lang="ts">
  import { onMount } from 'svelte';
  import { booking, CHILD_RELATIONS, RELIGION_OPTIONS } from '../lib/store/booking.svelte';
  import { t } from '../lib/i18n/i18n.svelte';
  import Stepper from '../components/ui/Stepper.svelte';
  import Input from '../components/ui/Input.svelte';
  import Select from '../components/ui/Select.svelte';
  import Button from '../components/ui/Button.svelte';
  import PrisonerSearch from '../components/booking/PrisonerSearch.svelte';
  import Calendar from '../components/booking/Calendar.svelte';
  import BookingConfirm from '../components/booking/BookingConfirm.svelte';
  import BookingSuccess from '../components/booking/BookingSuccess.svelte';

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

  function onCountChange(event: Event & { currentTarget: HTMLSelectElement }): void {
    booking.updateVisitorCount(Number(event.currentTarget.value));
  }
</script>

<div class="booking-app">
  <div style="margin-bottom:1.5rem">
    <Stepper steps={steps} current={booking.step} />
  </div>

  {#if booking.inlineError && booking.step === 1}
    <div class="error-text-inline">{booking.inlineError}</div>
  {/if}

  {#if booking.step === 1}
    <!-- ===== STEP 1: FORM ===== -->
    <div class="section">
      <div class="section-title">👤 {t('visitorInfo')}</div>
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
          <label for="visitorCount" class="mb-1 block text-sm font-semibold text-text">
            {t('visitorCountLabel')} <span class="text-crimson"> *</span>
            <span style="font-weight:400;color:var(--text-secondary)">({t('visitorCountSub')})</span>
          </label>
          <select
            id="visitorCount"
            value={booking.visitorCount}
            onchange={onCountChange}
            class="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-text transition focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-100"
          >
            {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
              <option value={n}>{n} คน</option>
            {/each}
          </select>
        </div>
      </div>

      {#if booking.visitorCount > 1}
        <div class="extra-visitors-wrap">
          <div class="extra-visitors-title">
            {t('extraVisitorTitle')} <span style="font-weight:400">({t('extraVisitorSub')})</span>
          </div>
          {#each booking.extras as extra, i (i)}
            {@const num = i + 2}
            <div class="extra-visitor-block">
              <div class="extra-visitor-num">ผู้เข้าร่วมกิจกรรม {num}</div>
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
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="section">
      <div class="section-title">🔒 {t('prisonerInfo')}</div>
      <PrisonerSearch />
    </div>

    <div class="section">
      <div class="section-title">📅 {t('selectDate')}</div>
      <Calendar />
    </div>

    <div class="rules">
      <strong>{t('confirmRules')}</strong><br />
      <span>{t('rulesDesc')}</span><br />
      รับจองวันละ <strong>20 โต๊ะ</strong> · ค่าร่วมกิจกรรม <strong>1,000 บาท / คน</strong> (คิดรวมผู้ต้องขัง 1
      คนด้วย)<br />
      <span style="color:var(--green)" class="child-price-note">บุตร/ธิดา (ผู้เข้าร่วมคนที่ 2+): อายุ &lt;5 ปี ฟรี, 5-8 ปี 500 บาท, &gt;8 ปี 1,000
        บาท</span><br />
      <strong>{t('selectDate')}:</strong> <br />
      <span>{t('extraVisitorSub')}</span><br />
      <span>{t('paymentInfoText')}</span>
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
      <div class="section-title">✅ {t('confirmInfo')}</div>
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
