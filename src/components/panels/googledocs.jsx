import { useState, useEffect, useCallback } from 'react';

const GoogleDocsPanel = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // To show save status

  const CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;
  const DOC_ID = '1wGsMLmRByn5vi31BTV2VlZztrZJddDlEfNwHnbT2E4I';
  const SCOPES = 'https://www.googleapis.com/auth/documents';

  useEffect(() => {
    // Load Google API script
    const loadGoogleApi = () => {
      const script1 = document.createElement('script');
      script1.src = 'https://accounts.google.com/gsi/client';
      script1.async = true;
      script1.defer = true;
      
      const script2 = document.createElement('script');
      script2.src = 'https://apis.google.com/js/api.js';
      script2.onload = gapiLoaded;
      
      document.body.appendChild(script1);
      document.body.appendChild(script2);
    };

    loadGoogleApi();

    return () => {
      // Cleanup scripts on unmount
      const scripts = document.querySelectorAll('script[src*="google"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  const gapiLoaded = () => {
    window.gapi.load('client', initializeGapiClient);
  };

  const initializeGapiClient = async () => {
    try {
      await window.gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://docs.googleapis.com/$discovery/rest?version=v1"],
      });
      setGapiInited(true);
    } catch (error) {
      console.error('Error initializing GAPI client:', error);
    }
  };

  const handleAuthClick = () => {
    if (!window.google || !gapiInited) return;

    const newTokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (tokenResponse) => {
        await window.gapi.client.setToken(tokenResponse);
        loadGoogleDoc();
      },
    });
    
    setTokenClient(newTokenClient);
    newTokenClient.requestAccessToken();
  };

  const loadGoogleDoc = async () => {
    try {
      const res = await window.gapi.client.docs.documents.get({documentId: DOC_ID});
      const bodyContent = res.result.body.content;
      let fullText = '';
      
      bodyContent.forEach(el => {
        if (el.paragraph) {
          el.paragraph.elements.forEach(e => {
            if (e.textRun && e.textRun.content) {
              fullText += e.textRun.content;
            }
          });
        }
      });
      
      setEditorContent(fullText);
    } catch (error) {
      console.error('Error loading Google Doc:', error);
    }
  };

  const saveToMCardsAndGoogleDoc = async (content) => {
    if (!tokenClient) return;
    
    try {
      setSaveStatus('Saving...');

      // Save to Google Docs
      const doc = await window.gapi.client.docs.documents.get({
        documentId: DOC_ID
      });
      
      const currentLength = doc.result.body.content.reduce((acc, el) => {
        if (el.paragraph) {
          el.paragraph.elements.forEach(e => {
            if (e.textRun && e.textRun.content) {
              acc += e.textRun.content.length;
            }
          });
        }
        return acc;
      }, 0);

      await window.gapi.client.docs.documents.batchUpdate({
        documentId: DOC_ID,
        resource: {
          requests: [
            {
              deleteContentRange: {
                range: {
                  startIndex: 1,
                  endIndex: Math.max(currentLength, 1)
                }
              }
            },
            {
              insertText: {
                location: {
                  index: 1
                },
                text: content || ' '
              }
            }
          ]
        }
      });

      // Save to MCards Catalog
      const response = await fetch('http://localhost:4321/api/card-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add',
          card: {
            content: {
              dimensionType: 'abstractSpecification',
              context: content,
              goal: '',
              successCriteria: ''
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save to MCards Catalog');
      }

      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('Save failed');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    (() => {
      let timeoutId;
      return (content) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          saveToMCardsAndGoogleDoc(content);
        }, 1000);
      };
    })(),
    [tokenClient]
  );

  const handleEditorChange = (e) => {
    const newContent = e.currentTarget.innerText;
    setEditorContent(newContent);
    debouncedSave(newContent);
  };

  return (
    <div className="google-docs-panel" style={{
      maxWidth: '800px',
      margin: '2rem auto',
      padding: '2rem',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        color: '#1a73e8',
        marginBottom: '1.5rem',
        textAlign: 'center',
      }}>Google Docs Editor</h2>
      
      <button 
        onClick={handleAuthClick}
        disabled={!gapiInited}
        style={{
          backgroundColor: !gapiInited ? '#e0e0e0' : '#1a73e8',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '4px',
          fontSize: '1rem',
          cursor: !gapiInited ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '1.5rem',
          transition: 'background-color 0.2s ease',
        }}
      >
        {!gapiInited ? 'Initializing...' : 'Login & Load Document'}
      </button>

      <div
        contentEditable="true"
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          padding: '1rem',
          minHeight: '300px',
          marginBottom: '1rem',
          fontSize: '1rem',
          lineHeight: '1.5',
          backgroundColor: '#fafafa',
          outline: 'none',
          overflowY: 'auto',
          fontFamily: 'Arial, sans-serif',
        }}
        onInput={handleEditorChange}
        dangerouslySetInnerHTML={{ __html: editorContent }}
      />

      <div style={{
        textAlign: 'center',
        fontSize: '0.9rem',
        color: saveStatus === 'Saved' ? '#34a853' : 
               saveStatus === 'Saving...' ? '#1a73e8' : 
               saveStatus === 'Save failed' ? '#ea4335' : '#666',
        height: '20px',
        marginBottom: '1rem',
        transition: 'color 0.2s ease'
      }}>
        {saveStatus}
      </div>
    </div>
  );
};

export default GoogleDocsPanel;