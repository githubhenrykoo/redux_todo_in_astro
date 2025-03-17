import React, { useState, useEffect } from 'react';

/**
 * Component that shows a notification when a new version of the app is available
 * and provides a button to reload and update to the latest version.
 */
const PwaUpdater = () => {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // Register service worker
  useEffect(() => {
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Try to register the service worker
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('Service Worker registered with scope:', registration.scope);
          setSwRegistration(registration);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('Service Worker update found!');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content is available, please refresh.');
                setNeedsRefresh(true);
              }
            });
          });
          
          // Set up automatic checks for updates
          const checkForUpdates = () => {
            if (registration.update) {
              registration.update().catch(err => {
                console.error('Error checking for service worker updates:', err);
              });
            }
          };
          
          // Check for updates every hour
          const updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);
          
          return () => {
            clearInterval(updateInterval);
          };
          
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      } else {
        console.log('Service workers are not supported by this browser');
      }
    };
    
    registerSW();
  }, []);

  // Handle update click
  const handleUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      // Send message to service worker to skip waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Reload the page to apply the update
    window.location.reload();
  };

  if (!needsRefresh) {
    return null;
  }

  return (
    <div className="pwa-update-toast">
      <div className="pwa-update-toast-content">
        <p>A new version is available!</p>
        <button onClick={handleUpdate}>Update & Refresh</button>
        <button onClick={() => setNeedsRefresh(false)}>Dismiss</button>
      </div>
      <style jsx>{`
        .pwa-update-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          background-color: #fff;
          color: #333;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 300px;
        }
        .pwa-update-toast-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:first-of-type {
          background-color: #4f46e5;
          color: white;
        }
        button:last-of-type {
          background-color: transparent;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default PwaUpdater;
