// src/config/content-type-viewers.js
export const CONTENT_VIEWERS = {
  // Document types
  'application/pdf': {
    component: '../components/viewers/PDFViewer',
    priority: 100
  },
  'application/json': {
    component: '../components/viewers/JSONViewer',
    priority: 100
  },
  'application/xml': {
    component: '../components/viewers/XMLViewer',
    priority: 100
  },
  
  // Image formats
  'image/jpeg': {
    component: '../components/viewers/ImageViewer',
    priority: 100
  },
  'image/png': {
    component: '../components/viewers/ImageViewer',
    priority: 100
  },
  'image/gif': {
    component: '../components/viewers/ImageViewer',
    priority: 100
  },
  'image/svg+xml': {
    component: '../components/viewers/SVGViewer',
    priority: 100
  },
  
  // Code/text formats
  'text/html': {
    component: '../components/viewers/CodeViewer',
    priority: 100,
    options: { language: 'html' }
  },
  'text/css': {
    component: '../components/viewers/CodeViewer',
    priority: 100,
    options: { language: 'css' }
  },
  'application/javascript': {
    component: '../components/viewers/CodeViewer',
    priority: 100,
    options: { language: 'javascript' }
  },
  'application/sql': {
    component: '../components/viewers/CodeViewer',
    priority: 100,
    options: { language: 'sql' }
  },
  'text/markdown': {
    component: '../components/viewers/MarkdownViewer',
    priority: 100
  },
  'application/yaml': {
    component: '../components/viewers/CodeViewer',
    priority: 100,
    options: { language: 'yaml' }
  },
  
  // Tabular data formats
  'text/csv': {
    component: '../components/viewers/DataTableViewer',
    priority: 100,
    options: { delimiter: ',' }
  },
  'text/tab-separated-values': {
    component: '../components/viewers/DataTableViewer',
    priority: 100,
    options: { delimiter: '\t' }
  },
  
  // Diagram formats
  'text/x-mermaid': {
    component: '../components/viewers/MermaidViewer',
    priority: 100
  },
  'text/x-plantuml': {
    component: '../components/viewers/PlantUMLViewer',
    priority: 100
  },
  'text/vnd.graphviz': {
    component: '../components/viewers/GraphvizViewer',
    priority: 100
  },
  
  // Fallback for any text
  'text/plain': {
    component: '../components/viewers/TextViewer',
    priority: 10
  },
  
  // Redux state specific viewer (application-specific format)
  'application/redux-state': {
    component: '../components/viewers/ReduxStateViewer',
    priority: 200
  },
  
  // Default viewer (fallback for everything else)
  'application/octet-stream': {
    component: '../components/viewers/BinaryViewer',
    priority: 1
  }
};

// Special case format detections that override the MIME type
export const CONTENT_TYPE_OVERRIDE_RULES = [
  {
    // Detect Redux state format to use specialized viewer
    test: (content) => {
      if (typeof content === 'object' && content !== null) {
        return !!(content.cards || content.state || content.todos || 
                  content.clm || content.selectedHash !== undefined);
      }
      return false;
    },
    mimeType: 'application/redux-state'
  }
];
