// ============================================
// RANGER BEERS — Service Worker
// Network-first for all resources, cache as offline fallback
// ============================================

const CACHE_NAME = 'ranger-beers-v10'; // Increment version when JS/CSS paths change

const PRECACHE_URLS = [
  '/ranger/courses.html',
  '/css/styles.css',
  '/css/course-styles.css',
  '/js/config.js',
  '/js/shared.js',
  '/js/course-auth.js',
  '/js/course-engine.js',
  '/images/ranger-tab.png',
];

// Install — precache critical assets for offline use
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

// Fetch — network-first for everything, fall back to cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API calls — always go to network, no caching
  if (url.hostname.includes('ranger-beers-api') || url.hostname.includes('workers.dev')) {
    return;
  }

  // Skip external resources (fonts, snipcart, analytics)
  if (url.hostname !== self.location.hostname) {
    return;
  }

  // Everything — network-first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
