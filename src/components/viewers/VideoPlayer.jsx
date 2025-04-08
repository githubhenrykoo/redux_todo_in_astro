import React, { useState, useEffect, useRef } from 'react';
import { ContentService } from '../../services/content-service';

/**
 * VideoPlayer component for handling various video formats including QuickTime
 * Uses our content service to properly process binary video data
 */
const VideoPlayer = ({ content, contentType, hash }) => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isQuickTime, setIsQuickTime] = useState(false);
  const videoRef = useRef(null);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    
    if (!content && !hash) {
      setError('No video content or hash provided');
      setLoading(false);
      return;
    }
    
    const loadVideo = async () => {
      try {
        // If we already have content, process it directly
        if (content) {
          processVideoContent(content);
        } 
        // Otherwise, fetch content using the hash
        else if (hash) {
          const result = await ContentService.fetchContent(hash);
          if (result.error) {
            throw new Error(result.error);
          }
          
          if (result.raw?.content) {
            processVideoContent(result.raw.content, result.raw.contentType || contentType);
          } else {
            throw new Error('No video content found in response');
          }
        }
      } catch (err) {
        console.error('Error loading video:', err);
        setError(`Failed to load video: ${err.message}`);
        setLoading(false);
      }
    };
    
    const processVideoContent = (videoContent, vidContentType = contentType) => {
      // Check if this is a QuickTime video
      const isQuickTimeVideo = 
        (vidContentType?.mimeType?.includes('quicktime') || 
         vidContentType?.extension?.toLowerCase() === 'mov' ||
         (typeof vidContentType === 'string' && (
           vidContentType.includes('quicktime') || 
           vidContentType.includes('mov')
         )));
      
      setIsQuickTime(isQuickTimeVideo);
      
      // For Buffer JSON content
      if (videoContent && videoContent.type === 'Buffer' && Array.isArray(videoContent.data)) {
        try {
          const array = new Uint8Array(videoContent.data);
          
          // Always create download URL for QuickTime videos as a fallback
          if (isQuickTimeVideo) {
            const blob = new Blob([array], { type: 'video/quicktime' });
            const downloadUrl = URL.createObjectURL(blob);
            setDownloadUrl(downloadUrl);
          }
          
          const url = ContentService.getDataUrl({ 
            content: videoContent, 
            contentType: vidContentType 
          });
          
          if (url) {
            setVideoUrl(url);
            setLoading(false);
          } else {
            throw new Error('Failed to create data URL for video');
          }
        } catch (err) {
          console.error('Error processing video buffer:', err);
          setError('Unable to process video data');
          setLoading(false);
        }
      }
      // For already processed content
      else if (videoContent && typeof videoContent === 'string' && 
              (videoContent.startsWith('data:') || videoContent.startsWith('blob:'))) {
        setVideoUrl(videoContent);
        setDownloadUrl(videoContent);
        setLoading(false);
      } 
      // For unknown content format
      else {
        console.error('Unsupported video content format:', typeof videoContent);
        setError('Unsupported video format');
        setLoading(false);
      }
    };
    
    loadVideo();
    
    // Cleanup function
    return () => {
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
      if (downloadUrl && downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [content, contentType, hash, retry]);
  
  // Handle video playback errors
  const handleVideoError = (e) => {
    console.error('Video playback error:', e);
    
    if (isQuickTime) {
      setError('This QuickTime video could not be played in the browser. The format may not be supported by your browser.');
    } else {
      setError('Error playing video. The format may not be supported by your browser.');
    }
  };
  
  if (loading) {
    return (
      <div className="video-loading">
        <div className="spinner"></div>
        <p>Loading video...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="video-error">
        <p>{error}</p>
        {isQuickTime && downloadUrl && (
          <div className="mt-4">
            <p className="text-sm mt-2">QuickTime videos require specific codecs which may not be available in all browsers.</p>
            <a 
              href={downloadUrl} 
              download={`video-${Date.now()}.mov`}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block mt-2"
            >
              Download Video File
            </a>
            <p className="text-xs mt-2">You can download the file and play it in a media player that supports QuickTime format.</p>
          </div>
        )}
        <button 
          className="btn btn-small mt-3" 
          onClick={() => setRetry(prev => prev + 1)}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="video-container">
      <video 
        ref={videoRef}
        src={videoUrl}
        controls
        autoPlay={false}
        className="video-player"
        onError={handleVideoError}
      >
        Your browser does not support the video tag.
      </video>
      
      {isQuickTime && downloadUrl && (
        <div className="download-button-container mt-2">
          <a 
            href={downloadUrl} 
            download={`video-${Date.now()}.mov`}
            className="download-button"
            title="Download video file"
          >
            ⬇️ Download
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
