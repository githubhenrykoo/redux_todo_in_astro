const CACHE_NAME = 'notion-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/sync/page/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Coba ambil dari cache dulu
        const cachedResponse = await cache.match(event.request);
        
        try {
          // Ambil data baru dari network
          const networkResponse = await fetch(event.request);
          const clonedResponse = networkResponse.clone();
          
          // Simpan ke cache
          cache.put(event.request, clonedResponse);
          
          // Kembalikan response dari network
          return networkResponse;
        } catch (error) {
          // Jika network gagal, gunakan cache
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })
    );
  }
});