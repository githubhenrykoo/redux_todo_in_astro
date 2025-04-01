import React, { useState, useEffect } from 'react';
import { ContentTypeInterpreter } from '../../../content/model/content_type_detector';
import { FileTypeIcon } from '../../../components/ui/icons/FileTypeIcon';

interface CardProps {
  card: {
    hash: string;
    g_time: string;
    content?: any;
  };
  isSelected: boolean;
  onSelect: (card: { hash: string; g_time: string; content?: any }) => void;
}

export const Card: React.FC<CardProps> = ({ card, isSelected, onSelect }) => {
  const [contentType, setContentType] = useState<{
    mimeType?: string;
    extension?: string;
    isValid?: boolean;
  }>({});

  useEffect(() => {
    // Try to detect content type if content is available
    if (card.content) {
      const detected = ContentTypeInterpreter.detectContentType(card.content);
      setContentType(detected);
    }
  }, [card.content]);

  return (
    <div
      className={`border rounded p-3 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
      onClick={() => onSelect(card)}
    >
      <div className="flex justify-between mb-1">
        <div className="flex items-center">
          <FileTypeIcon 
            mimeType={contentType.mimeType} 
            extension={contentType.extension}
            size={18}
            className="mr-2"
          />
          <span 
            className="font-medium text-blue-600 text-sm truncate max-w-[120px]"
            title={card.hash}
          >
            {card.hash.substring(0, 8)}...
          </span>
          {contentType.extension && (
            <span 
              className="text-xs bg-gray-100 rounded px-1 ml-2" 
              title={contentType.mimeType}
            >
              {contentType.extension}
            </span>
          )}
        </div>
        <span className="text-gray-500 text-xs ml-2 whitespace-nowrap">
          {card.g_time}
        </span>
      </div>
    </div>
  );
};
