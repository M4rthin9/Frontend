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
  let previousFocus: HTMLElement | null = $state(null);

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
    <div class="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" transition:fade={{ duration: 200 }}></div>
    <div
      bind:this={panel}
      class="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border-subtle"
      transition:fly={{ y: 16, duration: 250 }}
    >
      {#if title}
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-lg font-bold text-text-primary tracking-tight">{title}</h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-text-tertiary transition-all duration-200 hover:bg-background-subtle hover:text-text-primary"
            aria-label="Close"
            onclick={close}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      {/if}
      {@render children?.()}
    </div>
  </div>
{/if}
