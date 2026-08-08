<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'neutral',
    children,
  }: {
    variant?: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled' | 'neutral';
    children?: Snippet;
  } = $props();

  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    approved: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    paid: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
    rejected: 'bg-red-100 text-crimson dark:bg-red-500/15 dark:text-red-300',
    cancelled: 'bg-slate-200 text-slate-600 dark:bg-slate-600/25 dark:text-slate-300',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-600/25 dark:text-slate-300',
  };
</script>

<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold {styles[variant]}">
  {@render children?.()}
</span>
