import React from 'react';

export function ContentDetail() {
  console.log('[ContentDetail] Rendering');
  
  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#ffffff',
      height: '100%',
      border: '1px solid #ddd'
    }}>
      <h2 style={{ margin: '0 0 1rem 0', color: '#333' }}>Content Detail</h2>
      <p style={{ margin: '0.5rem 0', color: '#666' }}>
        View and edit content details here
      </p>
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {Array(20).fill(0).map((_, i) => (
          <div key={i} style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
              Content Item {i + 1}
            </h3>
            <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
              Details for content item {i + 1}
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#888'
            }}>
              <span style={{
                background: '#f0f0f0',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}>
                Created: 2025-02-{String(i + 1).padStart(2, '0')}
              </span>
              <span style={{
                background: '#f0f0f0',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}>
                Status: {i % 2 === 0 ? 'Active' : 'Draft'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}