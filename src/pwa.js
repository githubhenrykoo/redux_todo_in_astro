// src/pwa.js
// Enhanced PWA initialization and management

console.log('PWA initialization');

// NetworkStatus monitor to handle online/offline events
export class NetworkStatusMonitor {
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
    const notificationEl = document.createElement('div');
    notificationEl.className = `pwa-notification ${type}`;
    notificationEl.textContent = message;
    
    // Style notification
    Object.assign(notificationEl.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '4px',
      zIndex: 9999,
      color: 'white',
      backgroundColor: type === 'success' ? '#4caf50' : '#ff9800',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      transition: 'all 0.5s ease-in-out'
    });
    
    // Add to DOM
    document.body.appendChild(notificationEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notificationEl.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notificationEl);
      }, 500);
    }, 3000);
  }
}

// Service Worker Management
export class PWAManager {
  constructor() {
    this.monitorServiceWorker();
  }
  
  async monitorServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Check for existing registrations first
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        if (registrations.length > 0) {
          console.log('PWAManager: Found existing service worker registration');
          // Use the existing registration
          const registration = registrations[0];
          this.setupPeriodicSync(registration);
        } else {
          console.log('PWAManager: No existing service worker found, not registering a new one');
          // We'll rely on the sw-register.js script to handle registration
        }
      } catch (error) {
        console.error('PWAManager: Error while checking service worker registrations:', error);
      }
    }
  }
  
  setupPeriodicSync(registration) {
    // Check for updates every hour
    setInterval(() => {
      registration.update();
      console.log('PWAManager: Checking for service worker updates...');
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
export function initializePWA() {
  if (typeof window !== 'undefined') {
    // Start network status monitoring
    const networkMonitor = new NetworkStatusMonitor();
    
    // Initialize service worker monitoring (but not registration)
    const pwaManager = new PWAManager();
    
    return {
      networkMonitor,
      pwaManager
    };
  }
}

// Default export for easy importing
export default initializePWA;
