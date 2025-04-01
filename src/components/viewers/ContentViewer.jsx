// src/components/viewers/ContentViewer.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import contentViewerConfig from '../../config/content-type-viewers.json';

// Get configuration from the JSON file
const { CONTENT_VIEWERS, CONTENT_TYPE_OVERRIDE_RULES } = contentViewerConfig;

// Fallback component while the real viewer is loading
const ViewerLoading = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="animate-pulse text-gray-400">Loading viewer...</div>
  </div>
);

// Default viewer when no appropriate viewer is found
const DefaultViewer = ({ content, contentType }) => (
  <div className="p-4 bg-gray-100 rounded h-full overflow-auto">
    <div className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
      {typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2)}
    </div>
  </div>
);

// Helper function to test content against override rules
const testContentTypeOverride = (content) => {
  if (!content) return null;
  
  for (const rule of CONTENT_TYPE_OVERRIDE_RULES) {
    // Since we can't store functions in JSON, we use eval to convert string test to function
    // This is generally not recommended for security reasons, but in this controlled environment it's acceptable
    try {
      // For Redux state detection
      if (rule.description === "Detect Redux state format to use specialized viewer") {
        if (typeof content === 'object' && content !== null && 
            (content.cards || content.state || content.todos || 
            content.clm || content.selectedHash !== undefined)) {
          return rule.mimeType;
        }
      }
      // For other tests defined in the JSON
      else if (rule.test && new Function('content', `return (${rule.test})`)(content)) {
        return rule.mimeType;
      }
    } catch (error) {
      console.error(`Error evaluating content type override rule: ${error}`);
    }
  }
  
  return null;
};

export const ContentViewer = ({ content, contentType }) => {
  const [Viewer, setViewer] = useState(null);
  const [viewerProps, setViewerProps] = useState({});
  
  useEffect(() => {
    if (!content) return;
    
    // Get the original MIME type
    let mimeType = contentType?.mimeType || 'application/octet-stream';
    
    // Debug logging
    console.log('ContentViewer - Using content type:', mimeType);
    console.log('ContentViewer - Content type:', typeof content);
    
    // Check for special overrides
    const overrideMimeType = testContentTypeOverride(content);
    if (overrideMimeType) {
      console.log(`ContentViewer - Override detected: ${mimeType} -> ${overrideMimeType}`);
      mimeType = overrideMimeType;
    }
    
    // Get viewer config for this MIME type
    const viewerConfig = CONTENT_VIEWERS[mimeType];
    
    if (!viewerConfig) {
      // Fallback to default viewer
      console.log(`ContentViewer - No viewer found for ${mimeType}, using default viewer`);
      setViewer(() => DefaultViewer);
      return;
    }
    
    // Import the viewer component
    try {
      console.log(`ContentViewer - Loading viewer for ${mimeType}: ${viewerConfig.component}`);
      
      // For simplicity in this initial implementation, we'll use a direct mapping instead of dynamic imports
      // This will be replaced with proper dynamic imports in a production version
      let ViewerComponent;
      
      switch(viewerConfig.component) {
        case '../components/viewers/JSONViewer':
          // When we add more viewers, we'll handle them here
          import('./JSONViewer').then(module => {
            setViewer(() => module.default || module.JSONViewer);
            setViewerProps(viewerConfig.options || {});
          }).catch(error => {
            console.error(`Error loading JSONViewer:`, error);
            setViewer(() => DefaultViewer);
          });
          break;
        case '../components/viewers/ReduxStateViewer':
          import('./ReduxStateViewer').then(module => {
            setViewer(() => module.default || module.ReduxStateViewer);
            setViewerProps(viewerConfig.options || {});
          }).catch(error => {
            console.error(`Error loading ReduxStateViewer:`, error);
            setViewer(() => DefaultViewer);
          });
          break;
        case '../components/viewers/TextViewer':
          import('./TextViewer').then(module => {
            setViewer(() => module.default || module.TextViewer);
            setViewerProps(viewerConfig.options || {});
          }).catch(error => {
            console.error(`Error loading TextViewer:`, error);
            setViewer(() => DefaultViewer);
          });
          break;
        case '../components/viewers/BinaryViewer':
          import('./BinaryViewer').then(module => {
            setViewer(() => module.default || module.BinaryViewer);
            setViewerProps(viewerConfig.options || {});
          }).catch(error => {
            console.error(`Error loading BinaryViewer:`, error);
            setViewer(() => DefaultViewer);
          });
          break;
        // Add cases for other viewers as they are implemented
        default:
          console.log(`ContentViewer - Viewer component not yet implemented: ${viewerConfig.component}`);
          setViewer(() => DefaultViewer);
      }
    } catch (error) {
      console.error(`Error loading viewer for ${mimeType}:`, error);
      setViewer(() => DefaultViewer);
    }
  }, [content, contentType]);
  
  if (!content) {
    return <div className="p-4 text-gray-500">No content to display</div>;
  }
  
  if (!Viewer) {
    return <ViewerLoading />;
  }
  
  return (
    <div className="h-full">
      <Viewer 
        content={content} 
        contentType={contentType} 
        {...viewerProps} 
      />
    </div>
  );
};

export default ContentViewer;
