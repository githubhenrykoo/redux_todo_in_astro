// AudioViewer.jsx - Component for displaying audio files (WAV, MP3, etc.)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './VideoViewer.css'; // Reuse the same styling as VideoViewer

const AudioViewer = ({ content, contentType }) => {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [failedToLoad, setFailedToLoad] = useState(false);

  // Function to create download link
  const createDownloadLink = (blobData, extension = 'wav') => {
    try {
      const mimeType = contentType?.mimeType || 'audio/wav';
      const blob = new Blob([blobData], { type: mimeType });
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
        console.log("AudioViewer: Processing audio content", typeof content);
        
        // Handle Buffer JSON format
        if (typeof content === 'object' && content !== null && 
            content.type === 'Buffer' && Array.isArray(content.data)) {
          console.log("AudioViewer: Converting Buffer data to audio URL");
          
          // Convert buffer data to a data URL
          const array = new Uint8Array(content.data);
          
          // Create the download URL regardless of player support
          blobUrl = createDownloadLink(array);
          
          // Use explicit audio MIME type for the player
          const mimeType = contentType?.mimeType || 'audio/wav';
          const blob = new Blob([array], { type: mimeType });
          const url = URL.createObjectURL(blob);
          setSrc(url);
        }
        // Handle base64 string
        else if (typeof content === 'string' && content.startsWith('data:')) {
          console.log("AudioViewer: Using data URL");
          setSrc(content);
          setDownloadUrl(content);
        }
        // Handle raw string (probably a URL)
        else if (typeof content === 'string') {
          console.log("AudioViewer: Using string URL");
          setSrc(content);
          setDownloadUrl(content);
        }
        else {
          console.error("AudioViewer: Unsupported content format", typeof content);
          setError('Unsupported audio content format');
        }
      }
    } catch (err) {
      console.error('AudioViewer: Error preparing audio for display:', err);
      setError(`Error loading audio: ${err.message}`);
    }
    
    // Cleanup function to revoke object URLs
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
    };
  }, [content, contentType]);

  // Handle audio loading errors
  const handleError = (e) => {
    console.error("Audio failed to load:", e);
    setFailedToLoad(true);
    setError("This audio file could not be played in the browser. It may be blocked by your browser settings or extensions, or the format may not be supported.");
  };

  if (error || failedToLoad) {
    return (
      <div className="video-error">
        <p className="text-red-500 font-medium">{error || "Audio playback error"}</p>
        <p className="text-sm mt-2">Some audio formats require specific codecs which may not be available in all browsers.</p>
        {downloadUrl && (
          <div className="mt-4">
            <a 
              href={downloadUrl} 
              download={`audio-${Date.now()}.${contentType?.extension || 'wav'}`}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
            >
              Download Audio File
            </a>
            <p className="text-xs mt-2">You can download the file and play it in a media player that supports this format.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="audio-viewer-container">
      {src ? (
        <>
          <audio 
            className="audio-element" 
            controls
            autoPlay={false}
            src={src}
            onError={handleError}
          >
            <p>Your browser does not support audio playback.</p>
            <p>Try downloading the file and playing it in a dedicated media player.</p>
          </audio>
          
          {downloadUrl && (
            <div className="download-button-container">
              <a 
                href={downloadUrl} 
                download={`audio-${Date.now()}.${contentType?.extension || 'wav'}`}
                className="download-button"
                title="Download audio file"
              >
                ⬇️
              </a>
            </div>
          )}
        </>
      ) : (
        <div className="video-loading">Loading audio...</div>
      )}
    </div>
  );
};

AudioViewer.propTypes = {
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object, // For Buffer format
  ]).isRequired,
  contentType: PropTypes.shape({
    mimeType: PropTypes.string,
    extension: PropTypes.string
  })
};

export default AudioViewer;
