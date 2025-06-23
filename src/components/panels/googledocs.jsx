import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';

const GoogleDocsPanel = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [pickerInited, setPickerInited] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [docUrlInput, setDocUrlInput] = useState('');
  // Removed sync-related state variables

  // Removed text formatting functions and toolbar

  const CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.GOOGLE_API_KEY;
  const SCOPES = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.readonly';

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
      
      // Add Google Picker API script
      const script3 = document.createElement('script');
      script3.src = 'https://apis.google.com/js/platform.js';
      script3.onload = () => setPickerInited(true);
      
      document.body.appendChild(script1);
      document.body.appendChild(script2);
      document.body.appendChild(script3);
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
        // After successful authentication, don't automatically open picker
        // Let user choose between picker and URL input
      },
    });
    
    setTokenClient(newTokenClient);
    newTokenClient.requestAccessToken();
  };
  
  // Toggle URL input visibility
  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
    setDocUrlInput('');
  };
  
  // Extract document ID from Google Docs URL
  const extractDocIdFromUrl = (url) => {
    try {
      // Handle different Google Docs URL formats
      const patterns = [
        /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)(\/|$)/,  // Standard format
        /https:\/\/docs\.google\.com\/document\/u\/\d+\/d\/([a-zA-Z0-9_-]+)(\/|$)/,  // User-specific format
        /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,  // Drive link format
        /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(\/|$)/  // Drive file format
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      throw new Error('Invalid Google Docs URL format');
    } catch (error) {
      console.error('Error extracting document ID:', error);
      return null;
    }
  };
  
  // Handle URL submission
  const handleUrlSubmit = () => {
    if (!docUrlInput.trim()) {
      setSaveStatus('Please enter a valid Google Docs URL');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    
    const docId = extractDocIdFromUrl(docUrlInput.trim());
    if (!docId) {
      setSaveStatus('Invalid Google Docs URL');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    
    setSelectedDocId(docId);
    // Load the markdown version directly from export URL
    loadMarkdownVersion(docId);
    setShowUrlInput(false);
  };
  
  // Create and render a Google Picker
  const createPicker = () => {
    if (!window.google || !pickerInited || !tokenClient) {
      console.error('Google Picker API not loaded or user not authenticated');
      return;
    }
    
    // Hide URL input if shown
    setShowUrlInput(false);
    
    // Load the picker API
    window.gapi.load('picker', () => {
      const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
      view.setMimeTypes('application/vnd.google-apps.document');
      
      const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setAppId(CLIENT_ID.split('-')[0])
        .setOAuthToken(window.gapi.client.getToken().access_token)
        .addView(view)
        .setTitle('Select a Google Document')
        .setCallback(pickerCallback)
        .build();
        
      picker.setVisible(true);
    });
  };
  
  const pickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const document = data.docs[0];
      const docId = document.id;
      setSelectedDocId(docId);
      // Load the markdown version directly from export URL
      loadMarkdownVersion(docId);
    }
  };

  // All other load functions removed - only using direct markdown export

  // Save functionality removed - no longer syncing with Google Docs or MCards

  // Debounced save function removed

  const handleEditorChange = (e) => {
    const content = e.currentTarget;
    
    // Ensure proper list formatting
    const lists = content.querySelectorAll('ol, ul');
    lists.forEach(list => {
      list.style.paddingLeft = '40px';
      list.style.margin = '0';
      
      const items = list.querySelectorAll('li');
      items.forEach(item => {
        item.style.marginBottom = '0.25em';
        if (list.nodeName === 'OL') {
          item.style.listStyleType = 'decimal';
        } else {
          item.style.listStyleType = 'disc';
        }
      });
    });

    const newContent = content.innerHTML;
    setEditorContent(newContent);
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  // Update the renderMarkdown function to allow HTML and handle Google Docs image references
  const renderMarkdown = (content) => {
    try {
      marked.setOptions({
        headerIds: true,
        mangle: false,
        headerPrefix: '',
        breaks: true,
        gfm: true,
        xhtml: true,
        smartLists: true,
        smartypants: true
      });

      // Extract image references from the content
      // Google Docs exports images in format: ![][imageN] followed by [imageN]: <data:image/...> or URL
      const imageReferences = {};
      const imageRefRegex = /\[([^\]]+)\]:\s*<?([^>\s]+)>?/g;
      let match;
      
      // Find all image references and store them in a map
      while ((match = imageRefRegex.exec(content)) !== null) {
        const refName = match[1];
        const refUrl = match[2];
        imageReferences[refName] = refUrl;
      }
      
      // Pre-process the content to handle special cases
      let processedContent = content
        // Handle bold with double asterisks
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Handle italic with single asterisks
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Handle bold+italic with triple asterisks
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        // Handle escaped characters
        .replace(/\\([\*\\])/g, '$1')
        // Replace image references with direct img tags for better rendering
        .replace(/!\[([^\]]*)\]\[([^\]]+)\]/g, (match, alt, refName) => {
          if (imageReferences[refName]) {
            return `<img src="${imageReferences[refName]}" alt="${alt || refName}" style="max-width: 100%;" />`;
          }
          return match; // Keep original if reference not found
        });

      const html = marked(processedContent);
      
      // Add custom styles for headings to ensure proper sizing
      const styledHtml = html
        .replace(/<h1>/g, '<h1 style="font-size: 24pt; font-weight: 500; margin-top: 24px; margin-bottom: 8px;">')
        .replace(/<h2>/g, '<h2 style="font-size: 18pt; font-weight: 500; margin-top: 20px; margin-bottom: 6px;">')
        .replace(/<h3>/g, '<h3 style="font-size: 16pt; font-weight: 500; margin-top: 16px; margin-bottom: 4px;">')
        .replace(/<h4>/g, '<h4 style="font-size: 14pt; font-weight: 500; margin-top: 14px; margin-bottom: 4px;">')
        .replace(/<h5>/g, '<h5 style="font-size: 12pt; font-weight: 500; margin-top: 12px; margin-bottom: 4px;">')
        .replace(/<h6>/g, '<h6 style="font-size: 11pt; font-weight: 500; margin-top: 12px; margin-bottom: 4px;">');
      
      return { __html: styledHtml };
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return { __html: content };
    }
  };
  
  // Update the preview div styles to better handle markdown content
  <div
    className="markdown-preview"
    style={{
      width: '816px',
      minHeight: '1056px',
      margin: '0 auto',
      padding: '96px 72px',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
      fontSize: '11pt',
      lineHeight: 1.5,
      color: '#202124',
      fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
    }}
    dangerouslySetInnerHTML={renderMarkdown(editorContent)}
  />

  const handleExportMarkdown = () => {
    // Use Google Docs direct export URL for Markdown format
    if (!selectedDocId) {
      console.error('No document ID available');
      setSaveStatus('Export failed: No document ID');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    
    // Create the  export URL using the direct Google Docs export endpoint
    const exportUrl = `https://docs.google.com/document/d/${selectedDocId}/export?format=md`;
    
    try {
      // Open the URL in a new tab to trigger download
      window.open(exportUrl, '_blank');
      
      setSaveStatus('Exported as Markdown');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error exporting document:', error);
      setSaveStatus('Export failed');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };
  
  // Function to load the markdown version of a Google Doc
  const loadMarkdownVersion = async (docId) => {
    try {
      if (!docId) {
        console.error('No document ID provided');
        return;
      }
      
      setSaveStatus('Loading markdown version...');
      
      // First try direct export URL
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=md`;
      
      try {
        const response = await fetch(exportUrl);
        if (response.ok) {
          const mdContent = await response.text();
          setEditorContent(mdContent);
          setSaveStatus('Markdown loaded');
          setTimeout(() => setSaveStatus(''), 2000);
          return mdContent;
        }
      } catch (exportError) {
        console.log('Direct export failed, trying OAuth...', exportError);
      }
      
      // If direct export fails, try OAuth
      if (!window.gapi?.client) {
        setSaveStatus('Initializing Google API...');
        await new Promise((resolve) => window.gapi.load('client', resolve));
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ["https://docs.googleapis.com/$discovery/rest?version=v1"],
        });
      }

      // Check if we have a valid token
      if (!window.gapi.client.getToken()) {
        setSaveStatus('Authentication required');
        if (!tokenClient) {
          const newTokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse) => {
              await window.gapi.client.setToken(tokenResponse);
              // After authentication, retry loading
              await loadMarkdownVersion(docId);
            },
          });
          setTokenClient(newTokenClient);
          newTokenClient.requestAccessToken();
          return;
        } else {
          tokenClient.requestAccessToken();
          return;
        }
      }

      // Fetch document content using Google Docs API
      const response = await window.gapi.client.docs.documents.get({
        documentId: docId
      });

      // Convert Google Docs content to markdown
      let markdown = '';
      const doc = response.result;
      const content = doc.body.content;

      content.forEach(element => {
        if (element.paragraph) {
          const paragraph = element.paragraph;
          let text = '';
          
          paragraph.elements.forEach(elem => {
            if (elem.textRun) {
              const style = elem.textRun.textStyle || {};
              let formattedText = elem.textRun.content;

              if (style.bold) formattedText = `**${formattedText}**`;
              if (style.italic) formattedText = `*${formattedText}*`;
              
              text += formattedText;
            }
          });

          // Handle different paragraph styles
          if (paragraph.paragraphStyle?.namedStyleType?.includes('HEADING')) {
            const level = parseInt(paragraph.paragraphStyle.namedStyleType.slice(-1));
            text = '#'.repeat(level) + ' ' + text;
          }

          markdown += text + (text.endsWith('\n') ? '' : '\n');
        }
      });

      setEditorContent(markdown);
      setSaveStatus('Document loaded via API');
      setTimeout(() => setSaveStatus(''), 2000);
      return markdown;

    } catch (error) {
      console.error('Error loading document:', error);
      setSaveStatus('Failed to load document');
      setTimeout(() => setSaveStatus(''), 2000);
      return null;
    }
  };

  return (
    <div className="google-docs-panel" style={{
      maxWidth: '850px',
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!tokenClient && (
            <button 
              onClick={handleAuthClick}
              disabled={!gapiInited}
              style={{
                backgroundColor: !gapiInited ? '#e0e0e0' : '#1a73e8',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: !gapiInited ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            >
              {!gapiInited ? 'Sign in with Google' : 'Sign in with Google'}
            </button>
          )}
          {tokenClient && !selectedDocId && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {!showUrlInput ? (
                <>
                  <button
                    onClick={createPicker}
                    style={{
                      backgroundColor: '#f1f3f4',
                      color: '#5f6368',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    Select Document
                  </button>
                  <button
                    onClick={toggleUrlInput}
                    style={{
                      backgroundColor: '#f1f3f4',
                      color: '#5f6368',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    Open via Link
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    value={docUrlInput}
                    onChange={(e) => setDocUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      width: '300px',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUrlSubmit();
                    }}
                  />
                  <button
                    onClick={handleUrlSubmit}
                    style={{
                      backgroundColor: '#1a73e8',
                      color: '#ffffff',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Open
                  </button>
                  <button
                    onClick={toggleUrlInput}
                    style={{
                      backgroundColor: '#f1f3f4',
                      color: '#5f6368',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {selectedDocId && (
            <span style={{ fontSize: '14px', color: '#5f6368' }}>
              Document selected
            </span>
          )}
        </div>
        
        {/* Moved buttons to the right */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {tokenClient && selectedDocId && (
            <>
              <button
                onClick={createPicker}
                style={{
                  backgroundColor: '#f1f3f4',
                  color: '#5f6368',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginRight: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                Change Document
              </button>
              <button
                onClick={togglePreview}
                style={{
                  backgroundColor: isPreview ? '#34a853' : '#f1f3f4',
                  color: isPreview ? '#ffffff' : '#5f6368',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isPreview ? 'Markdown' : 'Preview'}
              </button>
              
              <button
                onClick={handleExportMarkdown}
                style={{
                  backgroundColor: '#34a853',
                  color: '#ffffff',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title="Export document as Markdown using Google Docs export"
              >
                Export
              </button>
              <button
                onClick={() => loadMarkdownVersion(selectedDocId)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh events"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span className="sr-only">Refresh</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        padding: '40px 0',
        backgroundColor: '#f8f9fa',
      }}>
        {isPreview ? (
          <div
            className="markdown-preview"
            style={{
              width: '816px',
              minHeight: '1056px',
              margin: '0 auto',
              padding: '96px 72px',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
              fontSize: '11pt',
              lineHeight: 1.5,
              color: '#202124',
              fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
            }}
            dangerouslySetInnerHTML={renderMarkdown(editorContent)}
          />
        ) : (
          <div style={{ width: '816px', margin: '0 auto' }}>
            {/* Toolbar removed */}
            <div
              contentEditable="true"
              style={{
                minHeight: '1056px',
                padding: '96px 72px',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                outline: 'none',
                fontSize: '11pt',
                lineHeight: '1.15',
                color: 'rgb(32, 33, 36)',
                fontFamily: '"docs-Roboto", Helvetica, Arial, sans-serif',
                letterSpacing: 'normal',
                fontWeight: 400,
                wordSpacing: 'normal',
                textAlign: 'left',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
              onInput={handleEditorChange}
              onKeyDown={handleKeyDown}
              spellCheck="true"
              dangerouslySetInnerHTML={{ __html: editorContent }}
            />
          </div>
        )}
      </div>

      {saveStatus && (
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          padding: '8px 12px',
          borderRadius: '4px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          color: saveStatus.includes('Error') || saveStatus.includes('failed') ? '#ea4335' : 
                 saveStatus.includes('loaded') || saveStatus.includes('Exported') ? '#34a853' : '#1a73e8',
          fontSize: '13px',
          transition: 'all 0.2s ease',
        }}>
          {saveStatus}
        </div>
      )}
    </div>
  );
};

export default GoogleDocsPanel;

// Add this CSS to style the numbered lists and headings like Google Docs
const editorStyles = {
  '.editor-content ol': {
    listStyleType: 'decimal',
    marginLeft: '40px',
    paddingLeft: '0',
    lineHeight: '1.5',
  },
  '.editor-content ol li': {
    padding: '4px 0',
    color: '#202124',
    fontSize: '11pt',
    fontFamily: '"Google Sans", Roboto, Arial, sans-serif',
  },
  '.editor-content ol ol': {
    listStyleType: 'lower-alpha',
  },
  '.editor-content ol ol ol': {
    listStyleType: 'lower-roman',
  }
};

// Update the editor container to include the styles
const renderEditor = () => (
  <div
    className="editor-content"
    contentEditable
    style={{
      minHeight: '200px',
      padding: '20px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      outline: 'none',
      backgroundColor: '#ffffff',
      ...editorStyles
    }}
    onInput={(e) => handleEditorChange(e)}
    dangerouslySetInnerHTML={{ __html: editorContent }}
  />
);

// Add this function to handle list indentation
const handleKeyDown = (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) {
      document.execCommand('outdent', false, null);
    } else {
      document.execCommand('indent', false, null);
    }
  }
};
