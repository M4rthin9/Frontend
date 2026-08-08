<script lang="ts">
  import { i18n } from '../../lib/i18n/i18n.svelte';
  import type { Lang } from '../../lib/i18n/i18n.svelte';

  const languages: Lang[] = ['th', 'en', 'zh'];
</script>

<div class="flex items-center gap-1 rounded-full border border-border-strong bg-bg-subtle p-0.5">
  {#each languages as code (code)}
    <button
      type="button"
      class="rounded-full px-2.5 py-1 text-xs font-bold transition {i18n.lang === code
        ? 'bg-surface text-text shadow-sm'
        : 'text-text-tertiary hover:bg-bg-muted hover:text-text'}"
      aria-pressed={i18n.lang === code}
      onclick={() => i18n.setLanguage(code)}
    >
      {i18n.langName(code)}
    </button>
  {/each}
</div>
