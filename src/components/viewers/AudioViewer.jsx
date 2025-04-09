// AudioViewer.jsx - Component for displaying audio files (WAV, MP3, etc.)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './VideoViewer.css'; // Reuse the same styling as VideoViewer

// Helper function to determine appropriate MIME type
const getAudioMimeType = (contentType) => {
  if (!contentType) return 'audio/mpeg'; // Default to MP3 as fallback
  
  // Handle direct MIME type
  if (typeof contentType === 'string') {
    if (contentType.includes('audio/')) return contentType;
    
    // Handle extension-based detection
    const extensionMap = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'm4a': 'audio/m4a',
      'aac': 'audio/aac'
    };
    
    for (const [ext, mime] of Object.entries(extensionMap)) {
      if (contentType.toLowerCase().includes(ext)) {
        return mime;
      }
    }
  }
  
  // Handle object-based contentType with mimeType property
  if (contentType.mimeType && contentType.mimeType.includes('audio/')) {
    return contentType.mimeType;
  }
  
  // Handle object-based contentType with extension property
  if (contentType.extension) {
    const ext = contentType.extension.toLowerCase();
    switch (ext) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'ogg': return 'audio/ogg';
      case 'flac': return 'audio/flac';
      case 'm4a': return 'audio/m4a';
      case 'aac': return 'audio/aac';
      default: return 'audio/mpeg';
    }
  }
  
  return 'audio/mpeg'; // Default fallback
};

const AudioViewer = ({ content, contentType }) => {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [failedToLoad, setFailedToLoad] = useState(false);
  const [audioType, setAudioType] = useState('');
  const [extension, setExtension] = useState('mp3');

  // Function to create download link
  const createDownloadLink = (blobData) => {
    try {
      // Detect MIME type for audio content
      const mimeType = getAudioMimeType(contentType);
      setAudioType(mimeType);
      
      // Set file extension based on MIME type
      const extMap = {
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/wave': 'wav',
        'audio/x-wav': 'wav',
        'audio/flac': 'flac',
        'audio/ogg': 'ogg',
        'audio/m4a': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/mp4': 'm4a',
        'audio/aac': 'aac',
        'audio/x-aac': 'aac'
      };
      
      const fileExt = extMap[mimeType] || 
                     (contentType?.extension ? contentType.extension.toLowerCase() : 'mp3');
      setExtension(fileExt);
      
      // Create the Blob and URL
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
        
        // Set audio type from contentType
        const detectedType = getAudioMimeType(contentType);
        setAudioType(detectedType);
        
        // Handle Buffer JSON format
        if (typeof content === 'object' && content !== null && 
            content.type === 'Buffer' && Array.isArray(content.data)) {
          console.log("AudioViewer: Converting Buffer data to audio URL");
          
          // Convert buffer data to a data URL
          const array = new Uint8Array(content.data);
          
          // Create the download URL regardless of player support
          blobUrl = createDownloadLink(array);
          
          // Use explicit audio MIME type for the player
          const blob = new Blob([array], { type: detectedType });
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
    
    // Provide more specific error messages based on audio type
    const format = extension.toUpperCase();
    setError(`This ${format} audio file could not be played in the browser. It may be blocked by your browser settings or extensions, or the format may not be supported.`);
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
              download={`audio-${Date.now()}.${extension}`}
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
                download={`audio-${Date.now()}.${extension}`}
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
