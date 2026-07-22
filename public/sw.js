const CACHE_NAME = 'trek-premi-images-v1';

// Cache Firebase Storage and Unsplash images
const shouldCache = (url) => {
  return (
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('images.unsplash.com') ||
    url.includes('storage.googleapis.com')
  );
};

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (!shouldCache(request.url)) return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return cached || new Response('', { status: 408 });
      }
    })
  );
});
