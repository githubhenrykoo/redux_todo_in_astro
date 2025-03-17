// Manual Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Listen for new worker activation
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          if (!refreshing) {
            console.log('New service worker activated, reloading page for fresh content...');
            refreshing = true;
            window.location.reload();
          }
        });
        
        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('New content is available; please refresh.');
            // Here you could show a notification to the user
          }
        });
      })
      .catch(function(error) {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}
