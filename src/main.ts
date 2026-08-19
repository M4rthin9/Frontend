import { mount } from 'svelte';
import './styles/globals.css';
import App from './app.svelte';
import { shouldRegisterServiceWorker } from './lib/env';

const target = document.getElementById('app');
if (target) {
  mount(App, { target });
}

if (shouldRegisterServiceWorker && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW registration is optional; ignore failures */
    });
  });
}
