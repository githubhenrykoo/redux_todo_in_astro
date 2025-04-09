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
      console.log('Processing video with content type:', vidContentType);
      
      // Check if filename suggests MP4 format regardless of content type
      let isMp4ByFilename = false;
      if (hash && hash.toLowerCase().includes('mp4')) {
        isMp4ByFilename = true;
        console.log('MP4 detected by filename reference in hash');
      }
      
      // Force MP4 detection for filenames explicitly containing MP4
      if (isMp4ByFilename) {
        setIsQuickTime(false);
        
        // For Buffer JSON content
        if (videoContent && videoContent.type === 'Buffer' && Array.isArray(videoContent.data)) {
          try {
            const array = new Uint8Array(videoContent.data);
            const blob = new Blob([array], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
            setDownloadUrl(url);
            setLoading(false);
            return;
          } catch (err) {
            console.error('Error processing MP4 video buffer:', err);
          }
        }
      }
      
      // Check if this is a QuickTime video
      const isQuickTimeVideo = 
        (vidContentType?.mimeType?.includes('quicktime') || 
         vidContentType?.extension?.toLowerCase() === 'mov' ||
         (typeof vidContentType === 'string' && (
           vidContentType.includes('quicktime') || 
           vidContentType.includes('mov')
         )));
      
      // Override for MP4 files incorrectly detected as QuickTime
      const isMp4Video = 
        (vidContentType?.mimeType?.includes('mp4') || 
         vidContentType?.extension?.toLowerCase() === 'mp4' ||
         (typeof vidContentType === 'string' && (
           vidContentType.includes('mp4')
         )));
      
      // Set QuickTime flag only if we're sure it's not an MP4
      setIsQuickTime(isQuickTimeVideo && !isMp4Video && !isMp4ByFilename);
      
      // For Buffer JSON content
      if (videoContent && videoContent.type === 'Buffer' && Array.isArray(videoContent.data)) {
        try {
          const array = new Uint8Array(videoContent.data);
          
          // Check for MP4 signatures
          let isMp4BySignature = false;
          if (array.length > 12) {
            // Check for ftyp box which indicates MP4 format
            for (let i = 0; i < Math.min(50, array.length - 8); i++) {
              if (array[i] === 0x66 && array[i+1] === 0x74 && array[i+2] === 0x79 && array[i+3] === 0x70) {
                console.log('MP4 signature detected in video data at position', i);
                isMp4BySignature = true;
                break;
              }
            }
          }
          
          // If we detected an MP4 signature, override QuickTime setting
          if (isMp4BySignature) {
            setIsQuickTime(false);
          }
          
          // Create the appropriate content type for the blob
          let blobType = 'video/mp4';
          if (isQuickTimeVideo && !isMp4BySignature && !isMp4Video && !isMp4ByFilename) {
            blobType = 'video/quicktime';
          }
          
          // Always create download URL for videos as a fallback
          const blob = new Blob([array], { type: blobType });
          const downloadUrl = URL.createObjectURL(blob);
          setDownloadUrl(downloadUrl);
          
          // Use MP4 content type if we have evidence it's an MP4
          if (isMp4BySignature || isMp4Video || isMp4ByFilename) {
            const mp4Blob = new Blob([array], { type: 'video/mp4' });
            const mp4Url = URL.createObjectURL(mp4Blob);
            setVideoUrl(mp4Url);
            setLoading(false);
            return;
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
  
  const getVideoExtension = (contentType) => {
    if (contentType?.extension) {
      return contentType.extension;
    } else if (contentType?.mimeType) {
      const mimeTypeParts = contentType.mimeType.split('/');
      if (mimeTypeParts.length > 1) {
        return mimeTypeParts[1];
      }
    }
    return 'mov';
  };
  
  return (
    <div className="video-player-container">
      {loading ? (
        <div className="video-loading">Loading video...</div>
      ) : error ? (
        <div className="video-error">
          <p>{error}</p>
          {downloadUrl && (
            <a href={downloadUrl} download className="download-link">
              Download Video
            </a>
          )}
        </div>
      ) : isQuickTime ? (
        <div className="quicktime-container">
          <div className="quicktime-message">
            <h3>QuickTime Video Format</h3>
            <p>This QuickTime video could not be played in the browser. The format may not be supported by your browser.</p>
            <p className="quicktime-note">QuickTime videos require specific codecs which may not be available in all browsers.</p>
            
            <div className="quicktime-options">
              <h4>Options:</h4>
              <ol>
                <li>
                  <strong>Download and Play Locally</strong>
                  <p>You can download the file and play it in a media player that supports QuickTime format.</p>
                  {downloadUrl && (
                    <a 
                      href={downloadUrl} 
                      download={`video-${hash?.substring(0, 8) || 'download'}.mov`} 
                      className="download-button"
                    >
                      Download Video File
                    </a>
                  )}
                </li>
                <li>
                  <strong>Try Another Browser</strong>
                  <p>Some browsers may have better support for QuickTime videos.</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="video-wrapper">
          <video 
            ref={videoRef}
            src={videoUrl} 
            controls 
            autoPlay={false}
            onError={handleVideoError}
            className="video-player"
          />
          <div className="video-controls">
            {downloadUrl && (
              <a 
                href={downloadUrl} 
                download={`video-${hash?.substring(0, 8) || 'download'}.${getVideoExtension(contentType)}`} 
                className="download-link"
              >
                Download Video
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
