<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    id,
    label,
    error,
    required = false,
    disabled = false,
    value = $bindable(''),
    children,
    ...rest
  }: {
    id: string;
    label?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    value?: string;
    children?: Snippet;
  } = $props();

  const selectCls = $derived(`w-full rounded-lg border px-3 py-2.5 text-sm text-text bg-surface transition focus:outline-none focus:ring-2 ${
    error
      ? 'border-crimson focus:border-crimson focus:ring-red-100'
      : 'border-border-strong focus:border-navy-500 focus:ring-navy-100'
  } ${disabled ? 'bg-bg-muted cursor-not-allowed' : ''}`);
</script>

<div>
  {#if label}
    <label for={id} class="mb-1 block text-sm font-semibold text-text">
      {label}{#if required}<span class="text-crimson"> *</span>{/if}
    </label>
  {/if}
  <select {id} {disabled} {required} bind:value class={selectCls} aria-invalid={error ? 'true' : undefined} {...rest}>
    {@render children?.()}
  </select>
  {#if error}
    <p class="mt-1 text-xs text-crimson">{error}</p>
  {/if}
</div>
