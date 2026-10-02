// Ranger Beers Supply Co. service worker.
// Pages register /sw.js. This worker intentionally does not cache anything:
// it clears caches left by older versions and lets every request go to the
// network, so a deploy is never hidden behind a stale offline copy.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});
