import React, { useState, useEffect } from 'react';

/**
 * Component that shows a notification when a new version of the app is available
 * and provides a button to reload and update to the latest version.
 */
const PwaUpdater = () => {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Monitor service worker updates rather than registering a new one
  useEffect(() => {
    // Set mounted flag to ensure client-side rendering
    setIsMounted(true);

    // Only run in browser context
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const monitorSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Check for existing registrations
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length > 0) {
            console.log('Found existing service worker registration');
            const registration = registrations[0];
            setSwRegistration(registration);
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('Service Worker update found!');
              
              newWorker.addEventListener('statechange', () => {
                console.log('Service worker state:', newWorker.state);
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New content is available!');
                  setNeedsRefresh(true);
                }
              });
            });
            
            // Set up automatic checks for updates
            const checkForUpdates = () => {
              if (registration.update) {
                console.log('Checking for service worker updates...');
                registration.update().catch(err => {
                  console.error('Error checking for service worker updates:', err);
                });
              }
            };
            
            // Check for updates immediately and then every hour
            checkForUpdates();
            const updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);
            
            return () => {
              clearInterval(updateInterval);
            };
          } else {
            console.log('No existing service worker registration found');
          }
        } catch (error) {
          console.error('Error monitoring service worker:', error);
        }
      } else {
        console.warn('Service workers not supported in this browser');
      }
    };
    
    monitorSW();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Don't render anything during SSR
  if (!isMounted) {
    return null;
  }

  // Handler for the refresh button
  const handleRefresh = () => {
    if (swRegistration && swRegistration.waiting) {
      // Send message to waiting service worker to skip waiting and become active
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback to regular page refresh
      window.location.reload();
    }
    setNeedsRefresh(false);
  };

  return (
    <>
      {needsRefresh && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            right: '24px',
            padding: '16px',
            borderRadius: '4px',
            backgroundColor: '#2563eb',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <p style={{ margin: 0 }}>New version available! Update to get the latest features.</p>
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: 'white',
              color: '#2563eb',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      )}
    </>
  );
};

export default PwaUpdater;
