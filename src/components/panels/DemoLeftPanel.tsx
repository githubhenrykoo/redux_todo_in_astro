import React from 'react';

export function DemoLeftPanel() {
  console.log('[DemoLeftPanel] Rendering');
  
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      height: '100%',
      border: '1px solid #ddd'
    }}>
      <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Left Panel</h2>
      <p style={{ margin: '0.5rem 0', color: '#666' }}>
        This "LEFT" panel has a fixed width of 200px
      </p>
    </div>
  );
}

export default DemoLeftPanel;
