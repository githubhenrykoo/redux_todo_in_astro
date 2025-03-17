// src/pwa.js
// Enhanced PWA initialization and management

console.log('PWA initialization');

// NetworkStatus monitor to handle online/offline events
class NetworkStatusMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    
    // Set up event listeners for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Initial status check
    this.checkNetworkStatus();
  }
  
  handleOnline() {
    console.log('App is online');
    this.isOnline = true;
    
    // Display notification
    this.showNotification('You are back online!', 'success');
    
    // Attempt to sync any pending data
    if (this.syncPendingData) {
      this.syncPendingData();
    }
  }
  
  handleOffline() {
    console.log('App is offline');
    this.isOnline = false;
    
    // Display notification
    this.showNotification('You are offline. Some features may be limited.', 'warning');
  }
  
  checkNetworkStatus() {
    this.isOnline = navigator.onLine;
    console.log(`Initial network status: ${this.isOnline ? 'online' : 'offline'}`);
    
    // If offline on page load, show notification
    if (!this.isOnline) {
      this.showNotification('You are offline. Some features may be limited.', 'warning');
    }
  }
  
  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `pwa-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      backgroundColor: type === 'success' ? '#4CAF50' : '#FF9800',
      color: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: '9999',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });
    
    // Add to document
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 10);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }
  
  // Method to register sync function
  registerSyncFunction(syncFunction) {
    this.syncPendingData = syncFunction;
  }
}

// Service Worker Management
class PWAManager {
  constructor() {
    this.registerServiceWorker();
  }
  
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        if (registration.installing) {
          console.log('Service worker installing');
        } else if (registration.waiting) {
          console.log('Service worker installed');
        } else if (registration.active) {
          console.log('Service worker active');
        }
        
        // Set up update checking
        this.setupPeriodicSync(registration);
        
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }
  }
  
  setupPeriodicSync(registration) {
    // Check for updates every hour
    setInterval(() => {
      registration.update();
      console.log('Checking for service worker updates...');
    }, 60 * 60 * 1000);
    
    // Handle new updates
    registration.addEventListener('updatefound', () => {
      // New service worker is being installed
      const newWorker = registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version is installed but not active yet
          // Dispatch custom event that our React components can listen for
          const updateEvent = new Event('updatefound');
          window.dispatchEvent(updateEvent);
        }
      });
    });
  }
}

// Initialize the PWA components
if (typeof window !== 'undefined') {
  // Start network status monitoring
  const networkMonitor = new NetworkStatusMonitor();
  
  // Register service worker
  const pwaManager = new PWAManager();
  
  // Make them available globally
  window.networkMonitor = networkMonitor;
  window.pwaManager = pwaManager;
}
