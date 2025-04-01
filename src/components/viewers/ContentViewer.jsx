// src/components/viewers/ContentViewer.jsx
import React, { useState, useEffect } from 'react';
import contentViewerConfig from '../../config/content-type-viewers.json';

// Import all viewer components statically
// When a new viewer is added, it needs to be imported here
import DefaultViewer from './DefaultViewer';
import BinaryViewer from './BinaryViewer';
import TextViewer from './TextViewer';
import GIFViewer from './GIFViewer';
import JPGViewer from './JPGViewer';
import PNGViewer from './PNGViewer';
import PDFViewer from './PDFViewer';
import VideoViewer from './VideoViewer';
import MOVViewer from './MOVViewer';

// Component map to avoid dynamic imports that Vite can't handle
const COMPONENT_MAP = {
  'BinaryViewer.jsx': BinaryViewer,
  'TextViewer.jsx': TextViewer,
  'GIFViewer.jsx': GIFViewer,
  'JPGViewer.jsx': JPGViewer,
  'PNGViewer.jsx': PNGViewer,
  'PDFViewer.jsx': PDFViewer,
  'VideoViewer.jsx': VideoViewer,
  'MOVViewer.jsx': MOVViewer,
  // Add other components as they are created
};

// Create a DefaultViewer component
const DefaultViewerComponent = ({ content, contentType }) => (
  <div className="p-4 bg-gray-100 rounded h-full overflow-auto">
    <div className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
      {typeof content === 'string' 
        ? content 
        : JSON.stringify(content, null, 2)}
    </div>
  </div>
);

// Fallback component while the real viewer is loading
const ViewerLoading = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="animate-pulse text-gray-400">Loading viewer...</div>
  </div>
);

// Helper function to test content against override rules
const testContentTypeOverride = (content) => {
  if (!content) return null;
  
  for (const rule of CONTENT_TYPE_OVERRIDE_RULES) {
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

// Get configuration from the JSON file
const { CONTENT_VIEWERS, CONTENT_TYPE_OVERRIDE_RULES } = contentViewerConfig;

// Helper function to get component name from full path
const getComponentNameFromPath = (path) => {
  if (!path) return null;
  // Extract just the file name from the path
  const parts = path.split('/');
  return parts[parts.length - 1];
};

export const ContentViewer = ({ content, contentType }) => {
  const [Viewer, setViewer] = useState(null);
  const [viewerProps, setViewerProps] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!content) {
      setIsLoading(false);
      return;
    }
    
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
      setViewer(() => DefaultViewerComponent);
      setIsLoading(false);
      return;
    }
    
    // Get the component name from the path
    const componentName = getComponentNameFromPath(viewerConfig.component);
    if (!componentName) {
      console.error(`Invalid component path: ${viewerConfig.component}`);
      setViewer(() => DefaultViewerComponent);
      setIsLoading(false);
      return;
    }
    
    // Set props from config
    setViewerProps(viewerConfig.options || {});
    
    // Get the viewer component from the component map
    const ViewerComponent = COMPONENT_MAP[componentName];
    
    if (ViewerComponent) {
      console.log(`Successfully loaded component: ${componentName}`);
      setViewer(() => ViewerComponent);
      setIsLoading(false);
    } else {
      console.error(`Component not found in map: ${componentName}`);
      // If the component has a fallback specified in the config, try that
      if (viewerConfig.fallback && COMPONENT_MAP[viewerConfig.fallback]) {
        console.log(`Using fallback component: ${viewerConfig.fallback}`);
        setViewer(() => COMPONENT_MAP[viewerConfig.fallback]);
      } else {
        setViewer(() => DefaultViewerComponent);
      }
      setIsLoading(false);
    }
    
  }, [content, contentType]);
  
  if (!content) {
    return <div className="p-4 text-gray-500">No content to display</div>;
  }
  
  if (isLoading) {
    return <ViewerLoading />;
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p className="font-medium">{error}</p>
        <p className="text-sm mt-2">Using default viewer instead.</p>
        <DefaultViewerComponent content={content} contentType={contentType} />
      </div>
    );
  }
  
  if (!Viewer) {
    return <DefaultViewerComponent content={content} contentType={contentType} />;
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
