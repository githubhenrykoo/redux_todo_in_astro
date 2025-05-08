'use client';

import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../features/themeSlice';
import '../../styles/json-state-updater.css';

/**
 * Simple JSON State Updater Panel
 * Basic functionality to update theme state based on JSON input
 */
const JSONStateUpdaterPanel = () => {
  // Component state
  const [jsonContent, setJsonContent] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);
  
  // Redux
  const dispatch = useDispatch();
  const currentTheme = useSelector(state => state.theme?.mode || 'light');
  const storeState = useSelector(state => state);
  const availableSlices = Object.keys(storeState).filter(key => key !== 'jsonStateUpdater');
  
  // Load JSON content from catalog
  const loadFromCatalog = () => {
    // Check different parts of the Redux store for the selected item
    const selectionSources = [
      // From selectedItem slice
      storeState.selectedItem?.metadata?.hash,
      // From catalog slice - both these patterns exist in different versions
      storeState.catalog?.selectedItem?.hash,
      storeState.catalog?.selectedCardHash,
      // From URL params if present
      new URLSearchParams(window.location.search).get('hash')
    ];
    
    // Find first valid hash from sources
    let hashToUse = selectionSources.find(hash => hash && hash !== 'null' && hash.length > 8);
    
    // Log selection state for debugging
    console.log('Selection state checked:', { 
      sources: selectionSources,
      hashToUse
    });
    
    // If nothing in Redux state, try DOM-based detection
    if (!hashToUse) {
      // Try to extract hash from DOM (does not rely on any specific hash value)
      const detailViewHash = document.querySelector('.detail-view-card-info')?.textContent;
      if (detailViewHash && detailViewHash.includes('Hash: ')) {
        hashToUse = detailViewHash.split('Hash: ')[1].split('\n')[0].trim();
        console.log('Using hash from DetailView DOM:', hashToUse);
      }
    }
    
    if (!hashToUse) {
      setStatusMessage('No item selected in catalog');
      return;
    }
    
    setStatusMessage(`Loading JSON content for ${hashToUse.slice(0, 8)}...`);
    
    // Direct API call to fetch JSON content
    fetch(`/api/card-collection?action=get&hash=${hashToUse}`)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(processCardResponse)
      .catch(handleFetchError);
  };
  
  // Helper function to process the API response
  const processCardResponse = (data) => {
    console.log('API response:', data);
    
    // Extract content from response
    let content = data.content || data.card?.content;
    
    if (!content) {
      throw new Error('No content found in the response');
    }
    
    // Parse content into JSON
    let jsonData;
    
    if (typeof content === 'string') {
      try {
        jsonData = JSON.parse(content);
      } catch (e) {
        // If not valid JSON, create a simple theme object
        jsonData = { theme: { mode: 'light' } };
      }
    } else if (typeof content === 'object') {
      jsonData = content;
    } else {
      jsonData = { theme: { mode: 'light' } };
    }
    
    // Update UI
    const formatted = JSON.stringify(jsonData, null, 2);
    setJsonContent(formatted);
    setParsedJson(jsonData);
    setErrorMessage('');
    setStatusMessage('JSON loaded successfully');
  };
  
  // Helper function to handle fetch errors
  const handleFetchError = (err) => {
    console.error('Error loading JSON:', err);
    setErrorMessage(`Failed to load: ${err.message}`);
    setStatusMessage('');
  };
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Only accept JSON files
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setErrorMessage('Please upload a valid JSON file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const json = JSON.parse(content);
        setJsonContent(JSON.stringify(json, null, 2));
        setParsedJson(json);
        setErrorMessage('');
        setStatusMessage(`Loaded ${file.name}`);
      } catch (error) {
        setErrorMessage(`Invalid JSON: ${error.message}`);
        setParsedJson(null);
      }
    };
    
    reader.onerror = () => setErrorMessage('Error reading file');
    reader.readAsText(file);
    event.target.value = '';
  };
  
  // Apply changes to state
  // Apply the JSON content to state
  const applyJson = () => {
    if (!parsedJson) {
      setErrorMessage('No valid JSON to apply');
      return;
    }

    try {
      // Apply theme if it exists in the JSON
      if (parsedJson.theme?.mode) {
        const desiredTheme = parsedJson.theme.mode;
        
        if (['light', 'dark'].includes(desiredTheme)) {
          // Only toggle if the current theme doesn't match the desired theme
          if (currentTheme !== desiredTheme) {
            // The toggleTheme action doesn't take parameters, it just toggles between light and dark
            dispatch(toggleTheme());
            setStatusMessage(`Theme toggled to ${desiredTheme}`);
          } else {
            setStatusMessage(`Theme is already set to ${desiredTheme}`);
          }
        } else {
          setErrorMessage(`Invalid theme mode: ${desiredTheme}`);
        }
      } else {
        setStatusMessage('No theme data found in JSON');
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    }
  };
  
  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonContent).then(
      () => {
        setStatusMessage('Copied to clipboard');
        setTimeout(() => setStatusMessage(''), 2000);
      },
      (err) => setErrorMessage('Failed to copy')
    );
  };
  
  return (
    <div className="json-state-updater-panel">
      {/* Header */}
      <div className="panel-header">
        <h2>JSON State Updater</h2>
        <div className="header-actions">
          <button 
            className="catalog-btn"
            onClick={loadFromCatalog}
          >
            Load from Catalog
          </button>
          <button 
            className="load-id-btn"
            onClick={() => {
              const hash = prompt('Enter card hash or ID:', '089010167c49c31644f83096285f21ea3fe98b9647cdc6ea307ae696573c6bea');
              if (hash) {
                setStatusMessage(`Loading card with hash: ${hash.slice(0, 8)}...`);
                fetch(`/api/card-collection?action=get&hash=${hash}`)
                  .then(res => res.json())
                  .then(processCardResponse)
                  .catch(handleFetchError);
              }
            }}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              marginLeft: '5px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Load by ID
          </button>
          <button 
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
          >
            Upload JSON
          </button>
          <button
            className="theme-toggle-btn"
            onClick={() => dispatch(toggleTheme())}
            style={{
              backgroundColor: currentTheme === 'dark' ? '#333' : '#f0f0f0',
              color: currentTheme === 'dark' ? '#fff' : '#000',
              border: '1px solid #ccc',
              padding: '5px 10px',
              marginLeft: '5px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Toggle Theme ({currentTheme})
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {/* Status messages */}
      {statusMessage && <div className="status-message success">{statusMessage}</div>}
      {errorMessage && <div className="json-error">{errorMessage}</div>}
      
      {/* JSON editor */}
      <div className="json-input-container">
        <div className="editor-header">
          <h3>JSON Content</h3>
          <div className="editor-actions">
            <button 
              className="copy-btn"
              onClick={copyToClipboard}
              disabled={!jsonContent}
            >
              Copy
            </button>
          </div>
        </div>
        
        <textarea
          className="json-editor"
          value={jsonContent}
          onChange={(e) => {
            const newValue = e.target.value;
            setJsonContent(newValue);
            
            try {
              if (newValue.trim()) {
                const json = JSON.parse(newValue);
                setParsedJson(json);
                setErrorMessage('');
              } else {
                setParsedJson(null);
              }
            } catch (error) {
              setErrorMessage(`Invalid JSON: ${error.message}`);
              setParsedJson(null);
            }
          }}
          placeholder="Paste or upload JSON here..."
        />
      </div>
      
      {/* State info */}
      <div className="state-info-container">
        <h3>Available State Slices</h3>
        <div className="slice-list">
          {availableSlices.map(slice => (
            <div key={slice} className="slice-item">
              {slice}
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="actions-container">
        <button
          className="apply-btn"
          onClick={applyJson}
          disabled={!parsedJson}
        >
          Apply to State
        </button>
      </div>
    </div>
  );
};

export default JSONStateUpdaterPanel;
