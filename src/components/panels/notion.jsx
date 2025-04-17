import React, { useState, useEffect } from 'react';

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
          content: extractContent(data.document.blocks),
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

  // Add helper functions to extract title and content
  const extractTitle = (page) => {
    const titleProp = Object.values(page.properties).find(
      prop => prop.type === 'title'
    );
    return titleProp?.title[0]?.plain_text || 'Untitled';
  };

  const extractContent = (blocks) => {
    return blocks
      .filter(block => block.type === 'paragraph')
      .map(block => block.paragraph.rich_text?.[0]?.plain_text || '')
      .join('\n')
      .slice(0, 500);
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
            <p>{doc.content.substring(0, 100)}...</p>
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
    </div>
  );
};

export default NotionPanel;