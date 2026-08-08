import { mount } from 'svelte'
import './styles/globals.css'
import App from './app.svelte'

const target = document.getElementById('app')
if (target) {
  mount(App, { target })
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW registration is optional; ignore failures */
    })
  })
}
