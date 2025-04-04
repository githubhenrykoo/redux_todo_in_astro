import React, { useState, useEffect, useRef } from 'react';

const CameraPanel = () => {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const mediaStreamRef = useRef(null);

  const requestCameraPermission = async () => {
    setCameraPermission('requesting');
    setError(null);
    
    try {
      // First request basic camera access without enumerating devices
      const initialStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // Once we have permission, enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Stop the initial stream as we'll create a new one with the selected camera
      initialStream.getTracks().forEach(track => track.stop());
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices were detected on this device');
      }
      
      setAvailableCameras(videoDevices);
      
      // Use the first camera by default
      const defaultCameraId = videoDevices[0].deviceId;
      setSelectedCameraId(defaultCameraId);

      // Start the camera with the selected device
      await startCamera(defaultCameraId);
      setCameraPermission('granted');
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      // Provide more helpful error messages
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera was detected on this device. Please check if your camera is properly connected.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Your camera is being used by another application. Please close other applications that might be using your camera.');
      } else {
        setError(err.message || 'Could not access camera. Please ensure your device has a working camera.');
      }
      
      setCameraPermission('denied');
    }
  };

  const startCamera = async (deviceId) => {
    try {
      // Stop any existing streams
      if (mediaStreamRef.current) {
        stopCamera();
      }

      // Get user media with selected camera
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      };
      
      console.log('Starting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => {
            console.error('Error playing video:', e);
          });
        };
      }
      
      setIsStreaming(true);
      setError(null);
    } catch (err) {
      console.error('Error starting camera:', err);
      setError(err.message || 'Could not start camera');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
  };

  const toggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else if (selectedCameraId) {
      startCamera(selectedCameraId);
    } else {
      requestCameraPermission();
    }
  };

  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    if (isStreaming) {
      startCamera(newCameraId);
    }
  };

  // Request camera permission when component mounts
  useEffect(() => {
    // Wait for a moment before requesting camera permission to ensure DOM is ready
    const timer = setTimeout(() => {
      if (cameraPermission === 'pending' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
        console.log('Requesting camera permission...');
        requestCameraPermission();
      }
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, []);

  // Detect browser camera support on mount
  useEffect(() => {
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support camera access. Please try using a modern browser like Chrome, Firefox, or Safari.');
      setCameraPermission('denied');
    }
  }, []);

  // Take a photo function
  const takePhoto = () => {
    if (!videoRef.current || !isStreaming) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    // Convert canvas to image data URL
    try {
      const imgData = canvas.toDataURL('image/png');
      
      // Create a download link
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `camera-snapshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error saving photo:', e);
      setError('Could not save photo. This might be due to security restrictions.');
    }
  };

  // Force request permission button
  const requestPermissionManually = () => {
    console.log('Manually requesting camera permission...');
    setCameraPermission('pending');
    requestCameraPermission();
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-white font-semibold">Camera Panel</h2>
        <div className="flex gap-2">
          {availableCameras.length > 1 && (
            <select 
              className="bg-gray-700 text-white px-3 py-1 rounded-md"
              value={selectedCameraId || ''}
              onChange={handleCameraChange}
              disabled={!isStreaming}
            >
              {availableCameras.map(camera => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          )}
          <button 
            onClick={toggleCamera}
            className={`px-4 py-1 rounded-md transition-colors ${
              isStreaming 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white font-medium`}
          >
            {isStreaming ? 'Stop Camera' : 'Start Camera'}
          </button>
          {isStreaming && (
            <button 
              onClick={takePhoto}
              className="px-4 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Take Photo
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {cameraPermission === 'pending' && (
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
            <p>Initializing camera...</p>
          </div>
        )}
        
        {cameraPermission === 'requesting' && (
          <div className="text-white text-center">
            <div className="animate-pulse mb-4">
              <div className="text-xl mb-2">📷 Camera Permission Required</div>
              <p>Please allow access to your camera when prompted by your browser.</p>
              <p className="text-sm text-gray-400 mt-2">If you don't see a prompt, check your browser's address bar or settings.</p>
            </div>
          </div>
        )}
        
        {cameraPermission === 'denied' && (
          <div className="text-white text-center p-4 max-w-md">
            <p className="text-xl mb-2">❌ Camera access denied</p>
            <p className="mb-4">{error || 'Please allow camera access in your browser settings.'}</p>
            <button 
              onClick={requestPermissionManually}
              className="mt-4 px-6 py-2 bg-blue-600 rounded-md hover:bg-blue-700 font-medium"
            >
              Try Again
            </button>
            <div className="mt-6 text-sm text-gray-400 border border-gray-700 p-3 rounded">
              <p className="font-medium mb-1">How to enable camera access:</p>
              <ol className="list-decimal list-inside text-left">
                <li>Click the padlock/info icon in your browser's address bar</li>
                <li>Find "Camera" in the site permissions</li>
                <li>Change the setting to "Allow"</li>
                <li>Refresh the page and click "Try Again"</li>
              </ol>
            </div>
          </div>
        )}
        
        <video 
          ref={videoRef}
          className={`max-h-full max-w-full ${isStreaming ? 'opacity-100' : 'opacity-0'}`}
          autoPlay 
          playsInline 
          muted
        />
        
        {error && isStreaming && (
          <div className="absolute bottom-4 left-0 right-0 bg-red-600 text-white p-2 mx-4 rounded-md">
            {error}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-gray-300 text-sm">
        <p>Note: Camera access requires permission from your browser.</p>
      </div>
    </div>
  );
};

export default CameraPanel;
