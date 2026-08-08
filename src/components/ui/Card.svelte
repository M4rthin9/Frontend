<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    subtitle,
    padded = true,
    children,
    ...rest
  }: {
    title?: string;
    subtitle?: string;
    padded?: boolean;
    children?: Snippet;
  } = $props();
</script>

<div
  class="rounded-2xl border border-border-strong bg-surface shadow-sm {padded ? 'p-6' : ''}"
  {...rest}
>
  {#if title}
    <h2 class="text-lg font-bold text-text">{title}</h2>
  {/if}
  {#if subtitle}
    <p class="mt-1 text-sm text-text-tertiary">{subtitle}</p>
  {/if}
  {#if title || subtitle}
    <div class="mt-4"></div>
  {/if}
  {@render children?.()}
</div>
