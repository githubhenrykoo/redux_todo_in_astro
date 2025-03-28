// Improved Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async function() {
    console.log('Attempting to register service worker...');
    
    // First unregister any existing service workers to ensure clean state
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('Unregistering previous service worker');
        await registration.unregister();
      }
      console.log('All previous service workers unregistered');
    } catch (err) {
      console.warn('Error unregistering existing service workers:', err);
    }
    
    // Now register the service worker
    const registerServiceWorker = async () => {
      try {
        // First try the Workbox-generated service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Prevent caching issues
        });
        
        console.log('ServiceWorker registration successful with scope:', registration.scope);
        
        // Force update check
        registration.update();
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New service worker is being installed');
          
          newWorker.addEventListener('statechange', () => {
            console.log('Service worker state changed:', newWorker.state);
          });
        });
        
        // Handle messages from service worker
        navigator.serviceWorker.addEventListener('message', function(event) {
          console.log('Message from service worker:', event.data);
        });
        
        // Set up refresh on controller change
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          if (!refreshing) {
            console.log('New service worker activated, reloading page for fresh content...');
            refreshing = true;
            window.location.reload();
          }
        });
        
        return registration;
      } catch (err) {
        console.error('Service worker registration failed:', err);
        
        // Try to fallback to custom service worker
        try {
          console.log('Attempting to register custom service worker...');
          const registration = await navigator.serviceWorker.register('/custom-sw.js', {
            scope: '/'
          });
          console.log('Custom service worker registration successful with scope:', registration.scope);
          return registration;
        } catch (fallbackErr) {
          console.error('All service worker registration attempts failed:', fallbackErr);
          throw fallbackErr;
        }
      }
    };
    
    try {
      await registerServiceWorker();
      console.log('Service worker registration complete');
    } catch (err) {
      console.error('Service worker registration process failed:', err);
    }
  });
} else {
  console.warn('Service workers are not supported by this browser');
}
