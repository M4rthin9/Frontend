import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { swStamp } from './plugins/sw-stamp.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss(), swStamp()],
});
