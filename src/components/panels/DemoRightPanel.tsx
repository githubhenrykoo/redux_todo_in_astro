import React from 'react';

export function DemoRightPanel() {
  console.log('[DemoRightPanel] Rendering');
  
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#f5f5f5',
      height: '100%',
      border: '1px solid #ddd'
    }}>
      <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Right Panel</h2>
      <p style={{ margin: '0.5rem 0', color: '#666' }}>
        This panel has a fixed width of 200px
      </p>
    </div>
  );
}

export default DemoRightPanel;
