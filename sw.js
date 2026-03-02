// ============================================
// RANGER BEERS — Service Worker
// Cache-first for static assets, network-first for HTML, skip API calls
// ============================================

const CACHE_NAME = 'ranger-beers-v2';

const PRECACHE_URLS = [
  '/courses.html',
  '/styles.css',
  '/course-auth.js',
  '/course-engine.js',
  '/course-styles.css',
  '/images/ranger-tab.png',
];

// Install — precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API calls — always go to network
  if (url.hostname.includes('ranger-beers-api') || url.hostname.includes('workers.dev')) {
    return;
  }

  // Skip external resources (fonts, snipcart, botpress, analytics)
  if (url.hostname !== self.location.hostname) {
    return;
  }

  // HTML pages — network-first, fall back to cache
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (CSS, JS, images) — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
