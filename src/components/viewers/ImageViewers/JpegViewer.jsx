// src/components/viewers/ImageViewers/JpegViewer.jsx
import React from 'react';

export const JpegViewer = ({ content, contentType }) => {
  // Determine image source
  const imageSrc = typeof content === 'string' 
    ? content 
    : content.data || content.previewUrl || content.src;
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-full max-h-full overflow-auto">
        <img 
          src={imageSrc} 
          alt={contentType?.fileName || 'JPEG Image'}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="mt-2 text-sm text-gray-600">
        {contentType?.fileName || 'JPEG Image'}
      </div>
    </div>
  );
};

export default JpegViewer;
