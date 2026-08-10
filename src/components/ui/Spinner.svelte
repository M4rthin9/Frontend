<script lang="ts">
  let {
    size = 'md',
    color = 'text-indigo-600',
    label = 'Loading',
  }: {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    label?: string;
  } = $props();

  const sizes: Record<string, string> = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };
</script>

<div role="status" aria-label={label}>
  <div class="animate-spin rounded-full border-current border-t-transparent {sizes[size]} {color}"></div>
  <span class="sr-only">{label}</span>
</div>
