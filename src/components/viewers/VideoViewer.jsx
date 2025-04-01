// VideoViewer.jsx - Component for displaying video files
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './VideoViewer.css';

const VideoViewer = ({ content, contentType }) => {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (content) {
        // Handle Buffer JSON format
        if (typeof content === 'object' && content !== null && 
            content.type === 'Buffer' && Array.isArray(content.data)) {
          // Convert buffer data to a data URL
          const array = new Uint8Array(content.data);
          const blob = new Blob([array], { type: contentType?.mimeType || 'video/quicktime' });
          const url = URL.createObjectURL(blob);
          setSrc(url);
          
          // Clean up URL when component unmounts
          return () => URL.revokeObjectURL(url);
        }
        // Handle base64 string
        else if (typeof content === 'string' && content.startsWith('data:')) {
          setSrc(content);
        }
        // Handle raw string (probably a URL)
        else if (typeof content === 'string') {
          setSrc(content);
        }
        else {
          setError('Unsupported video content format');
        }
      }
    } catch (err) {
      console.error('Error preparing video for display:', err);
      setError(`Error loading video: ${err.message}`);
    }
  }, [content, contentType]);

  if (error) {
    return <div className="video-error">{error}</div>;
  }

  return (
    <div className="video-viewer-container">
      {src ? (
        <video 
          className="video-element" 
          controls
          autoPlay={false}
          src={src}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="video-loading">Loading video...</div>
      )}
    </div>
  );
};

VideoViewer.propTypes = {
  content: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object, // For Buffer format
  ]).isRequired,
  contentType: PropTypes.shape({
    mimeType: PropTypes.string,
    extension: PropTypes.string
  })
};

export default VideoViewer;
