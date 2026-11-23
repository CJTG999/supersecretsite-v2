/* WebDuku service worker.
   Navigations are network-first so published game updates appear on refresh.
   Other same-origin assets use stale-while-revalidate for fast/offline access. */
const VERSION = 'webduku-v3';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('webduku-') && key !== VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Always ask the network for HTML first. This prevents an installed PWA or
  // browser tab from reopening an old game build after a reset/update.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const response = await fetch(req, { cache: 'no-store' });
        if (response && response.ok) {
          const cleanUrl = new URL(req.url);
          cleanUrl.search = '';
          cleanUrl.hash = '';
          await cache.put(cleanUrl.href, response.clone());
        }
        return response;
      } catch (error) {
        return (await cache.match(req)) ||
               (await cache.match('./index.html')) ||
               Response.error();
      }
    })());
    return;
  }

  // Keep app assets fast and available offline.
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then(response => {
      if (response && response.ok) cache.put(req, response.clone());
      return response;
    }).catch(() => null);
    if (cached) return cached;
    return (await network) || Response.error();
  })());
});
