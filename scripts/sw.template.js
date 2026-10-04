/* CC Cafe frontend — Service Worker (app shell + static asset caching).
 * Build-time placeholders (CACHE name + precache list) are injected by
 * vite-plugin-sw-stamp so every deploy installs a fresh cache. */
const CACHE = __CACHE__;
const PRECACHE = __PRECACHE__;
const API_BASE = __API_BASE__;

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

// Web Push from the backend carries no payload (no encryption keeps it inside the
// Workers Free plan's CPU budget): ask the API what to show for this browser.
async function showPush() {
  let msg = { title: 'CC Cafe', body: 'มีการแจ้งเตือนใหม่ แตะเพื่อดูรายละเอียด', url: '/' };
  try {
    const sub = await self.registration.pushManager.getSubscription();
    if (sub) {
      const res = await fetch(
        API_BASE + '/api/notify/message?endpoint=' + encodeURIComponent(sub.endpoint),
      );
      const data = await res.json();
      if (data && data.status === 'ok' && data.title) msg = data;
    }
  } catch {
    // Offline or API down: the generic text still tells them to look.
  }
  return self.registration.showNotification(msg.title, {
    body: msg.body || '',
    icon: '/cida-logo-192.webp',
    badge: '/cida-logo-64.webp',
    tag: msg.tag || undefined,
    data: { url: msg.url || '/' },
  });
}

self.addEventListener('push', (event) => {
  event.waitUntil(showPush());
});

// Tapping a notification opens the booking's status page, or booking for alerts.
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
