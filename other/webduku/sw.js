/* WebDuku service worker: offline-first app shell.
   Strategy: stale-while-revalidate for same-origin GETs. The game opens instantly from cache (even offline)
   and quietly refreshes in the background, so updates appear the NEXT time the app is launched.
   Bump VERSION whenever you change the SHELL list so old caches get purged. */
const VERSION = 'webduku-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = (await cache.match(req, { ignoreSearch: true })) ||
                   (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    const network = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (cached) return cached;
    return (await network) || Response.error();
  })());
});
