import React, { useState, useEffect } from 'react';

const InstallPwa = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if on iOS
    const checkIos = () => {
      const ua = window.navigator.userAgent;
      const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
      const webkit = !!ua.match(/WebKit/i);
      const iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/OPiOS/i) && !ua.match(/FxiOS/i);
      
      setIsIos(iOSSafari);
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPrompt(e);
      // Show the install button
      setShowInstallButton(true);
      
      console.log('BeforeInstallPrompt event fired and captured');
    };

    // Check if already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        console.log('App is already installed');
        setShowInstallButton(false);
      }
    };

    checkIos();
    checkIfInstalled();

    // Add event listener for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Clean up
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle install button click
  const handleInstallClick = async () => {
    if (!installPrompt) {
      console.log('No installation prompt available');
      return;
    }

    // Show the prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We no longer need the prompt, clear it
    setInstallPrompt(null);
    setShowInstallButton(false);
  };

  // If running in standalone mode or no install prompt, don't show anything
  if (!showInstallButton && !isIos) {
    return null;
  }

  return (
    <div className="install-pwa-prompt">
      <div className="install-pwa-content">
        <div className="install-pwa-header">
          <img 
            src="/pwa-192x192.png" 
            alt="App Icon" 
            className="install-pwa-icon" 
          />
          <div className="install-pwa-text">
            <h3>Install Redux Todo App</h3>
            <p>Get quick access and work offline</p>
          </div>
        </div>
        
        {isIos ? (
          <div className="ios-instructions">
            <p>To install this app on your iOS device:</p>
            <ol>
              <li>Tap the share icon <span className="share-icon">⎅</span> at the bottom of the screen</li>
              <li>Scroll and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top right</li>
            </ol>
          </div>
        ) : (
          <button onClick={handleInstallClick} className="install-button">
            Install App
          </button>
        )}
        
        <button 
          onClick={() => setShowInstallButton(false)} 
          className="dismiss-button"
        >
          Not now
        </button>
      </div>
      
      <style jsx>{`
        .install-pwa-prompt {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 16px;
          max-width: 350px;
          z-index: 1000;
        }
        
        .install-pwa-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .install-pwa-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .install-pwa-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
        }
        
        .install-pwa-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .install-pwa-text p {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #666;
        }
        
        .ios-instructions {
          font-size: 14px;
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
        }
        
        .ios-instructions ol {
          margin: 8px 0 0 20px;
          padding: 0;
        }
        
        .share-icon {
          font-size: 18px;
        }
        
        .install-button {
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .dismiss-button {
          background-color: transparent;
          border: none;
          color: #666;
          padding: 8px;
          cursor: pointer;
          align-self: center;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default InstallPwa;
