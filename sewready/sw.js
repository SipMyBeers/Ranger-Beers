// ══════════════════════════════════════════════════════════════
//  SewReady — Service Worker
//  Cache-first for static assets, network-first for API,
//  stale-while-revalidate for HTML
// ══════════════════════════════════════════════════════════════

const CACHE_VERSION = 'sewready-v6';
const STATIC_CACHE = CACHE_VERSION + '-static';
const API_CACHE = CACHE_VERSION + '-api';

// Static assets to pre-cache
const PRECACHE = [
  '/styles.css',
  '/customer.css',
  '/print.css',
  '/translations.js',
  '/shared-data.js',
  '/services-data.js',
  '/inventory-data.js',
  '/data-store.js',
  '/admin-auth.js?v=2',
  '/auth-gate.js',
  '/driver-app.js',
];

// Install — pre-cache static assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// Activate — clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key.startsWith('sewready-') && key !== STATIC_CACHE && key !== API_CACHE;
        }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Notification click — focus or open driver app
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.indexOf('/driver') !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/driver.html');
    })
  );
});

// Fetch strategy
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).then(function (response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(API_CACHE).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Static assets (CSS, JS, images): stale-while-revalidate
  var isStatic = /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$/i.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        var fetchPromise = fetch(event.request).then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(STATIC_CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function () {
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // HTML pages: stale-while-revalidate
  if (event.request.headers.get('Accept') && event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        var fetchPromise = fetch(event.request).then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(STATIC_CACHE).then(function (cache) {
              cache.put(event.request, clone);
            });
          }
          return response;
        }).catch(function () {
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }
});
