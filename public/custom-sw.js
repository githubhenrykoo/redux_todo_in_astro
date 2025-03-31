// This is a custom service worker implementation

const CACHE_NAME = 'redux-todo-app-v2';
const SW_VERSION = '2'; // Service worker version - increment when making changes
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
  
  // Handle API endpoint redirections for removed endpoints
  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.startsWith('/api/');
  
  // Redirect deprecated API endpoints to the new card-collection endpoint
  if (isApiRequest) {
    // Map of old endpoints to new endpoints with appropriate actions
    const apiRedirectMap = {
      '/api/store-card': { path: '/api/card-collection', action: 'add' },
      '/api/update-card': { path: '/api/card-collection', action: 'add' },
      '/api/get-card': { path: '/api/card-collection', action: 'get' },
      '/api/store-clm': { path: '/api/card-collection', action: 'add' },
      '/api/update-clm': { path: '/api/card-collection', action: 'add' },
      '/api/submit': { path: '/api/card-collection', action: 'add' }
    };
    
    if (apiRedirectMap[url.pathname]) {
      const newEndpoint = apiRedirectMap[url.pathname];
      console.log(`[Custom ServiceWorker] Redirecting ${url.pathname} to ${newEndpoint.path} with action=${newEndpoint.action}`);
      
      // Create a new request with the redirected URL
      const redirectedUrl = new URL(newEndpoint.path, self.location.origin);
      
      // For GET requests, add action parameter to query string
      if (event.request.method === 'GET') {
        redirectedUrl.searchParams.append('action', newEndpoint.action);
        // Copy any existing query parameters
        for (const [key, value] of url.searchParams.entries()) {
          if (key !== 'action') { // Don't duplicate action parameter
            redirectedUrl.searchParams.append(key, value);
          }
        }
        
        const redirectedRequest = new Request(redirectedUrl.toString(), {
          method: event.request.method,
          headers: event.request.headers,
          mode: event.request.mode,
          credentials: event.request.credentials,
          redirect: event.request.redirect
        });
        
        event.respondWith(fetch(redirectedRequest));
        return;
      }
      
      // For POST requests, need to modify the request body to include action
      if (event.request.method === 'POST') {
        event.respondWith(
          event.request.clone().json()
            .then(body => {
              // Create a new body with the action field
              const newBody = {
                ...body,
                action: newEndpoint.action
              };
              
              // Create a new request with the modified body
              const redirectedRequest = new Request(redirectedUrl.toString(), {
                method: event.request.method,
                headers: event.request.headers,
                body: JSON.stringify(newBody),
                mode: event.request.mode,
                credentials: event.request.credentials,
                redirect: event.request.redirect
              });
              
              return fetch(redirectedRequest);
            })
            .catch(error => {
              console.error('[Custom ServiceWorker] Error redirecting API request:', error);
              // If we can't process the body, just pass through to the network
              return fetch(event.request);
            })
        );
        return;
      }
    }
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
  
  if (event.data && event.data.type === 'VERSION_CHECK') {
    console.log('[Custom ServiceWorker] Version check message received');
    event.ports[0].postMessage({ version: SW_VERSION });
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
