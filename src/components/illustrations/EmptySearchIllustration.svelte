<script lang="ts">
  let { size = 120 }: { size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 120 120"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-hidden="true"
  class="mx-auto"
>
  <circle cx="54" cy="48" r="28" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  <path d="M74 68L92 86" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  <rect x="22" y="82" width="48" height="28" rx="4" stroke="currentColor" stroke-width="1.6" />
  <path d="M30 92H62M30 100H52" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  <circle cx="54" cy="48" r="6" stroke="currentColor" stroke-width="1.2" opacity="0.35" />
</svg>
