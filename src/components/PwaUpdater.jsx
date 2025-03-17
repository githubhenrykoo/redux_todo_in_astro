// src/components/PwaUpdater.jsx
import React, { useState, useEffect } from 'react';

/**
 * Component that shows a notification when a new version of the app is available
 * and provides a button to reload and update to the latest version.
 */
const PwaUpdater = () => {
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Listen for the controllerchange event on the navigator.serviceWorker
      // This event fires when a new service worker has taken control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // If we have a new service worker, we need to refresh
        if (needsRefresh === false) {
          setNeedsRefresh(true);
        }
      });

      // Listen for the custom updatefound event from the PWA plugin
      window.addEventListener('updatefound', () => {
        setNeedsRefresh(true);
      });
    }
  }, [needsRefresh]);

  const handleUpdate = () => {
    setNeedsRefresh(false);
    // Reload the page to apply the update
    window.location.reload();
  };

  if (!needsRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-between">
        <p className="font-medium">A new version of this app is available!</p>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
        >
          Update Now
        </button>
      </div>
    </div>
  );
};

export default PwaUpdater;
