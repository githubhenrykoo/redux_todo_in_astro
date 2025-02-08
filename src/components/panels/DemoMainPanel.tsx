import React from 'react';

export function DemoMainPanel() {
  console.log('[DemoMainPanel] Rendering');
  
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#ffffff',
      height: '100%',
      border: '1px solid #ddd'
    }}>
      <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Main Panel</h2>
      <p style={{ margin: '0.5rem 0', color: '#666' }}>
        This panel takes up the remaining space
      </p>
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        {Array(20).fill(0).map((_, i) => (
          <p key={i} style={{ margin: '0.5rem 0', color: '#666' }}>
            Main panel content line {i + 1}
          </p>
        ))}
      </div>
    </div>
  );
}

export default DemoMainPanel;
