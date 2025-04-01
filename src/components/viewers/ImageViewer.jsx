// src/components/viewers/ImageViewer.jsx
import React from 'react';

/**
 * Generic base image viewer that can handle various image formats
 * Used as a base for more specific image viewers (JPG, PNG, GIF, etc)
 */
export const ImageViewer = ({ content, mimeType = 'image/jpeg' }) => {
  // Convert content to a displayable format
  const getImageSrc = () => {
    if (!content) return null;
    
    try {
      // Handle Node.js Buffer JSON format {"type":"Buffer","data":[...]}
      if (typeof content === 'object' && content !== null && 
          content.type === 'Buffer' && Array.isArray(content.data)) {
        const array = new Uint8Array(content.data);
        const bytes = Array.from(array).map(byte => String.fromCharCode(byte)).join('');
        const base64 = typeof window !== 'undefined' ? window.btoa(bytes) : Buffer.from(bytes).toString('base64');
        return `data:${mimeType};base64,${base64}`;
      }
      
      // Already a base64 data URL
      if (typeof content === 'string' && content.startsWith('data:')) {
        return content;
      }
      
      // Regular string (assumed to be base64)
      if (typeof content === 'string') {
        return `data:${mimeType};base64,${content}`;
      }
      
      // Handle typed arrays (Uint8Array, etc.)
      if (content instanceof Uint8Array || content instanceof ArrayBuffer) {
        const bytes = Array.from(new Uint8Array(content))
          .map(byte => String.fromCharCode(byte))
          .join('');
        const base64 = typeof window !== 'undefined' ? window.btoa(bytes) : Buffer.from(bytes).toString('base64');
        return `data:${mimeType};base64,${base64}`;
      }
      
      // Fallback
      return null;
    } catch (e) {
      console.error('Error generating image source:', e);
      return null;
    }
  };

  const imageSrc = getImageSrc();

  if (!imageSrc) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        Unable to display image: Invalid format
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-center overflow-auto max-h-full">
      <img 
        src={imageSrc} 
        alt="Image content" 
        className="max-w-full max-h-full object-contain"
        onError={(e) => {
          e.target.onerror = null;
          e.target.classList.add('hidden');
          e.target.parentNode.innerHTML += `
            <div class="p-4 bg-red-50 text-red-600 rounded">
              Error loading image: Format may be invalid
            </div>
          `;
        }}
      />
    </div>
  );
};

export default ImageViewer;
