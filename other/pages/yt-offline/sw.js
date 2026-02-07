const CACHE_NAME = 'video-cache-v1';

// This install event is mainly for pre-caching static assets if you had any
// For this app, caching is done dynamically by the main thread and fetch event.
self.addEventListener('install', event => {
    console.log('Service Worker: Installed');
    // Ensure the service worker is activated immediately
    self.skipWaiting();
});

// Activate event: good for cleaning up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve();
                })
            );
        })
    );
    // Claim clients to take control of existing pages immediately
    event.waitUntil(self.clients.claim());
});

// Fetch event: This is where we intercept requests and serve from cache if available
self.addEventListener('fetch', event => {
    // Only intercept requests for the video if it's in our cache
    // We check if the request URL matches any of the URLs in our video cache.
    event.respondWith(
        caches.match(event.request).then(response => {
            // If the video is in the cache, serve it
            if (response) {
                console.log('Service Worker: Serving from cache:', event.request.url);
                return response;
            }
            // Otherwise, fetch from the network (e.g., if it's a new video or other assets)
            console.log('Service Worker: Fetching from network:', event.request.url);
            return fetch(event.request);
        }).catch(error => {
            console.error('Service Worker fetch error:', error);
            // Fallback for when both cache and network fail (e.g., completely offline and not cached)
            // You might want to return a placeholder image or a "network error" page here
            return new Response('<h1>Offline Error: Video not found in cache and network unavailable.</h1>', {
                headers: { 'Content-Type': 'text/html' }
            });
        })
    );
});