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
  const [workspace, setWorkspace] = useState(null);

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
      // Check if we have a notion_access_token cookie
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('notion_access_token='));
      
      if (!tokenCookie) {
        setConnected(false);
        setError('Please connect your Notion account');
        return;
      }
      
      // Verify the token
      const response = await fetch('/api/notion/verify');
      const data = await response.json();
      
      if (response.status !== 200) {
        setConnected(false);
        setError('Connection expired. Please reconnect your Notion account.');
        return;
      }
      
      setConnected(true);
      setError(null);
      
      // Set workspace info if available
      if (data.workspace) {
        setWorkspace(data.workspace);
      }
    } catch (err) {
      setConnected(false);
      setError('Cannot connect to Notion API. Please try reconnecting.');
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
      <div className="notion-header">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 120 126" className="notion-logo" style={{ width: '20px', height: '20px' }}>
              <path d="M 20.6927 21.9315C 24.5836 25.0924 26.0432 24.8512 33.3492 24.3638L 95.3575 21.7126C 96.8171 21.7126 95.8373 20.2405 95.3575 19.9993L 84.8933 12.8824C 83.4338 11.8952 81.4742 10.6708 77.5833 11.1582L 17.5348 14.0515C 15.8392 14.0515 15.5953 14.7766 16.3151 15.2841L 20.6927 21.9315ZM 24.5836 37.529L 24.5836 110.135C 24.5836 114.027 26.5432 115.499 31.1634 115.259L 98.7594 112.366C 103.379 112.126 103.867 109.472 103.867 106.338L 103.867 34.2094C 103.867 31.0755 102.894 29.6034 99.7392 29.8445L 28.7174 32.7379C 25.5627 32.979 24.5836 34.2094 24.5836 37.529ZM 95.3575 41.9013C 95.8373 44.5456 95.3575 47.1958 92.4457 47.4369L 89.0456 47.9244L 89.0456 100.177C 85.8909 102.099 82.9791 103.084 80.5514 103.084C 76.6605 103.084 75.4409 102.099 72.5291 98.9651L 45.5ддддд53 61.995L 45.5553 96.5609C 42.1552 97.5481 38.2644 98.0356 35.3526 98.0356L 35.3526 50.3297C 37.7803 49.3425 40.9351 48.8551 43.8469 48.8551C 47.7378 48.8551 49.2073 49.8423 52.3621 52.9762L 79.0919 89.6879L 79.0919 51.317C 82.2466 50.5739 85.4014 49.8489 88.0714 49.8489L 95.3575 41.9013Z" fill="currentColor"/>
            </svg>
            Notion
          </h2>
          {!connected ? (
            <button
              onClick={() => {
                window.location.href = 'https://api.notion.com/v1/oauth/authorize' +
                  '?client_id=21cd872b-594c-8099-8780-003723f24ccf' +
                  '&response_type=code' +
                  '&owner=user' +
                  '&redirect_uri=' + encodeURIComponent('https://kube.pkc.pub/');
              }}
              className="connect-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
            >
              <svg viewBox="0 0 120 126" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M 20.6927 21.9315C 24.5836 25.0924 26.0432 24.8512 33.3492 24.3638L 95.3575 21.7126C 96.8171 21.7126 95.8373 20.2405 95.3575 19.9993L 84.8933 12.8824C 83.4338 11.8952 81.4742 10.6708 77.5833 11.1582L 17.5348 14.0515C 15.8392 14.0515 15.5953 14.7766 16.3151 15.2841L 20.6927 21.9315ZM 24.5836 37.529L 24.5836 110.135C 24.5836 114.027 26.5432 115.499 31.1634 115.259L 98.7594 112.366C 103.379 112.126 103.867 109.472 103.867 106.338L 103.867 34.2094C 103.867 31.0755 102.894 29.6034 99.7392 29.8445L 28.7174 32.7379C 25.5627 32.979 24.5836 34.2094 24.5836 37.529ZM 95.3575 41.9013C 95.8373 44.5456 95.3575 47.1958 92.4457 47.4369L 89.0456 47.9244L 89.0456 100.177C 85.8909 102.099 82.9791 103.084 80.5514 103.084C 76.6605 103.084 75.4409 102.099 72.5291 98.9651L 45.5553 61.9995L 45.5553 96.5609C 42.1552 97.5481 38.2644 98.0356 35.3526 98.0356L 35.3526 50.3297C 37.7803 49.3425 40.9351 48.8551 43.8469 48.8551C 47.7378 48.8551 49.2073 49.8423 52.3621 52.9762L 79.0919 89.6879L 79.0919 51.317C 82.2466 50.5739 85.4014 49.8489 88.0714 49.8489L 95.3575 41.9013Z"/>
              </svg>
              Connect to Notion
            </button>
          ) : (
            <div className="workspace-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f6f6f6', padding: '6px 12px', borderRadius: '6px' }}>
              {workspace?.icon && (
                <img 
                  src={workspace.icon} 
                  alt={workspace.name} 
                  style={{ width: '20px', height: '20px', borderRadius: '4px' }} 
                />
              )}
              <span style={{ color: '#37352f', fontSize: '14px', fontWeight: '500' }}>{workspace?.name || 'Connected'}</span>
            </div>
          )}
        </div>
        {connected && (
          <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
            Enter a Notion page ID to sync its content. You can find the page ID in the URL when viewing a page in Notion.
          </div>
        )}
      </div>
      
      <div className="controls">
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
                paddingLeft: '32px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: connected ? '#fff' : '#f6f6f6',
                color: connected ? '#37352f' : '#999',
                transition: 'all 0.2s'
              }}
            />
            <svg 
              viewBox="0 0 16 16" 
              style={{ 
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                color: connected ? '#37352f' : '#999'
              }}
            >
              <path 
                d="M7.5 0C11.6355 0 15 3.36446 15 7.5C15 11.6355 11.6355 15 7.5 15C3.36446 15 0 11.6355 0 7.5C0 3.36446 3.36446 0 7.5 0ZM7.5 1.5C4.19289 1.5 1.5 4.19289 1.5 7.5C1.5 10.8071 4.19289 13.5 7.5 13.5C10.8071 13.5 13.5 10.8071 13.5 7.5C13.5 4.19289 10.8071 1.5 7.5 1.5ZM7.5 3C8.32843 3 9 3.67157 9 4.5V6.5H11C11.8284 6.5 12.5 7.17157 12.5 8C12.5 8.82843 11.8284 9.5 11 9.5H9V11.5C9 12.3284 8.32843 13 7.5 13C6.67157 13 6 12.3284 6 11.5V9.5H4C3.17157 9.5 2.5 8.82843 2.5 8C2.5 7.17157 3.17157 6.5 4 6.5H6V4.5C6 3.67157 6.67157 3 7.5 3Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <button
            onClick={() => syncPage(pageId)}
            disabled={loading || !connected}
            className="sync-button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: connected ? '#2ecc71' : '#e0e0e0',
              color: connected ? '#fff' : '#999',
              border: 'none',
              borderRadius: '4px',
              cursor: connected ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            <svg viewBox="0 0 16 16" style={{ width: '14px', height: '14px' }}>
              <path 
                d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5ZM8 4C8.82843 4 9.5 4.67157 9.5 5.5V7.5H11.5C12.3284 7.5 13 8.17157 13 9C13 9.82843 12.3284 10.5 11.5 10.5H9.5V12.5C9.5 13.3284 8.82843 14 8 14C7.17157 14 6.5 13.3284 6.5 12.5V10.5H4.5C3.67157 10.5 3 9.82843 3 9C3 8.17157 3.67157 7.5 4.5 7.5H6.5V5.5C6.5 4.67157 7.17157 4 8 4Z" 
                fill="currentColor"
              />
            </svg>
            {loading ? 'Syncing...' : 'Sync Page'}
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
