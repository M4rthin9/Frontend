<script lang="ts">
  import { onMount } from 'svelte';
  import Play from '@lucide/svelte/icons/play';
  import Download from '@lucide/svelte/icons/download';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import { VIS_GUIDE_VIDEO } from '../../lib/visGuideVideo';

  let failed = $state(false);
  let videoElement: HTMLVideoElement;
  let videoVisible = $state(false);
  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        videoVisible = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(videoElement);
    return () => observer.disconnect();
  });
</script>

<section
  id="home-visit-video"
  class="visit-video"
  data-chapter="visVideoChapter"
  data-video-visible={videoVisible}
  aria-labelledby="vis-video-title"
>
  <div class="video-inner">
    <div class="video-copy">
      <p class="ct-label"><Play size={17} aria-hidden="true" />{t('visVideoEyebrow')}</p>
      <h2 id="vis-video-title">{t('visVideoTitle')}</h2>
      <p class="video-description">{t('visVideoDescription')}</p>
      <p class="video-meta">
        {VIS_GUIDE_VIDEO.duration} <span aria-hidden="true">·</span>
        {t('visVideoLanguage')}
      </p>
      <ol>
        {#each [1, 2, 3] as step (step)}
          <li><span aria-hidden="true">{step}</span>{t(`visVideoStep${step}`)}</li>
        {/each}
      </ol>
      <p class="video-approval">{t('afterSubmitText')}</p>
      <div class="video-actions">
        <button type="button" class="ct-btn ct-btn-ink" onclick={() => navigate('booking')}
          >{t('homeCtaVisit')}<ArrowRight size={19} aria-hidden="true" /></button
        >
        <a
          href={VIS_GUIDE_VIDEO.src}
          download="vis-reservation-qr-guide-th.mp4"
          class="video-download"><Download size={17} aria-hidden="true" />{t('visVideoDownload')}</a
        >
      </div>
    </div>
    <div class="video-player">
      <video
        bind:this={videoElement}
        controls
        playsinline
        preload="none"
        poster={VIS_GUIDE_VIDEO.poster}
        aria-label={t('visVideoTitle')}
        onerror={() => (failed = true)}
      >
        <source src={VIS_GUIDE_VIDEO.src} type="video/mp4" onerror={() => (failed = true)} />
        <track
          kind="captions"
          src={VIS_GUIDE_VIDEO.captions}
          srclang="th"
          label={t('languageNameth')}
        />
        <a href={VIS_GUIDE_VIDEO.src}>{t('visVideoDownload')}</a>
      </video>
      {#if failed}<p role="alert" class="video-error">
          {t('visVideoError')}
          <a href={VIS_GUIDE_VIDEO.src} target="_blank" rel="noopener">{t('visVideoWatch')}</a>
        </p>{/if}
    </div>
  </div>
</section>

<style>
  :global(body:has(#home-visit-video[data-video-visible='true']) .line-fab),
  :global(body:has(#home-visit-video[data-video-visible='true']) .chat-launcher),
  :global(body:has(#home-visit-video[data-video-visible='true']) .back-to-top),
  :global(body:has(#home-visit-video[data-video-visible='true']) .folio) {
    visibility: hidden;
    pointer-events: none;
  }
  .visit-video {
    padding: clamp(2.5rem, 6vw, 5rem) 1.5rem;
    background: var(--ct-paper);
    border-bottom: 1px solid var(--app-border-subtle);
    scroll-margin-top: 1rem;
  }
  .video-inner {
    display: grid;
    gap: 2.5rem;
    max-width: 72rem;
    margin: auto;
    align-items: center;
  }
  .ct-label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  h2 {
    margin-top: 1rem;
    max-width: 38rem;
    font-size: clamp(1.8rem, 3.1vw, 2.65rem);
    line-height: 1.3;
    font-weight: 500;
    letter-spacing: -0.02em;
    text-wrap: balance;
    color: var(--ct-ink);
  }
  .video-description {
    max-width: 38rem;
    margin-top: 1.2rem;
    font-size: 1rem;
    line-height: 1.8;
    color: var(--ct-ink-2);
  }
  .video-meta {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 1rem;
    color: var(--app-text-secondary);
    font-size: 0.875rem;
  }
  ol {
    display: grid;
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 1.75rem 0;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    font-size: 0.95rem;
    color: var(--ct-ink);
  }
  li span {
    flex: 0 0 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #0b1f33;
    color: #ead6b0;
    font-size: 0.8rem;
  }
  .video-approval {
    max-width: 38rem;
    padding: 0.9rem 1rem;
    border-left: 3px solid #c6a66b;
    background: #fffaf0;
    color: #514331;
    font-size: 0.875rem;
    line-height: 1.8;
  }
  .video-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem 1.5rem;
    margin-top: 1.75rem;
  }
  .video-download {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    color: var(--ct-ink);
    font-size: 0.875rem;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .video-player {
    width: min(100%, 340px);
    justify-self: center;
  }
  video {
    display: block;
    width: 100%;
    aspect-ratio: 9 / 16;
    background: #081b2d;
    border: 1px solid #344b5b;
    border-radius: 16px;
    box-shadow: 0 20px 50px -22px #0b1f3355;
  }
  .video-error {
    margin-top: 1rem;
    font-size: 0.875rem;
    line-height: 1.7;
    color: #a12d2d;
  }
  .video-error a {
    text-decoration: underline;
  }
  button:focus-visible,
  a:focus-visible,
  video:focus-visible {
    outline: 2px solid var(--ct-orange);
    outline-offset: 4px;
  }
  @media (min-width: 800px) {
    .video-inner {
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: clamp(2.5rem, 5vw, 6rem);
    }
  }
  @media (max-width: 480px) {
    .visit-video {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    .video-actions {
      align-items: stretch;
      flex-direction: column;
      gap: 0.5rem;
    }
    .video-download {
      justify-content: center;
    }
  }
</style>
