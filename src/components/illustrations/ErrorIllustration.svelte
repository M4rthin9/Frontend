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
  <path d="M60 18L110 98H10L60 18Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" />
  <path d="M60 44V66" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  <circle cx="60" cy="86" r="3" fill="currentColor" />
  <path d="M38 108H82" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.35" />
</svg>
