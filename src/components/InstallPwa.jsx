// src/components/InstallPwa.jsx
import React, { useState, useEffect } from 'react';

/**
 * Component that shows an installation prompt for the PWA
 * when the app can be installed on the device.
 */
const InstallPwa = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Store the beforeinstallprompt event so it can be triggered later
    const handleBeforeInstallPrompt = (event) => {
      // Prevent the default browser install prompt
      event.preventDefault();
      // Store the event for later use
      setInstallPrompt(event);
      // Show our custom install banner
      setShowInstallBanner(true);
    };

    // Add event listener for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Add event listener for the appinstalled event
    window.addEventListener('appinstalled', () => {
      // Hide the install banner after the app is installed
      setShowInstallBanner(false);
      setInstallPrompt(null);
      // Log the installation to analytics
      console.log('PWA was installed');
    });

    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {
        setShowInstallBanner(false);
      });
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the browser's install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    // Optionally, send analytics about the outcome
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
    setShowInstallBanner(false);
  };

  // Don't show anything if there's no install prompt available
  if (!showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg z-50 mb-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Install this app on your device</p>
          <p className="text-sm text-gray-600">For easier access and offline use</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowInstallBanner(false)}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Not now
          </button>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPwa;
