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
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    paid: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    cancelled: 'bg-slate-200 text-slate-600 dark:bg-slate-600/25 dark:text-slate-300',
    neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-600/25 dark:text-slate-300',
  };
</script>

<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold {styles[variant]}">
  {@render children?.()}
</span>
