import React, { useState, useEffect } from 'react';
import { ContentTypeInterpreter } from '../../../content/model/content_type_detector';
import { FileTypeIcon } from '../../../components/ui/icons/FileTypeIcon';

interface CardProps {
  card: {
    hash: string;
    g_time: string;
    content?: any;
    contentType?: {
      mimeType: string;
      extension: string;
      isBlob: boolean;
      isValid: boolean;
    };
  };
  isSelected: boolean;
  onSelect: (card: { hash: string; g_time: string; content?: any; contentType?: any }) => void;
}

// Helper function for detecting Redux state data
const isReduxStateData = (content: any): boolean => {
  if (typeof content !== 'string') return false;
  
  // Common patterns in Redux state
  return content.includes('"state"') || 
         content.includes('"todos"') || 
         content.includes('"content"') ||
         content.includes('"value"') || 
         content.includes('"clm"') || 
         content.includes('"redux"');
};

export const Card: React.FC<CardProps> = ({ card, isSelected, onSelect }) => {
  const [contentType, setContentType] = useState<{
    mimeType?: string;
    extension?: string;
    isValid?: boolean;
  }>({});

  useEffect(() => {
    // If we have explicit contentType information from the API, use it
    if (card.contentType) {
      console.log('Card component - Using explicit content type from API:', card.contentType);
      console.log('Card component - Card content type:', typeof card.content);
      console.log('Card component - Card content preview:', 
        typeof card.content === 'string' 
          ? card.content.substring(0, 50) 
          : (card.content && typeof card.content === 'object' ? 'Object: ' + Object.keys(card.content).join(', ') : 'Non-string, non-object')
      );
      setContentType(card.contentType);
      return;
    }
    
    // Set default content type based on hash patterns if no explicit type and no content
    const setDefaultContentType = () => {
      // Default to Redux JSON state for most cards based on our SQLite data
      if (card.hash.startsWith('1') || card.hash.startsWith('2') || 
          card.hash.startsWith('0') || card.hash.length >= 64) {
        setContentType({
          mimeType: 'application/json',
          extension: 'json',
          isValid: true
        });
        return;
      }
      
      // Otherwise, default to plain text
      setContentType({
        mimeType: 'text/plain',
        extension: 'txt',
        isValid: true
      });
    };

    if (!card.content) {
      setDefaultContentType();
      return;
    }

    try {
      // TEXT content type from SQLite
      if (typeof card.content === 'string') {
        // Check for JSON content
        if (card.content.trim().startsWith('{') && card.content.includes('"')) {
          try {
            JSON.parse(card.content);
            setContentType({
              mimeType: 'application/json',
              extension: 'json',
              isValid: true
            });
            return;
          } catch (e) {
            // Not valid JSON, but may still be partial JSON from Redux state
            if (isReduxStateData(card.content)) {
              setContentType({
                mimeType: 'application/json',
                extension: 'json',
                isValid: true
              });
              return;
            }
          }
        }
        
        // Continue with specific content type detection
        if (card.content.startsWith('%PDF-')) {
          setContentType({
            mimeType: 'application/pdf',
            extension: 'pdf',
            isValid: true
          });
          return;
        }
        
        if (card.content.trim().startsWith('<') && card.content.includes('</')) {
          if (card.content.includes('<!DOCTYPE html') || card.content.includes('<html')) {
            setContentType({
              mimeType: 'text/html',
              extension: 'html',
              isValid: true
            });
          } else {
            setContentType({
              mimeType: 'application/xml',
              extension: 'xml',
              isValid: true
            });
          }
          return;
        }
      } 
      // BLOB content type from SQLite
      else if (card.content) {
        // Use ContentTypeInterpreter for binary data
        const detected = ContentTypeInterpreter.detectContentType(card.content);
        
        // If we got a valid content type
        if (detected.extension && detected.mimeType !== 'application/octet-stream') {
          setContentType(detected);
          return;
        }
        
        // Check if it's an object that might be parsed JSON
        if (typeof card.content === 'object' && !ArrayBuffer.isView(card.content)) {
          setContentType({
            mimeType: 'application/json',
            extension: 'json',
            isValid: true
          });
          return;
        }
      }
      
      // If we couldn't determine a specific type, use default
      setDefaultContentType();
    } catch (e) {
      console.error('Error detecting content type:', e);
      setDefaultContentType();
    }
  }, [card.content, card.hash]);

  // Helper function to get a human-readable label for mime types
  const getFileTypeLabel = (mimeType?: string): string => {
    if (!mimeType) return 'data';
    
    // Handle specific problematic mime types
    if (mimeType === 'application/octet-stream') return 'data';
    
    if (mimeType.startsWith('image/')) {
      return mimeType.split('/')[1] || 'image';
    }
    
    const mimeMap: Record<string, string> = {
      'application/json': 'json',
      'application/pdf': 'pdf',
      'application/xml': 'xml',
      'text/plain': 'text',
      'text/html': 'html',
      'text/x-mermaid': 'mermaid',
      'text/x-plantuml': 'plantuml',
      'text/vnd.graphviz': 'graphviz'
    };
    
    const knownType = mimeMap[mimeType];
    if (knownType) return knownType;
    
    if (mimeType.includes('word')) return 'word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'ppt';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
    if (mimeType.includes('sqlite')) return 'db';
    
    // Return the subtype part of the mime type if available
    const parts = mimeType.split('/');
    if (parts.length > 1) {
      // Clean up the subtype - remove parameters and simplify
      let subtype = parts[1].split(';')[0]; // Remove parameters
      
      // Special case handling
      if (subtype === 'octet-stream') return 'data';
      if (subtype === 'vnd.ms-excel') return 'excel';
      if (subtype === 'vnd.ms-powerpoint') return 'ppt';
      if (subtype === 'vnd.ms-word') return 'word';
      
      return subtype;
    }
    
    return 'data';
  }

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
          <span 
            className="text-xs bg-gray-100 rounded px-1 ml-2" 
            title={contentType.mimeType}
          >
            {contentType.extension || getFileTypeLabel(contentType.mimeType)}
          </span>
        </div>
        <span className="text-gray-500 text-xs ml-2 whitespace-nowrap">
          {card.g_time}
        </span>
      </div>
    </div>
  );
};
