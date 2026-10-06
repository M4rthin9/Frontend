<script lang="ts">
  import { fade } from 'svelte/transition';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import { t } from '../../lib/i18n/i18n.svelte';

  // A screen of scrolling; below that the top is already one short flick away.
  const SHOW_AFTER = 480;
  let visible = $state(false);

  $effect(() => {
    const sync = () => (visible = window.scrollY > SHOW_AFTER);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  });

  function toTop(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
</script>

<!-- Sits above the LINE button (bottom-[5.75rem]) and the chat button (bottom-6). -->
{#if visible}
  <button
    type="button"
    transition:fade={{ duration: 160 }}
    onclick={toTop}
    aria-label={t('backToTop')}
    class="fixed bottom-[10rem] right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-background text-text-primary shadow-lg transition hover:scale-105"
  >
    <ArrowUp class="h-6 w-6" aria-hidden="true" />
  </button>
{/if}
