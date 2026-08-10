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
  class="rounded-2xl border border-border-subtle bg-surface shadow-sm hover:shadow-md transition-all duration-300 {padded ? 'p-6' : ''}"
  {...rest}
>
  {#if title}
    <h2 class="text-lg font-bold text-text-primary tracking-tight">{title}</h2>
  {/if}
  {#if subtitle}
    <p class="mt-1 text-sm text-text-tertiary leading-relaxed">{subtitle}</p>
  {/if}
  {#if title || subtitle}
    <div class="mt-5"></div>
  {/if}
  {@render children?.()}
</div>
