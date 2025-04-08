import React, { useState, useEffect } from 'react';
import { getSimpleContentType, getContentTypeDisplay } from './utils';
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
              {ContentService.getContentTypeDisplay(item.contentType)}
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
          {ContentService.getContentTypeDisplay(item.contentType)}
        </div>
      </div>
    </div>
  );
};

export default GridItemPreview;
