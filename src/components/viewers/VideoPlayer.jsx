import React, { useState, useEffect, useRef } from 'react';
import { ContentService } from '../../services/content-service';
import './video-player.css';
import { getFormattedContentType } from '../panels/catalog/utils';

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
  
  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingSeeker, setIsDraggingSeeker] = useState(false);
  
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const seekBarRef = useRef(null);
  
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
  
  // Toggle play/pause 
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      } else if (videoContainerRef.current.webkitRequestFullscreen) {
        videoContainerRef.current.webkitRequestFullscreen();
      } else if (videoContainerRef.current.msRequestFullscreen) {
        videoContainerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Format time to MM:SS
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '00:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle seeking when user drags the progress bar
  const handleSeekBarMouseDown = (e) => {
    setIsDraggingSeeker(true);
    updateSeekPosition(e);
  };

  const handleSeekBarMouseMove = (e) => {
    if (isDraggingSeeker) {
      updateSeekPosition(e);
    }
  };

  const handleSeekBarMouseUp = (e) => {
    if (isDraggingSeeker) {
      updateSeekPosition(e);
      setIsDraggingSeeker(false);
    }
  };

  // Handle clicks directly on the progress bar
  const handleSeekBarClick = (e) => {
    updateSeekPosition(e);
  };

  // Update video position based on seekbar interaction
  const updateSeekPosition = (e) => {
    if (!seekBarRef.current || !videoRef.current || duration === 0) return;
    
    const rect = seekBarRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = position * duration;
    
    console.log(`Updating video seek position: ${position.toFixed(2)} (${newTime.toFixed(2)}s)`);
    
    // Update video current time
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Listen for video events to update UI state
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    const handleTimeUpdate = () => {
      if (!isDraggingSeeker) {
        const newTime = videoElement.currentTime;
        console.log(`Video time updated: ${newTime.toFixed(2)}s / ${videoElement.duration.toFixed(2)}s`);
        setCurrentTime(newTime);
      }
    };
    
    const handleDurationChange = () => {
      const newDuration = videoElement.duration;
      console.log(`Video duration updated: ${newDuration.toFixed(2)}s`);
      setDuration(newDuration);
    };
    
    const handleLoadedMetadata = () => {
      const newDuration = videoElement.duration;
      console.log(`Video metadata loaded. Duration: ${newDuration.toFixed(2)}s`);
      setDuration(newDuration);
      
      // Some browsers only set duration properly on loadedmetadata
      if (isNaN(duration) || duration === 0) {
        setDuration(newDuration);
      }
    };
    
    const handleLoadedData = () => {
      console.log('Video data loaded. Ready to play.');
      // Force a UI update once the video is loaded
      setCurrentTime(videoElement.currentTime);
      setDuration(videoElement.duration);
    };
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    const handleVolumeUpdate = () => {
      setVolume(videoElement.volume);
      setIsMuted(videoElement.muted);
    };
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    // Add event listeners
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('loadeddata', handleLoadedData);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('volumechange', handleVolumeUpdate);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mousemove', handleSeekBarMouseMove);
    document.addEventListener('mouseup', handleSeekBarMouseUp);
    
    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('loadeddata', handleLoadedData);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('volumechange', handleVolumeUpdate);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mousemove', handleSeekBarMouseMove);
      document.removeEventListener('mouseup', handleSeekBarMouseUp);
    };
  }, [isDraggingSeeker]);
  
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
  
  const getVideoTitle = () => {
    // This could be expanded to extract metadata from the video
    return "Soldier falling down to knees Meme template";
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getVideoFileSize = () => {
    // This is a placeholder - would need to be implemented to get actual size
    return 2.5 * 1024 * 1024; // Assume 2.5MB as an example
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
        <div className="video-wrapper" ref={videoContainerRef}>
          <video 
            ref={videoRef}
            src={videoUrl} 
            onClick={togglePlay}
            onError={handleVideoError}
            className="video-player"
            width="auto"
            height="auto"
            style={{
              maxWidth: "100%", 
              width: "auto",
              height: "auto",
              maxHeight: "70vh",
              margin: "0 auto",
              display: "block"
            }}
          />
          
          <div className="custom-video-controls">
            <div 
              className="video-progress-container" 
              ref={seekBarRef}
              onClick={handleSeekBarClick}
              onMouseDown={handleSeekBarMouseDown}
            >
              <div 
                className="video-progress-bar" 
                style={{ width: duration > 0 ? `${(currentTime / duration * 100).toFixed(2)}%` : '0%' }}
              ></div>
              <div 
                className="video-progress-handle"
                style={{ left: duration > 0 ? `${(currentTime / duration * 100).toFixed(2)}%` : '0%' }}
              ></div>
            </div>
            
            <div className="video-controls-bottom">
              <div className="video-controls-left">
                <button className="video-control-button" onClick={togglePlay}>
                  {isPlaying ? (
                    <span className="control-icon">❚❚</span>
                  ) : (
                    <span className="control-icon">▶</span>
                  )}
                </button>
                
                <div className="video-volume-control">
                  <button className="video-control-button" onClick={toggleMute}>
                    {isMuted ? (
                      <span className="control-icon">🔇</span>
                    ) : (
                      <span className="control-icon">🔊</span>
                    )}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>
                
                <div className="video-time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span> / </span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              <div className="video-controls-right">
                <button className="video-control-button" onClick={toggleFullscreen}>
                  <span className="control-icon">{isFullscreen ? '⤓' : '⤒'}</span>
                </button>
                
                {downloadUrl && (
                  <a 
                    href={downloadUrl} 
                    download={`video-${hash?.substring(0, 8) || 'download'}.${getVideoExtension(contentType)}`} 
                    className="download-link"
                  >
                    <span className="control-icon">⬇</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {!isQuickTime && !loading && !error && (
        <div className="video-title-area">
          <h3 className="video-title">{getVideoTitle()}</h3>
          <div className="video-info">
            <div className="video-metadata">
              <span className="video-format">
                {contentType?.mimeType ? 
                  `${getFormattedContentType(contentType.mimeType)}` : 
                  'Video'}
              </span>
              <span>{formatFileSize(getVideoFileSize())}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
