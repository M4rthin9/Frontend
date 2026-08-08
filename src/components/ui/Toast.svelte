<script lang="ts">
  import { ui } from '../../lib/store/ui.svelte';
  import { t } from '../../lib/i18n/i18n.svelte';
  import { fly } from 'svelte/transition';

  const icons: Record<string, string> = {
    success: 'M5 13l4 4L19 7',
    error: 'M18 6 6 18M6 6l12 12',
    warning: 'M12 9v4m0 4h.01',
    info: 'M12 9v4m0 4h.01',
  };

  const colors: Record<string, string> = {
    success: 'border-green-500 text-green-700 dark:text-green-400',
    error: 'border-crimson text-crimson dark:text-red-400',
    warning: 'border-amber-500 text-amber-600 dark:text-amber-400',
    info: 'border-sky-500 text-sky-600 dark:text-sky-400',
  };

  function toastClasses(type: string) {
    return `pointer-events-auto flex items-start gap-3 rounded-xl border-l-4 bg-surface px-4 py-3 shadow-lg ${colors[type]}`;
  }
</script>

<div class="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2">
  {#each ui.toasts as toast (toast.id)}
    <div transition:fly={{ x: 24, duration: 180 }} class={toastClasses(toast.type)}>
      <svg xmlns="http://www.w3.org/2000/svg" class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d={icons[toast.type]} />
      </svg>
      <p class="flex-1 text-sm font-medium text-text">{toast.message}</p>
      <button
        type="button"
        class="shrink-0 rounded p-1 text-text-tertiary transition hover:text-text"
        aria-label={t('toastDismiss')}
        onclick={() => ui.dismissToast(toast.id)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  {/each}
</div>
