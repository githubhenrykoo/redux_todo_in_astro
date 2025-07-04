import React, { useState, useEffect } from 'react';

// Notion OAuth configuration
const NOTION_AUTH_URL = 'https://api.notion.com/v1/oauth/authorize?client_id=226d872b-594c-80ac-90cf-003720fc68f2&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A4321%2Fauth%2Fnotion%2Fcallback';

// Add the extractTitle helper function
const extractTitle = (page) => {
  if (page.properties && page.properties.title) {
    const titleProperty = page.properties.title;
    if (Array.isArray(titleProperty.title)) {
      return titleProperty.title.map(t => t.plain_text).join('');
    }
  }
  return page.id;
};

const NotionPanel = ({ className = '' }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageId, setPageId] = useState(''); // Default page ID
  const [connected, setConnected] = useState(false); // Default to false until authenticated
  const [accessToken, setAccessToken] = useState(null);
  const [workspaceName, setWorkspaceName] = useState('');

  // Check for existing token and listen for OAuth success
  useEffect(() => {
    const savedToken = localStorage.getItem('notion_access_token');
    if (savedToken) {
      const savedWorkspaceName = localStorage.getItem('notion_workspace_name');
      setAccessToken(savedToken);
      setWorkspaceName(savedWorkspaceName || '');
      setConnected(true);
      console.log('Restored previous Notion session');
    }

    // Listen for OAuth success event
    const handleNotionConnected = (event) => {
      const { accessToken, workspaceId, workspaceName } = event.detail;
      setAccessToken(accessToken);
      setWorkspaceName(workspaceName);
      setConnected(true);
      console.log('Notion connected via OAuth');
    };

    window.addEventListener('notionConnected', handleNotionConnected);
    return () => window.removeEventListener('notionConnected', handleNotionConnected);
  }, []);

  // Auto-sync when pageId changes and we're connected
  useEffect(() => {
    if (pageId && connected) {
      syncPage(pageId);
    }
  }, [pageId, connected]);



  const handleLogin = () => {
    // Open OAuth window
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    window.open(
      NOTION_AUTH_URL,
      'Notion OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('notion_access_token');
    localStorage.removeItem('notion_workspace_id');
    localStorage.removeItem('notion_workspace_name');
    
    setAccessToken(null);
    setConnected(false);
    setDocuments([]);
    setError(null);
  };



  const uploadToCardCollection = async (notionData) => {
    try {
      // Convert the Notion data to raw format
      const contentData = notionData.map(doc => {
        let rawContent = `Title: ${doc.title}\n\n`;
        
        // Add tables
        if (doc.tables?.length > 0) {
          rawContent += 'Tables:\n';
          doc.tables.forEach(table => {
            table.rows.forEach(row => {
              rawContent += row.cells.join(' | ') + '\n';
            });
            rawContent += '\n';
          });
        }
      
        // Add descriptions
        if (doc.descriptions?.length > 0) {
          rawContent += 'Descriptions:\n';
          doc.descriptions.forEach(desc => {
            rawContent += `${desc.content}\n`;
          });
          rawContent += '\n';
        }
      
        // Add subheadings
        if (doc.subheadings?.length > 0) {
          rawContent += 'Subheadings:\n';
          doc.subheadings.forEach(heading => {
            rawContent += `${'#'.repeat(heading.level)} ${heading.content}\n`;
          });
        }
      
        return rawContent;
      }).join('\n---\n');
    
      await fetch('http://localhost:4321/api/card-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: "add",
          card: {
            content: {
              dimensionType: "abstractSpecification",
              context: contentData,
              goal: "",
              successCriteria: ""
            }
          }
        })
      });
    
      return true;
    } catch (err) {
      console.error('Upload error:', err);
      return false;
    }
  };

  const syncDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notion/database');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
        await uploadToCardCollection(data.documents);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Failed to sync database. Please check your connection and API key.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Daftarkan service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const syncPage = async (pageId) => {
    if (!pageId.trim()) {
      setError('Please enter a valid page ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Tampilkan data dari cache terlebih dahulu jika ada
      const cachedData = await getCachedPage(pageId);
      if (cachedData) {
        setDocuments(prev => {
          const exists = prev.find(doc => doc.id === cachedData.id);
          if (!exists) {
            return [...prev, cachedData];
          }
          return prev;
        });
      }

      // Get fresh data from Notion through our API endpoint
      const response = await fetch(`/api/notion/getpage?pageId=${pageId}&accessToken=${accessToken}`);
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

        setDocuments(prev => {
          const filtered = prev.filter(doc => doc.id !== formattedDoc.id);
          return [...filtered, formattedDoc];
        });
        
        await uploadToCardCollection([formattedDoc]);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message || 'Failed to fetch data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getCachedPage = async (pageId) => {
    try {
      const cache = await caches.open('notion-cache-v2');
      const cachedResponse = await cache.match(`notion-page-${pageId}`);
      
      if (cachedResponse) {
        const data = await cachedResponse.json();
        if (data.success) {
          return {
            id: data.document.page.id,
            title: extractTitle(data.document.page),
            tables: data.document.tables,
            descriptions: data.document.descriptions,
            subheadings: data.document.subheadings,
            lastEdited: data.document.page.last_edited_time
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  return (
    <div className={`notion-panel ${className}`} style={{ padding: '20px', backgroundColor: 'white', height: '100%', overflowY: 'auto' }}>
      
      <div className="controls">
        {!connected ? (
          <button
            onClick={handleLogin}
            className="connect-button"
            style={{
              padding: '10px 20px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Connect to Notion
          </button>
        ) : (
          <div className="input-group">
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              type="text" 
              placeholder="Enter Notion Page ID"
              disabled={!connected}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  syncPage(e.target.value);
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: connected ? '#fff' : '#f6f6f6',
                color: connected ? '#37352f' : '#999',
                transition: 'all 0.2s'
              }}
            />
          </div>
          <button
            onClick={() => syncPage(pageId)}
            disabled={loading}
            className="sync-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#2ecc71',
              color: '#fff',
              backgroundColor: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Syncing...' : 'Sync Page'}
          </button>
          </div>
        )}
      </div>

      {/* Workspace Info & Logout */}
      {connected && (
        <div className="workspace-info" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          marginBottom: '20px',
          borderBottom: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              backgroundColor: '#000',
              color: '#fff',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {workspaceName.charAt(0)}
            </span>
            <span style={{ fontWeight: '500' }}>{workspaceName}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f5f5f5',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#666',
              transition: 'all 0.2s'
            }}
          >
            Logout
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="documents-list">
        {documents.map((doc) => (
          <div key={doc.id} className="document-item">
            <h3 style={{ 
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>Title: {doc.title}</h3>
            
            {/* Display bullet points */}
            {doc.descriptions && doc.descriptions.length > 0 && (
              <div className="descriptions">
                <ul style={{ 
                  listStyleType: 'disc',
                  paddingLeft: '20px',
                  marginBottom: '16px'
                }}>
                  {doc.descriptions.map(desc => (
                    <li key={desc.id} style={{ marginBottom: '8px' }}>
                      {desc.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Display code blocks */}
            {doc.codeBlocks && doc.codeBlocks.length > 0 && (
              <div className="code-blocks">
                {doc.codeBlocks.map((block, index) => (
                  <div key={index} className="code-block" style={{
                    backgroundColor: '#f7f6f3',
                    padding: '16px',
                    borderRadius: '3px',
                    marginBottom: '16px',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    <code style={{ color: '#333' }}>{block.content}</code>
                  </div>
                ))}
              </div>
            )}

            {/* Display tables */}
            {doc.tables && doc.tables.length > 0 && (
              <div className="tables">
                {doc.tables.map(table => (
                  <div key={table.id} className="table-container" style={{ 
                    overflowX: 'auto',
                    marginBottom: '20px'
                  }}>
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
          </div>
        ))}
      </div>

      <style jsx>{`
        .notion-panel {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .connect-button:hover {
          background-color: #333 !important;
        }

        .notion-logo {
          color: #000;
        }
        
        .document-item {
          margin-bottom: 24px;
          padding: 16px;
          border-radius: 8px;
        }
        
        .input-group {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .input-group input:focus {
          outline: none;
          border-color: #2ecc71;
          box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.2);
        }

        .sync-button:not(:disabled):hover {
          background-color: #27ae60 !important;
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
