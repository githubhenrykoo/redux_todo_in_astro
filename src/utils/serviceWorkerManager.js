/**
 * Service Worker Manager
 * 
 * Utility functions to manage service worker registration and updates
 * Helps ensure the service worker is up-to-date with the latest API endpoints
 */

// Force update any existing service worker
export async function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Get all service worker registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      // Unregister all existing service workers
      for (const registration of registrations) {
        console.log('[ServiceWorkerManager] Unregistering service worker:', registration.scope);
        await registration.unregister();
      }
      
      // Register the new service worker
      const newRegistration = await navigator.serviceWorker.register('/custom-sw.js');
      console.log('[ServiceWorkerManager] New service worker registered:', newRegistration);
      
      return true;
    } catch (error) {
      console.error('[ServiceWorkerManager] Error updating service worker:', error);
      return false;
    }
  }
  return false;
}

// Check if the service worker needs to be updated by comparing version
export async function checkServiceWorkerVersion() {
  if ('serviceWorker' in navigator) {
    try {
      // Try to communicate with the service worker to get its version
      const registration = await navigator.serviceWorker.ready;
      
      // If there's no controller, we need to wait for the service worker to activate
      if (!navigator.serviceWorker.controller) {
        console.log('[ServiceWorkerManager] No active service worker controller yet');
        return false;
      }
      
      // Create a promise that will resolve when the service worker responds
      const versionPromise = new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        
        // Set up the response handler
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'VERSION') {
            resolve(event.data.version);
          } else {
            resolve(null);
          }
        };
        
        // Send the message
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_VERSION'
        }, [messageChannel.port2]);
        
        // Set a timeout in case the service worker doesn't respond
        setTimeout(() => resolve(null), 1000);
      });
      
      const swVersion = await versionPromise;
      const currentVersion = '2'; // Update this when changing the service worker

      console.log('[ServiceWorkerManager] Service Worker Version:', swVersion, 'Current Version:', currentVersion);
      
      if (swVersion !== currentVersion) {
        console.log('[ServiceWorkerManager] Service worker needs update');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[ServiceWorkerManager] Error checking service worker version:', error);
      return true; // If we can't check, assume we need to update
    }
  }
  return false;
}

// Initialize the service worker manager
export async function initServiceWorkerManager() {
  const needsUpdate = await checkServiceWorkerVersion();
  
  if (needsUpdate) {
    console.log('[ServiceWorkerManager] Updating service worker...');
    return updateServiceWorker();
  }
  
  console.log('[ServiceWorkerManager] Service worker is up-to-date');
  return false;
}

// Make sure all API requests are using the unified endpoints
export function checkApiEndpoints() {
  const deprecatedEndpoints = [
    '/api/store-card',
    '/api/update-card',
    '/api/get-card',
    '/api/store-clm',
    '/api/update-clm',
    '/api/submit'
  ];
  
  // Check for any code still using deprecated endpoints
  window.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (deprecatedEndpoints.includes(url.pathname)) {
      console.warn(
        `[API Deprecation Warning] Detected use of deprecated API endpoint: ${url.pathname}\n` +
        `Please update to use the unified Card Collection API: /api/card-collection`
      );
    }
  }, { passive: true });
}
