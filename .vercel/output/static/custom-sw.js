// This is a custom service worker implementation

const CACHE_NAME = 'redux-todo-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[Custom ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Custom ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Custom ServiceWorker] Cached app shell');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Custom ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('[Custom ServiceWorker] Removing old cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Custom ServiceWorker] Claiming clients');
      // Take control of all clients ASAP
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  console.log('[Custom ServiceWorker] Fetch', event.request.url);
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('[Custom ServiceWorker] Cache hit for', event.request.url);
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a one-time use stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              console.log('[Custom ServiceWorker] Caching new resource:', event.request.url);
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
  );
});

// Message event handler
self.addEventListener('message', event => {
  console.log('[Custom ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Custom ServiceWorker] Skip waiting message received');
    self.skipWaiting();
  }
});

// Push notification event handler
self.addEventListener('push', event => {
  console.log('[Custom ServiceWorker] Push received:', event);
  
  const title = 'Redux Todo App';
  const options = {
    body: event.data ? event.data.text() : 'New content available!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', event => {
  console.log('[Custom ServiceWorker] Notification click:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[Custom ServiceWorker] Loaded successfully');
