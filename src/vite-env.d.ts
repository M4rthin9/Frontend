/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '@lucide/svelte';
declare module '@lucide/svelte/icons/*';

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_TURNSTILE_SITEKEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
