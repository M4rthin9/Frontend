<script lang="ts">
  import { t, tc } from '../../lib/i18n/i18n.svelte';
  import { LINE_ADD_URL, LINE_ID } from '../../lib/line';
  import LineIcon from '../ui/LineIcon.svelte';
</script>

<!-- Sits directly above the chat button, on every page. -->
<a
  href={LINE_ADD_URL}
  target="_blank"
  rel="noopener noreferrer"
  class="line-fab group fixed bottom-[5.75rem] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full"
  aria-label={tc('lineFabLabel', { id: LINE_ID })}
>
  <span class="pulse absolute inset-0 rounded-full" aria-hidden="true"></span>
  <LineIcon class="relative h-8 w-8" />
  <span class="label pointer-events-none absolute right-[calc(100%+0.6rem)] top-1/2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm" aria-hidden="true">
    {t('lineAsk')} · <span class="font-semibold tabular-nums">{LINE_ID}</span>
  </span>
</a>

<style>
  .line-fab {
    background: #06c755;
    color: #fff;
    box-shadow:
      0 0 0 3px #fff,
      0 10px 24px -8px rgba(6, 120, 60, 0.6);
    transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  .line-fab:active {
    transform: scale(0.94);
  }
  .line-fab:focus-visible {
    outline: 2px solid #06c755;
    outline-offset: 5px;
  }
  /* Three rings when the page opens, then it stays still. */
  .pulse {
    background: #06c755;
    opacity: 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .pulse {
      animation: line-pulse 1.8s cubic-bezier(0.23, 1, 0.32, 1) 1.2s 3;
    }
  }
  @keyframes line-pulse {
    from {
      opacity: 0.55;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(1.9);
    }
  }
  .label {
    background: #fff;
    color: #231f20;
    box-shadow: 0 8px 20px -10px rgba(0, 0, 0, 0.45);
    opacity: 0;
    transform: translate(6px, -50%);
    transition:
      opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
      transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  @media (hover: hover) and (pointer: fine) {
    .line-fab:hover {
      transform: scale(1.06);
    }
    .line-fab:hover .label {
      opacity: 1;
      transform: translate(0, -50%);
    }
  }
  .line-fab:focus-visible .label {
    opacity: 1;
    transform: translate(0, -50%);
  }
</style>
