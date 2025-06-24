import React, { useState, useEffect } from 'react';

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
  const [connected, setConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [pageId, setPageId] = useState(''); // Default page ID

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

  // Removed auto-sync effect, now sync only happens on button click
  useEffect(() => {
    if (connected) {
      syncPage(pageId);
    }
  }, [connected, pageId]);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/notion/verify');
      const data = await response.json();
      
      if (response.status !== 200) {
        setConnected(false);
        setError('API token is invalid. Please check your Notion API key in the .env file.');
        return;
      }
      
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError('Cannot connect to Notion API. Please check your API key.');
    }
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

      // Get fresh data from Notion
      const response = await fetch(`/api/notion/page?pageId=${pageId}`);
      const data = await response.json();
      
      if (data.success) {
        // Update cache
        const cache = await caches.open('notion-cache-v2');
        await cache.put(
          `notion-page-${pageId}`,
          new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' }
          })
        );

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
      }
    } catch (err) {
      console.error('Sync error:', err);
      if (!documents.length) {
        setError('Failed to fetch data. Please check your connection.');
      }
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
      <div className="notion-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Notion</h2>
        <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}
          style={{
            padding: '5px 10px',
            borderRadius: '15px',
            backgroundColor: connected ? '#e6ffe6' : '#ffe6e6',
            color: connected ? '#006600' : '#cc0000'
          }}>
        </span>
      </div>
      
      <div className="controls">
        <div className="input-group">
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
          />
          <button
            onClick={() => syncPage(pageId)}
            disabled={loading || !connected}
            className="sync-button"
          >
            Refresh
          </button>
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
        {documents.length === 0 && !loading && (
          <div className="no-documents">
            No documents synced yet.
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
