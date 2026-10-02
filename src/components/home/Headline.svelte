<script lang="ts">
  import { i18n } from '../../lib/i18n/i18n.svelte';

  let {
    text,
    id,
    level = 2,
    keep = false,
    class: klass = 'ct-h2',
  }: { text: string; id?: string; level?: 1 | 2 | 3; keep?: boolean; class?: string } = $props();

  // The book sets a light lead-in and a medium keyword ("ส่งมอบ|ความรัก").
  // `keep` holds each part on one line, since Thai has no spaces to break at;
  // languages that do separate words get a real space between the parts.
  const parts = $derived(text.split('|'));
  const sep = $derived(i18n.lang === 'en' || i18n.lang === 'vi' ? ' ' : '');
</script>

<svelte:element this={`h${level}`} {id} class={klass}>
  {#each parts as part, i (i)}{i > 0 ? sep : ''}<span class:font-medium={i % 2 === 1} class:inline-block={keep}>{part.trim()}</span>{/each}
</svelte:element>
