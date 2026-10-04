/* CC Cafe frontend — Service Worker (app shell + static asset caching).
 * Build-time placeholders (CACHE name + precache list) are injected by
 * vite-plugin-sw-stamp so every deploy installs a fresh cache. */
const CACHE = __CACHE__;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// Web Push from the backend: { title, body, data: { ref?, url?, type } }.
self.addEventListener('push', (event) => {
  let msg;
  try {
    msg = event.data ? event.data.json() : {};
  } catch {
    msg = { body: event.data ? event.data.text() : '' };
  }
  const data = msg.data || {};
  const ref = data.ref || '';
  // Booking events open that booking's status; "booking opens" alerts send their own url.
  const url = data.url || (ref ? '/#/status?ref=' + encodeURIComponent(ref) : '/#/status');
  event.waitUntil(
    self.registration.showNotification(msg.title || 'CC Cafe', {
      body: msg.body || '',
      icon: '/cida-logo-192.webp',
      badge: '/cida-logo-64.webp',
      tag: ref || data.type || undefined,
      data: { url },
    }),
  );
});

// Tapping a notification opens that booking's status page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.openWindow(url));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // SPA navigations: network-first, fall back to cached shell for offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Static assets: cache-first, refresh in background (stale-while-revalidate).
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
