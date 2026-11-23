/* Retired WebDuku service worker.
   New releases do not register a service worker. This file exists only so
   browsers with an older installed worker can update it, unregister it, and
   remove the old WebDuku Cache API entries. */
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const registrations = await self.registration.unregister();
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(name => name.startsWith('webduku-'))
          .map(name => caches.delete(name))
      );
    } catch (error) {}
  })());
});
