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
    primary: 'bg-[var(--ct-orange,#f5821f)] text-[var(--ct-ink,#231f20)] hover:bg-[#ff9a45]',
    gold: 'bg-[var(--ct-ink,#231f20)] text-white hover:bg-[#3d3637]',
    secondary: 'bg-surface text-text-primary border border-border-strong hover:border-[var(--ct-ink,#231f20)]',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-text-secondary hover:bg-background-subtle hover:text-text-primary',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  {style}
  class="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 select-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--ct-orange,#f5821f)] {variants[variant]} {sizes[size]} {fullWidth ? 'w-full' : ''} {className}"
  {...rest}
>
  {@render children?.()}
</button>
