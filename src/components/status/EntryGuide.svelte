<script lang="ts">
  import { t } from '../../lib/i18n/i18n.svelte';
  import { navigate } from '../../lib/router.svelte';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { VIS_GUIDE_VIDEO } from '../../lib/visGuideVideo';
</script>

<details class="entry-guide">
  <summary
    ><BookOpen size={20} aria-hidden="true" /><span>{t('entryGuideTitle')}</span><ChevronDown
      class="guide-chevron"
      size={18}
      aria-hidden="true"
    /></summary
  >
  <div class="guide-body">
    <p class="guide-intro">{t('entryGuideIntro')}</p>
    <a class="guide-video" href={VIS_GUIDE_VIDEO.src} target="_blank" rel="noopener">{t('visVideoWatch')} · {VIS_GUIDE_VIDEO.duration}</a>
    <ol>
      {#each [1, 2, 3, 4] as step (step)}
        <li>
          <span class="guide-number" aria-hidden="true">{step}</span>
          <div>
            <h3>{t(`entryGuideStep${step}Title`)}</h3>
            <p>{t(`entryGuideStep${step}`)}</p>
          </div>
        </li>
      {/each}
    </ol>
    <div class="guide-reminders">
      <p>{t('entryGuideParty')}</p>
      <p>{t('entryGuideChanges')}</p>
      <p>{t('entryGuidePhones')}</p>
    </div>
    <button type="button" class="ct-btn ct-btn-line" onclick={() => navigate('status')}
      >{t('entryGuideOpenStatus')}</button
    >
  </div>
</details>

<style>
  .entry-guide {
    text-align: left;
    border: 1px solid var(--app-border-subtle);
    border-radius: 12px;
    background: var(--surface);
    color: var(--app-text);
    overflow: hidden;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 18px 20px;
    min-height: 56px;
    font-size: 1rem;
    font-weight: 500;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:focus-visible {
    outline: 2px solid var(--ct-orange);
    outline-offset: -4px;
  }
  :global(.guide-chevron) {
    margin-left: auto;
    flex-shrink: 0;
  }
  .entry-guide[open] :global(.guide-chevron) {
    transform: rotate(180deg);
  }
  .guide-body {
    padding: 0 20px 22px;
  }
  .guide-intro,
  li p,
  .guide-reminders {
    font-size: 0.875rem;
    line-height: 1.7;
    color: var(--app-text-secondary);
  }
  .guide-video { display: inline-flex; align-items: center; min-height: 44px; margin-top: .5rem; font-size: .875rem; text-decoration: underline; text-underline-offset: 4px; color: var(--app-text); }
  ol {
    list-style: none;
    padding: 0;
    margin: 22px 0;
    display: grid;
    gap: 20px;
  }
  li {
    display: flex;
    gap: 14px;
  }
  .guide-number {
    flex: 0 0 30px;
    height: 30px;
    display: grid;
    place-items: center;
    background: #0b1f33;
    color: #ead6b0;
    border-radius: 50%;
    font-size: 0.8rem;
  }
  h3 {
    font-size: 0.9375rem;
    font-weight: 500;
    margin-bottom: 4px;
  }
  .guide-reminders {
    border-left: 3px solid #c6a66b;
    padding: 12px 16px;
    background: var(--app-bg);
    margin-bottom: 20px;
  }
  .guide-reminders p + p {
    margin-top: 8px;
  }
  @media (max-width: 400px) {
    summary {
      padding: 16px;
    }
    .guide-body {
      padding: 0 16px 18px;
    }
  }
</style>
