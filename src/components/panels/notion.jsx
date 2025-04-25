import React, { useState, useEffect } from 'react';

// Add the extractTitle helper function
const extractTitle = (page) => {
  // Try to get title from properties
  if (page.properties && page.properties.title) {
    const titleProperty = page.properties.title;
    if (Array.isArray(titleProperty.title)) {
      return titleProperty.title.map(t => t.plain_text).join('');
    }
  }
  
  // Fallback to page ID if no title found
  return page.id;
};

const NotionPanel = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkConnection();
    // Add automatic retry every 5 seconds, up to 3 times
    const intervalId = setInterval(() => {
      if (!connected && retryCount < 3) {
        checkConnection();
        setRetryCount(prev => prev + 1);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [connected, retryCount]);

  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:3002/health');
      const data = await response.json();
      
      if (response.status === 401) {
        setConnected(false);
        setError('API token is invalid. Please check your Notion API key in the .env file.');
        return;
      }
      
      setConnected(data.status === 'ok');
    } catch (err) {
      setConnected(false);
      setError('Cannot connect to Notion server. Please ensure the server is running.');
    }
  };

  const syncDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3002/sync/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      } else {
        throw new Error(data.error || 'Failed to sync database');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncPage = async (pageId) => {
    if (!pageId.trim()) {
      setError('Please enter a valid page ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3002/sync/page/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        const formattedDoc = {
          id: data.document.page.id,
          title: extractTitle(data.document.page),
          tables: data.document.tables,
          descriptions: data.document.descriptions,
          subheadings: data.document.subheadings,
          lastEdited: data.document.page.last_edited_time
        };
        setDocuments(prev => [...prev, formattedDoc]);
      } else {
        throw new Error(data.error || 'Failed to sync page');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notion-panel" style={{ padding: '20px' }}>
      <div className="notion-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Notion Documents</h2>
        <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}
          style={{
            padding: '5px 10px',
            borderRadius: '15px',
            backgroundColor: connected ? '#e6ffe6' : '#ffe6e6',
            color: connected ? '#006600' : '#cc0000'
          }}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      
      <div className="controls">
        <button 
          onClick={syncDatabase}
          disabled={loading || !connected}
          className="sync-button"
        >
          {loading ? 'Syncing...' : 'Sync Database'}
        </button>
        
        <div className="input-group">
          <input 
            value="1d83b3ef43448048abbbe3452cba06da"
            type="text" 
            placeholder="Enter Page ID"
            disabled={!connected}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                syncPage(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="documents-list">
        {documents.map((doc) => (
          <div key={doc.id} className="document-item">
            <h3>{doc.title}</h3>
            
            {/* Display tables */}
            {doc.tables && doc.tables.length > 0 && (
              <div className="tables">
                <h4>Tables</h4>
                {doc.tables.map(table => (
                  <div key={table.id} className="table-container" style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table style={{ 
                      width: '100%',
                      borderCollapse: 'collapse',
                      marginBottom: '10px'
                    }}>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.cells.map((cell, cellIndex) => (
                              <td 
                                key={cellIndex}
                                style={{
                                  border: '1px solid #ddd',
                                  padding: '8px',
                                  backgroundColor: rowIndex === 0 ? '#f5f5f5' : 'white'
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Display subheadings */}
            {doc.subheadings && doc.subheadings.length > 0 && (
              <div className="subheadings">
                <h4>Subheadings</h4>
                {doc.subheadings.map(heading => (
                  <div 
                    key={heading.id} 
                    className={`heading-${heading.level}`}
                    style={{ 
                      marginLeft: `${(heading.level - 1) * 20}px`,
                      fontSize: `${1.4 - (heading.level * 0.1)}em`,
                      marginBottom: '8px'
                    }}
                  >
                    {heading.content}
                  </div>
                ))}
              </div>
            )}
            
            {/* Display descriptions */}
            {doc.descriptions && doc.descriptions.length > 0 && (
              <div className="descriptions">
                <h4>Descriptions</h4>
                {doc.descriptions.map(desc => (
                  <p key={desc.id}>{desc.content}</p>
                ))}
              </div>
            )}
            
            <div className="document-meta">
              <span>ID: {doc.id}</span>
            </div>
          </div>
        ))}
        {documents.length === 0 && !loading && (
          <div className="no-documents">
            No documents synced yet. Click 'Sync Database' to start.
          </div>
        )}
      </div>

      <style jsx>{`
        .notion-panel {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .document-item {
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid #eee;
          border-radius: 8px;
        }
        
        .sync-button {
          padding: 8px 16px;
          background-color: #2ecc71;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
        }
        
        .sync-button:disabled {
          background-color: #95a5a6;
          cursor: not-allowed;
        }
        
        .input-group {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .input-group input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          flex: 1;
        }
        
        .error-message {
          color: #e74c3c;
          padding: 10px;
          margin: 10px 0;
          background-color: #fadbd8;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default NotionPanel;