import { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';

const GoogleDocsPanel = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Add text formatting functions
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const renderToolbar = () => (
    <div style={{
      padding: '8px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      gap: '4px',
      backgroundColor: '#ffffff',
    }}>
      <button
        onClick={() => formatText('bold')}
        style={{
          padding: '4px 8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          background: 'none',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >B</button>
      <button
        onClick={() => formatText('italic')}
        style={{
          padding: '4px 8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          background: 'none',
          cursor: 'pointer',
          fontStyle: 'italic',
        }}
      >I</button>
      <button
        onClick={() => formatText('underline')}
        style={{
          padding: '4px 8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          background: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >U</button>
      <button
        onClick={() => formatText('insertOrderedList')}
        style={{
          padding: '4px 8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          background: 'none',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        title="Numbered list"
      >
        <span style={{ fontFamily: 'Arial' }}>1.</span>
      </button>
      <button
        onClick={() => formatText('insertUnorderedList')}
        style={{
          padding: '4px 8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          background: 'none',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        title="Bullet list"
      >
        •
      </button>
    </div>
  );

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
      let formattedText = '';
      
      bodyContent.forEach(el => {
        if (el.paragraph) {
          // Handle paragraph styles
          const style = el.paragraph.paragraphStyle;
          const alignment = style?.alignment?.toLowerCase() || 'start';
          
          // Handle lists
          if (el.paragraph.bullet) {
            const nesting = el.paragraph.bullet.nestingLevel || 0;
            const indent = '  '.repeat(nesting);
            const isOrdered = el.paragraph.bullet.listId && el.paragraph.bullet.textStyle;
            formattedText += `${indent}${isOrdered ? '1. ' : '- '}`;
          }
      
          // Handle paragraph styles for headings
          if (style?.namedStyleType) {
            switch (style.namedStyleType) {
              case 'HEADING_1': formattedText += '# '; break;
              case 'HEADING_2': formattedText += '## '; break;
              case 'HEADING_3': formattedText += '### '; break;
              case 'HEADING_4': formattedText += '#### '; break;
              case 'HEADING_5': formattedText += '##### '; break;
              case 'HEADING_6': formattedText += '###### '; break;
            }
          }
      
          // Process each text element in the paragraph
          el.paragraph.elements.forEach(e => {
            if (e.textRun) {
              let text = e.textRun.content;
              const textStyle = e.textRun.textStyle;
      
              // Apply text styling
              if (textStyle) {
                // Handle code blocks
                if (textStyle.backgroundColor) {
                  text = `\`${text.trim()}\``;
                }
      
                // Handle strikethrough
                if (textStyle.strikethrough) {
                  text = `~~${text.trim()}~~`;
                }
      
                // Handle superscript
                if (textStyle.baselineOffset === 'SUPERSCRIPT') {
                  text = `<sup>${text.trim()}</sup>`;
                }
      
                // Handle subscript
                if (textStyle.baselineOffset === 'SUBSCRIPT') {
                  text = `<sub>${text.trim()}</sub>`;
                }
      
                // Handle bold
                if (textStyle.bold) {
                  text = `**${text.trim()}**`;
                }
      
                // Handle italic
                if (textStyle.italic) {
                  text = `_${text.trim()}_`;
                }
      
                // Handle underline
                if (textStyle.underline) {
                  text = `<u>${text.trim()}</u>`;
                }
      
                // Handle links
                if (textStyle.link) {
                  text = `[${text.trim()}](${textStyle.link.url})`;
                }
      
                // Handle foreground color
                if (textStyle.foregroundColor?.color) {
                  const color = textStyle.foregroundColor.color.rgbColor;
                  if (color) {
                    const rgb = `rgb(${Math.round(color.red * 255)}, ${Math.round(color.green * 255)}, ${Math.round(color.blue * 255)})`;
                    text = `<span style="color: ${rgb}">${text.trim()}</span>`;
                  }
                }
      
                // Handle font size
                if (textStyle.fontSize) {
                  const size = textStyle.fontSize.magnitude;
                  text = `<span style="font-size: ${size}pt">${text.trim()}</span>`;
                }
      
                // Handle font family
                if (textStyle.fontFamily) {
                  text = `<span style="font-family: ${textStyle.fontFamily}">${text.trim()}</span>`;
                }
              }
              formattedText += text;
            }
      
            // Handle images
            if (e.inlineObjectElement) {
              const objectId = e.inlineObjectElement.inlineObjectId;
              const object = res.result.inlineObjects[objectId];
              if (object?.inlineObjectProperties?.embeddedObject?.imageProperties) {
                const imageUrl = object.inlineObjectProperties.embeddedObject.imageProperties.contentUri;
                formattedText += `![image](${imageUrl})`;
              }
            }
          });
      
          // Handle text alignment
          if (alignment !== 'start') {
            formattedText = `<div style="text-align: ${alignment}">${formattedText.trim()}</div>`;
          }
      
          formattedText += '\n\n'; // Add newlines after each paragraph
        }
      
      // Handle tables
      if (el.table) {
        const rows = el.table.tableRows;
        const headerRow = rows[0];
        
        // Create table header
        formattedText += '|';
        headerRow.tableCells.forEach(cell => {
          formattedText += ` ${cell.content[0].paragraph.elements[0].textRun.content.trim()} |`;
        });
        formattedText += '\n|';
        
        // Add separator row
        headerRow.tableCells.forEach(() => {
          formattedText += ' --- |';
        });
        formattedText += '\n';
        
        // Add table content
        rows.slice(1).forEach(row => {
          formattedText += '|';
          row.tableCells.forEach(cell => {
            formattedText += ` ${cell.content[0].paragraph.elements[0].textRun.content.trim()} |`;
          });
          formattedText += '\n';
        });
        
        formattedText += '\n';
      }
    });
    
      setEditorContent(formattedText);

      // Send initial request to card collection API after loading document
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
              context: fullText,
              goal: '',
              successCriteria: ''
            }
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to sync with card collection');
      }

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
    debouncedSave(newContent);
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  // Update the renderMarkdown function to allow HTML
  // Update the renderMarkdown function to properly handle all markdown elements
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
  
      // Pre-process the content to handle special cases
      let processedContent = content
      // Handle bold with double asterisks
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Handle italic with single asterisks
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Handle bold+italic with triple asterisks
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      // Handle escaped characters
      .replace(/\\([\*\\])/g, '$1');
  
      const html = marked(processedContent);
      return { __html: html };
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
    // Get the raw content and ensure it's properly formatted as markdown
    const markdownContent = editorContent
      // Convert HTML tags to markdown
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<u>(.*?)<\/u>/g, '_$1_')
      .replace(/<sup>(.*?)<\/sup>/g, '^$1')
      .replace(/<sub>(.*?)<\/sub>/g, '~$1')
      .replace(/<strike>(.*?)<\/strike>/g, '~~$1~~')
      .replace(/<del>(.*?)<\/del>/g, '~~$1~~')
      // Convert span styles to markdown where possible
      .replace(/<span style="color:.*?">(.*?)<\/span>/g, '$1')
      .replace(/<span style="font-size:.*?">(.*?)<\/span>/g, '$1')
      .replace(/<span style="font-family:.*?">(.*?)<\/span>/g, '$1')
      // Convert div alignments to markdown
      .replace(/<div style="text-align: center">(.*?)<\/div>/g, '\n\n<center>$1</center>\n\n')
      .replace(/<div style="text-align: right">(.*?)<\/div>/g, '\n\n<right>$1</right>\n\n')
      // Clean up any remaining HTML tags
      .replace(/<\/?[^>]+(>|$)/g, '')
      // Fix double spaces and lines
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <h2 style={{
          fontSize: '18px',
          color: '#202124',
          margin: 0,
          fontWeight: 400,
        }}>Untitled document</h2>
        
        <div style={{ display: 'flex', gap: '8px' }}>
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
            {!gapiInited ? 'Initializing...' : 'Login & Load Document'}
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
          >
            Export Markdown
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
            {isPreview ? 'Edit' : 'Preview'}
          </button>
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
            {renderToolbar()}
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
              dangerouslySetInnerHTML={{ __html: editorContent }}
            />
          </div>
        )}
      </div>

      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        padding: '8px 12px',
        borderRadius: '4px',
        backgroundColor: saveStatus ? '#ffffff' : 'transparent',
        boxShadow: saveStatus ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
        color: saveStatus === 'Saved' ? '#34a853' : 
               saveStatus === 'Saving...' ? '#1a73e8' : 
               saveStatus === 'Save failed' ? '#ea4335' : 'transparent',
        fontSize: '13px',
        transition: 'all 0.2s ease',
      }}>
        {saveStatus}
      </div>
    </div>
  );
};

export default GoogleDocsPanel;

// Add this CSS to style the numbered lists like Google Docs
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
