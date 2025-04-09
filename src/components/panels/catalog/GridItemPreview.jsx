import React, { useState, useEffect, useRef } from 'react';
import { getSimpleContentType, getContentTypeDisplay, getFormattedContentType, determineCorrectContentType } from './utils';
import { ContentService } from '../../../services/content-service';
import { isImageType } from '../../../utils/content-utils';

/**
 * Enhanced preview component for grid items
 * Shows actual content previews in the grid view instead of just icons
 */
const GridItemPreview = ({ item }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dataUrl, setDataUrl] = useState(null);
  const [textPreview, setTextPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [pdfThumbnail, setPdfThumbnail] = useState(null);
  const videoRef = useRef(null);
  const pdfRef = useRef(null);
  const contentType = item.contentType?.mimeType || 'unknown';
  
  // Process content based on type
  useEffect(() => {
    setLoading(true);
    
    if (isImageType(item.contentType)) {
      // Handle image content
      setImageLoaded(false);
      setImageError(false);
      
      // Use ContentService to fetch and process content
      ContentService.fetchContent(item.hash, { maxRetries: 1 })
        .then(result => {
          setLoading(false);
          if (result.error) {
            console.error(`Error loading preview for ${item.hash}:`, result.error);
            setImageError(true);
            return;
          }
          
          // Check for processed content (already a data URL)
          if (result.processed && result.processed.type === 'dataUrl') {
            setDataUrl(result.processed.url);
            setImageLoaded(true);
          } else {
            // Get a data URL from raw content
            const url = ContentService.getDataUrl(result.raw);
            if (url) {
              setDataUrl(url);
              setImageLoaded(true);
            } else {
              throw new Error('Unable to create data URL from content');
            }
          }
        })
        .catch(error => {
          console.error("Error loading preview image:", error);
          setImageError(true);
          setLoading(false);
        });
    } else if (contentType.startsWith('video/')) {
      // Handle video content - generate thumbnail
      ContentService.fetchContent(item.hash, { maxRetries: 1 })
        .then(result => {
          setLoading(false);
          if (result.error) {
            console.error(`Error loading video preview for ${item.hash}:`, result.error);
            return;
          }
          
          // Create a blob URL for the video to capture a thumbnail
          if (result.processed && result.processed.type === 'dataUrl') {
            generateVideoThumbnail(result.processed.url);
          } else if (result.raw?.content) {
            const dataUrl = ContentService.getDataUrl(result.raw);
            if (dataUrl) {
              generateVideoThumbnail(dataUrl);
            }
          }
        })
        .catch(error => {
          console.error("Error loading video preview:", error);
          setLoading(false);
        });
    } else if (contentType === 'application/pdf') {
      // Handle PDF content - generate thumbnail
      ContentService.fetchContent(item.hash, { maxRetries: 1 })
        .then(result => {
          setLoading(false);
          if (result.error) {
            console.error(`Error loading PDF preview for ${item.hash}:`, result.error);
            return;
          }
          
          // Create a data URL for the PDF to generate a thumbnail
          if (result.processed && result.processed.type === 'dataUrl') {
            generatePdfThumbnail(result.processed.url);
          } else if (result.raw?.content) {
            const dataUrl = ContentService.getDataUrl(result.raw);
            if (dataUrl) {
              generatePdfThumbnail(dataUrl);
            }
          }
        })
        .catch(error => {
          console.error("Error loading PDF preview:", error);
          setLoading(false);
        });
    } else if (contentType.startsWith('text/') || 
               contentType === 'application/json' || 
               contentType === 'application/xml') {
      // Handle text content (including CSV)
      ContentService.fetchContent(item.hash, { maxRetries: 1 })
        .then(result => {
          setLoading(false);
          if (result.error) {
            console.error(`Error loading text preview for ${item.hash}:`, result.error);
            return;
          }
          
          // For text content, extract a preview
          if (result.processed && result.processed.type === 'text') {
            // Get first few lines for preview
            const previewText = extractTextPreview(result.processed.data);
            setTextPreview(previewText);
          } else if (result.raw?.content) {
            // Try to extract text from raw content
            let textContent = '';
            
            if (typeof result.raw.content === 'string') {
              textContent = result.raw.content;
            } else if (result.raw.content.type === 'Buffer') {
              // Convert buffer to text
              try {
                const decoder = new TextDecoder('utf-8');
                textContent = decoder.decode(new Uint8Array(result.raw.content.data));
              } catch (err) {
                console.error('Error decoding buffer:', err);
              }
            }
            
            const previewText = extractTextPreview(textContent);
            setTextPreview(previewText);
          }
        })
        .catch(error => {
          console.error("Error loading text preview:", error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [item.hash, contentType, item.contentType]);
  
  // Extract a short preview from text content
  const extractTextPreview = (text) => {
    if (!text) return '';
    
    // Get up to 3 lines, limited to 100 chars per line
    const lines = text.split('\n').slice(0, 3);
    return lines.map(line => line.trim().substring(0, 100)).join('\n');
  };
  
  // Generate a thumbnail for a video
  const generateVideoThumbnail = (url) => {
    console.log('Generating video thumbnail from URL:', url);
    
    // Create a video element to capture the thumbnail
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // Handle potential CORS issues
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    
    // Add event listeners
    video.onloadeddata = () => {
      console.log('Video loaded data, duration:', video.duration);
      try {
        // Seek to the middle of the video to capture a more representative frame
        const seekTime = video.duration / 2;
        console.log(`Seeking to middle of video: ${seekTime.toFixed(2)}s`);
        video.currentTime = seekTime;
      } catch (err) {
        console.error('Error seeking video:', err);
        // Try to extract thumbnail without seeking
        captureFrame();
      }
    };
    
    video.onerror = (e) => {
      console.error('Error loading video for thumbnail:', e);
      setLoading(false);
    };
    
    video.onseeked = () => {
      console.log('Video seeked to timestamp for thumbnail capture');
      captureFrame();
    };
    
    // Helper function to capture a frame
    const captureFrame = () => {
      try {
        // Capture the thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Successfully captured video thumbnail');
        setVideoThumbnail(thumbnailUrl);
        
        // Clean up
        video.pause();
        URL.revokeObjectURL(video.src);
      } catch (err) {
        console.error('Error capturing video frame:', err);
      }
    };
    
    // Load and play the video to trigger events
    video.load();
    
    // Some browsers need a manual play to trigger events
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Auto-play prevented:', error);
        // Try to capture frame anyway
        setTimeout(captureFrame, 300);
      });
    }
  };
  
  // Generate a thumbnail for a PDF - fallback method without using PDF.js
  const generatePdfThumbnail = async (url) => {
    console.log('Generating PDF thumbnail using fallback method');
    
    try {
      // Instead of using PDF.js which requires DOMMatrix, use a simple icon approach
      setLoading(false);
      
      // Create a canvas with a PDF icon or placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      
      // Fill with light gray background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw PDF icon or text
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PDF', canvas.width / 2, canvas.height / 2 - 40);
      
      // Add a page representation
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      const pageWidth = 100;
      const pageHeight = 130;
      const pageX = (canvas.width - pageWidth) / 2;
      const pageY = (canvas.height - pageHeight) / 2;
      ctx.strokeRect(pageX, pageY, pageWidth, pageHeight);
      
      // Add some dummy lines to represent text
      ctx.fillStyle = '#777777';
      for (let i = 0; i < 5; i++) {
        const lineWidth = 70 * (0.5 + Math.random() * 0.5);
        ctx.fillRect(pageX + 15, pageY + 30 + i * 20, lineWidth, 5);
      }
      
      // Convert to data URL
      const thumbnailUrl = canvas.toDataURL('image/png');
      console.log('Successfully created PDF thumbnail placeholder');
      setPdfThumbnail(thumbnailUrl);
    } catch (error) {
      console.error('Error generating PDF thumbnail:', error);
      setLoading(false);
    }
  };
  
  // Image previews
  if (contentType.startsWith('image/')) {
    if (imageError) {
      return (
        <div className="grid-item-preview default-preview">
          <div className="preview-icon">
            <i className="fa fa-image" /> Error
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid-item-preview image-preview">
        {loading && (
          <div className="loading-indicator">
            <i className="fa fa-spinner fa-spin" />
          </div>
        )}
        {imageLoaded && dataUrl && (
          <img 
            src={dataUrl} 
            alt={item.name || 'Image preview'} 
            className="preview-image"
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }
  
  // For videos without thumbnails yet, show icon with loading state
  if (contentType.startsWith('video/') && !videoThumbnail) {
    return (
      <div className="grid-item-preview default-preview video-fallback">
        {loading ? (
          <div className="loading-indicator">
            <i className="fa fa-spinner fa-spin" />
          </div>
        ) : (
          <div className="preview-icon">
            <i className="fa fa-file-video" />
            <div className="content-type-label">
              {item.contentType?.mimeType === 'video/quicktime' ? 
                'MP4 (video/mp4)' : 
                getFormattedContentType(item.contentType?.mimeType)}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Video previews
  if (contentType.startsWith('video/') && videoThumbnail) {
    return (
      <div className="grid-item-preview video-preview">
        <img 
          src={videoThumbnail} 
          alt={item.name || 'Video preview'} 
          className="preview-image"
        />
        <div className="video-type-label">
          {item.contentType?.mimeType === 'video/quicktime' ? 
            'MP4 (video/mp4)' : 
            getFormattedContentType(item.contentType?.mimeType)}
        </div>
      </div>
    );
  }
  
  // PDF previews
  if (contentType === 'application/pdf' && pdfThumbnail) {
    return (
      <div className="grid-item-preview pdf-preview">
        <img 
          src={pdfThumbnail} 
          alt={item.name || 'PDF preview'} 
          className="preview-image"
        />
        <div className="pdf-type-label">
          {getFormattedContentType('application/pdf')}
        </div>
      </div>
    );
  }
  
  // For PDFs without thumbnails yet, show icon with loading state
  if (contentType === 'application/pdf' && !pdfThumbnail) {
    return (
      <div className="grid-item-preview default-preview pdf-fallback">
        {loading ? (
          <div className="loading-indicator">
            <i className="fa fa-spinner fa-spin" />
          </div>
        ) : (
          <div className="preview-icon">
            <i className="fa fa-file-pdf" />
            <div className="content-type-label">
              {getFormattedContentType('application/pdf')}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Text previews (CSV, JSON, etc.)
  if ((contentType.startsWith('text/') || 
       contentType === 'application/json' || 
       contentType === 'application/xml') && 
      textPreview) {
    return (
      <div className="grid-item-preview text-preview">
        {loading ? (
          <div className="loading-indicator">
            <i className="fa fa-spinner fa-spin" />
          </div>
        ) : (
          <>
            <div className="high-contrast-text">
              <pre>{textPreview}</pre>
            </div>
            <div className="text-type-label">
              {item.contentType?.mimeType === 'video/quicktime' ? 
                'MP4 (video/mp4)' : 
                getFormattedContentType(item.contentType?.mimeType)}
            </div>
          </>
        )}
      </div>
    );
  }
  
  // Default icon-based previews for other types
  const getIconClass = () => {
    if (contentType.startsWith('text/csv')) return 'fa fa-file-csv';
    if (contentType.startsWith('text/')) return 'fa fa-file-alt';
    if (contentType.startsWith('audio/')) return 'fa fa-file-audio';
    if (contentType.startsWith('video/')) return 'fa fa-file-video';
    if (contentType.startsWith('application/pdf')) return 'fa fa-file-pdf';
    if (contentType.includes('zip') || contentType.includes('compressed')) return 'fa fa-file-archive';
    return 'fa fa-file';
  };

  // For all other content types, show icon-based preview
  return (
    <div className="grid-item-preview default-preview">
      <div className="preview-icon">
        <i className={getIconClass()} />
        <div className="content-type-label">
          {item.contentType?.mimeType === 'video/quicktime' ? 
            'MP4 (video/mp4)' : 
            getFormattedContentType(item.contentType?.mimeType)}
        </div>
      </div>
    </div>
  );
};

export default GridItemPreview;
