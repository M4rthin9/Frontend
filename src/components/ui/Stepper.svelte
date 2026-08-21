<script lang="ts">
  let {
    steps,
    current,
  }: {
    steps: string[];
    current: number;
  } = $props();
</script>

<ol class="flex items-center">
  {#each steps as label, i (label)}
    {@const step = i + 1}
    <li class="flex flex-1 items-center {i === steps.length - 1 ? 'flex-none' : ''}">
      <div class="flex flex-col items-center">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300
            {step < current
              ? 'border-red-700 bg-red-700 text-white shadow-md'
              : step === current
                ? 'border-red-700 bg-surface text-text-primary shadow-sm'
                : 'border-border-strong bg-surface text-text-tertiary'}"
        >
          {#if step < current}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
          {:else}
            {step}
          {/if}
        </div>
        <span class="mt-2 text-center text-xs font-semibold {step <= current ? 'text-text-primary' : 'text-text-tertiary'}">{label}</span>
      </div>
      {#if i < steps.length - 1}
        <div class="mx-2 mb-6 h-0.5 flex-1 rounded {step < current ? 'bg-red-700' : 'bg-background-muted'}"></div>
      {/if}
    </li>
  {/each}
</ol>
