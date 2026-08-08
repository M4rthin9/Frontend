<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    fullWidth = false,
    class: className = '',
    style,
    children,
    onclick,
    ...rest
  }: {
    variant?: 'primary' | 'gold' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    fullWidth?: boolean;
    class?: string;
    style?: string;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
  } = $props();

  const variants: Record<string, string> = {
    primary: 'bg-navy-600 text-white hover:bg-navy-700 shadow-sm',
    gold: 'bg-gold text-navy-900 hover:bg-gold-400 shadow-sm',
    secondary: 'bg-surface text-text border border-border-strong hover:bg-bg-subtle',
    danger: 'bg-crimson text-white hover:bg-crimson-600 shadow-sm',
    ghost: 'bg-transparent text-text-secondary hover:bg-bg-subtle',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  {style}
  class="inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text {variants[variant]} {sizes[size]} {fullWidth ? 'w-full' : ''} {className}"
  {...rest}
>
  {@render children?.()}
</button>
