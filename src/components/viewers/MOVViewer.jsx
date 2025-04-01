// MOVViewer.jsx - Specialized component for displaying MOV/QuickTime files
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './VideoViewer.css'; // Reuse the same styling as VideoViewer

const MOVViewer = ({ content, contentType }) => {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [failedToLoad, setFailedToLoad] = useState(false);
  const videoRef = useRef(null);

  // Function to create download link
  const createDownloadLink = (blobData, extension = 'mov') => {
    try {
      const blob = new Blob([blobData], { type: 'video/quicktime' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      return url;
    } catch (err) {
      console.error('Error creating download link:', err);
      return null;
    }
  };

  useEffect(() => {
    let blobUrl = null;
    
    try {
      if (content) {
        console.log("MOVViewer: Processing QuickTime content", typeof content);
        
        // Handle Buffer JSON format
        if (typeof content === 'object' && content !== null && 
            content.type === 'Buffer' && Array.isArray(content.data)) {
          console.log("MOVViewer: Converting Buffer data to video URL");
          
          // Convert buffer data to a data URL
          const array = new Uint8Array(content.data);
          
          // Create the download URL regardless of player support
          blobUrl = createDownloadLink(array);
          
          // Use explicit QuickTime MIME type for the player
          const blob = new Blob([array], { type: 'video/quicktime' });
          const url = URL.createObjectURL(blob);
          setSrc(url);
        }
        // Handle base64 string
        else if (typeof content === 'string' && content.startsWith('data:')) {
          console.log("MOVViewer: Using data URL");
          setSrc(content);
          setDownloadUrl(content);
        }
        // Handle raw string (probably a URL)
        else if (typeof content === 'string') {
          console.log("MOVViewer: Using string URL");
          setSrc(content);
          setDownloadUrl(content);
        }
        else {
          console.error("MOVViewer: Unsupported content format", typeof content);
          setError('Unsupported MOV content format');
        }
      }
    } catch (err) {
      console.error('MOVViewer: Error preparing video for display:', err);
      setError(`Error loading QuickTime video: ${err.message}`);
    }
    
    // Cleanup function to revoke object URLs
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
    };
  }, [content, contentType]);

  // Handle video loading errors
  const handleError = (e) => {
    console.error("Video failed to load:", e);
    setFailedToLoad(true);
    setError("This video could not be played in the browser. It may be blocked by your browser settings or extensions, or the format may not be supported.");
  };

  if (error || failedToLoad) {
    return (
      <div className="video-error">
        <p className="text-red-500 font-medium">{error || "Video playback error"}</p>
        <p className="text-sm mt-2">QuickTime/MOV files require specific codecs which may not be available in all browsers.</p>
        {downloadUrl && (
          <div className="mt-4">
            <a 
              href={downloadUrl} 
              download={`video-${Date.now()}.mov`}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
            >
              Download Video File
            </a>
            <p className="text-xs mt-2">You can download the file and play it in a media player that supports MOV format.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="video-viewer-container">
      {src ? (
        <>
          <video 
            ref={videoRef}
            className="video-element" 
            controls
            autoPlay={false}
            src={src}
            type="video/quicktime"
            onError={handleError}
          >
            <p>Your browser does not support QuickTime/MOV video playback.</p>
            <p>Try downloading the file and playing it in a dedicated media player.</p>
          </video>
          
          {downloadUrl && (
            <div className="download-button-container">
              <a 
                href={downloadUrl} 
                download={`video-${Date.now()}.mov`}
                className="download-button"
                title="Download video file"
              >
                ⬇️
              </a>
            </div>
          )}
        </>
      ) : (
        <div className="video-loading">Loading QuickTime video...</div>
      )}
    </div>
  );
};

MOVViewer.propTypes = {
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object, // For Buffer format
  ]).isRequired,
  contentType: PropTypes.shape({
    mimeType: PropTypes.string,
    extension: PropTypes.string
  })
};

export default MOVViewer;
