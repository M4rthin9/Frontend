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

  const inputCls = $derived(`w-full rounded-lg border px-3 py-2.5 text-sm text-text bg-surface placeholder:text-text-tertiary transition focus:outline-none focus:ring-2 ${
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
    <p class="mt-1 text-xs text-crimson">{error}</p>
  {:else if hint}
    <p class="mt-1 text-xs text-text-tertiary">{hint}</p>
  {/if}
</div>
