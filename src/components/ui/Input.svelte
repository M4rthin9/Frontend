<script lang="ts">
  let {
    id,
    label,
    error,
    hint,
    type = 'text',
    placeholder,
    maxlength,
    min,
    max,
    step,
    disabled = false,
    required = false,
    value = $bindable(''),
    oninput,
    ...rest
  }: {
    id: string;
    label?: string;
    error?: string;
    hint?: string;
    type?: string;
    placeholder?: string;
    maxlength?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    required?: boolean;
    value?: string;
    oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
  } = $props();

  const inputCls = $derived(`w-full rounded-xl border px-3.5 py-2.5 text-sm text-text-primary bg-surface placeholder:text-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 ${
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
      : 'border-border-strong focus:border-indigo-500 focus:ring-indigo-100'
  } ${disabled ? 'bg-background-muted cursor-not-allowed opacity-70' : ''}`);
</script>

<div>
  {#if label}
    <label for={id} class="mb-1.5 block text-sm font-semibold text-text-primary">
      {label}{#if required}<span class="text-rose-500 ml-0.5">*</span>{/if}
    </label>
  {/if}
  <input
    {id}
    {type}
    {placeholder}
    {maxlength}
    {min}
    {max}
    {step}
    {disabled}
    {required}
    class={inputCls}
    aria-invalid={error ? 'true' : undefined}
    {...rest}
    value={value}
    oninput={(e) => {
      value = e.currentTarget.value;
      oninput?.(e);
    }}
  />
  {#if error}
    <p class="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      {error}
    </p>
  {:else if hint}
    <p class="mt-1.5 text-xs text-text-tertiary">{hint}</p>
  {/if}
</div>
