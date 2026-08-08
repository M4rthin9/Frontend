<script lang="ts">
  import { tick } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    title = '',
    onClose,
    children,
  }: {
    open?: boolean;
    title?: string;
    onClose?: () => void;
    children?: Snippet;
  } = $props();

  let panel: HTMLElement | null = $state(null);
  let previousFocus: HTMLElement | null = null;

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) close();
  }

  async function close() {
    open = false;
    onClose?.();
    await tick();
  }

  $effect(() => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      panel?.focus();
    } else if (previousFocus) {
      previousFocus.focus();
      previousFocus = null;
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
    onkeydown={handleKeydown}
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="absolute inset-0 bg-black/50" transition:fade={{ duration: 150 }}></div>
    <div
      bind:this={panel}
      class="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
      transition:fly={{ y: 12, duration: 200 }}
    >
      {#if title}
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-bold text-text">{title}</h2>
          <button
            type="button"
            class="rounded-full p-1.5 text-text-tertiary transition hover:bg-bg-subtle hover:text-text"
            aria-label="Close"
            onclick={close}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      {/if}
      {@render children?.()}
    </div>
  </div>
{/if}
