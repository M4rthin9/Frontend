<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';

  const phone =
    window.matchMedia('(pointer: coarse)').matches &&
    Math.min(window.screen.width, window.screen.height) < 600;
  const media = '/media/vis-guide/queue-dec-2026';
  const version = '?v=20261201';
  const videos = [
    { id: '01-vis-announcement-th', title: 'ประกาศระบบคิวใหม่ VIS', duration: '0:52' },
    { id: '02-vis-how-to-use-th', title: 'วิธีใช้หน้าตรวจสอบสถานะ VIS', duration: '1:06' },
  ];
</script>

<section
  id="vis-queue-announcement"
  lang="th"
  aria-labelledby="vis-queue-title"
  class="border-b border-border-subtle bg-[var(--ct-paper)] px-4 py-10 sm:px-6 sm:py-14"
>
  <div class="mx-auto max-w-6xl">
    <p class="ct-label">
      เริ่มใช้ <time datetime="2026-12-01T00:00:00+07:00">1 ธันวาคม 2569 เวลา 00:00 น.</time>
    </p>
    <h2 id="vis-queue-title" class="mt-2 text-3xl font-semibold text-[var(--ct-ink)]">
      ระบบคิวจองเยี่ยม VIS ใหม่
    </h2>
    <p class="mt-3 max-w-3xl leading-relaxed text-[var(--ct-ink-2)]">
      เลือกวันที่เปิดรับคิวแล้วเก็บเลข VIS ไว้ตรวจสอบสถานะ เมื่อขึ้นว่ารอชำระเงิน
      ให้ชำระและส่งสลิปภายใน 12 ชั่วโมง และไม่เกิน 07:30 น. ของวันเยี่ยม ตามกำหนดที่ถึงก่อน
      หากหมดเวลาชำระ สามารถใช้เลข VIS เดิมเลือกวันใหม่ได้
    </p>
    <div class="mt-6 grid gap-6 md:grid-cols-2">
      {#each videos as video (video.id)}
        {@const asset = `${media}/${video.id}${phone ? '-9x16' : ''}`}
        <figure class="mx-auto w-full max-w-[42rem]" class:phone>
          <figcaption class="mb-2 flex items-baseline justify-between gap-3 text-[var(--ct-ink)]">
            <span class="font-semibold">{video.title}</span>
            <span class="text-sm tabular-nums">{video.duration}</span>
          </figcaption>
          <video
            src={`${asset}.mp4${version}`}
            poster={`${asset}-poster.jpg${version}`}
            class="block w-full rounded-xl bg-[#143029]"
            width={phone ? 1080 : 1920}
            height={phone ? 1920 : 1080}
            preload="none"
            controls
            playsinline
            aria-label={video.title}
          >
            <track
              kind="captions"
              src={`${media}/${video.id}.vtt${version}`}
              srclang="th"
              label="ภาษาไทย"
            />
            <a href={`${asset}.mp4${version}`}>{video.title}</a>
          </video>
        </figure>
      {/each}
    </div>
    <button type="button" class="ct-btn ct-btn-ink mt-6" onclick={() => navigate('status')}>
      {t('checkStatus')}
    </button>
  </div>
</section>

<style>
  video {
    height: auto;
    aspect-ratio: 16 / 9;
  }

  .phone {
    max-width: 21rem;
  }

  .phone video {
    aspect-ratio: 9 / 16;
  }
</style>
