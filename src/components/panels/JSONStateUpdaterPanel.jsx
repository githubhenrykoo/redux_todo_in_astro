import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setLastUploadedJson, 
  addToChangeHistory,
  setUpdateInProgress,
  setLastError 
} from '../../features/jsonStateUpdaterSlice';
// Import theme actions directly
import { toggleTheme } from '../../features/themeSlice';
import '../../styles/json-state-updater.css';

const JSONStateUpdaterPanel = () => {
  const dispatch = useDispatch();
  const [jsonInput, setJsonInput] = useState('');
  const [parsedJson, setParsedJson] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null);
  const fileInputRef = useRef(null);
  
  // Track available store slices
  const storeState = useSelector(state => state);
  const availableSlices = Object.keys(storeState).filter(key => 
    // Filter out the jsonStateUpdater slice itself
    key !== 'jsonStateUpdater'
  );

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Only accept JSON files
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setJsonError('Please upload a valid JSON file');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);
        setJsonInput(JSON.stringify(parsed, null, 2));
        setParsedJson(parsed);
        setJsonError(null);
        setUpdateStatus({ type: 'info', message: 'JSON file loaded. Review before applying to state.' });
        
        // Store in redux
        dispatch(setLastUploadedJson({
          content: parsed,
          fileName: file.name,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        setJsonError(`Invalid JSON format: ${error.message}`);
        setParsedJson(null);
      }
    };
    
    reader.onerror = () => {
      setJsonError('Error reading file');
      setParsedJson(null);
    };
    
    reader.readAsText(file);
    // Reset the file input so the same file can be selected again
    event.target.value = '';
  };

  // Apply the JSON data to update Redux store
  const applyJsonToState = () => {
    if (!parsedJson) {
      setUpdateStatus({ type: 'error', message: 'No valid JSON data to apply' });
      return;
    }

    try {
      dispatch(setUpdateInProgress(true));
      
      // Check if the JSON is structured as a specialized state update
      if (parsedJson.action && parsedJson.target) {
        handleStructuredStateUpdate(parsedJson);
      } else {
        // Default behavior: Assume the JSON is a direct state representation
        handleDirectStateUpdate(parsedJson);
      }
      
      dispatch(setUpdateInProgress(false));
      setUpdateStatus({ type: 'success', message: 'State updated successfully' });
    } catch (error) {
      console.error('Error updating state:', error);
      dispatch(setLastError(error.message));
      dispatch(setUpdateInProgress(false));
      setUpdateStatus({ type: 'error', message: `Failed to update state: ${error.message}` });
    }
  };

  // Handle structured state update with specific actions
  const handleStructuredStateUpdate = (data) => {
    const { action, target, updates, data: stateData } = data;
    
    switch (action) {
      case 'REPLACE_STATE':
        if (!stateData) {
          throw new Error('Missing state data for REPLACE_STATE action');
        }
        
        if (!storeState[target]) {
          throw new Error(`Target state slice "${target}" does not exist`);
        }
        
        // Handle theme slice specially
        if (target === 'theme') {
          // If the theme mode is different, toggle it
          if (stateData.mode && storeState.theme.mode !== stateData.mode) {
            dispatch(toggleTheme());
            setUpdateStatus({
              type: 'success',
              message: `Theme changed to ${stateData.mode} mode`
            });
          }
        }
        
        // Add support for other slices here
        
        dispatch(addToChangeHistory({
          description: `Replaced entire state of "${target}"`,
          targetSlice: target,
          changeType: 'REPLACE'
        }));
        break;
        
      case 'UPDATE_STATE':
        if (!updates || !Array.isArray(updates)) {
          throw new Error('Missing or invalid updates array for UPDATE_STATE action');
        }
        
        if (!storeState[target]) {
          throw new Error(`Target state slice "${target}" does not exist`);
        }
        
        // Handle theme slice specially
        if (target === 'theme') {
          // Look for mode update
          const modeUpdate = updates.find(update => update.path === 'mode');
          if (modeUpdate && ['light', 'dark'].includes(modeUpdate.value)) {
            // If current mode doesn't match the desired mode, toggle it
            if (storeState.theme.mode !== modeUpdate.value) {
              dispatch(toggleTheme());
              setUpdateStatus({
                type: 'success',
                message: `Theme updated to ${modeUpdate.value} mode`
              });
            }
          }
        }
        
        // Add support for other slices here
        
        dispatch(addToChangeHistory({
          description: `Applied ${updates.length} partial updates to "${target}"`,
          targetSlice: target,
          changeType: 'UPDATE'
        }));
        break;
        
      case 'SEQUENCE':
        if (!data.actions || !Array.isArray(data.actions)) {
          throw new Error('Missing or invalid actions array for SEQUENCE action');
        }
        
        // Process each action in sequence
        data.actions.forEach(actionItem => {
          if (actionItem.type === 'theme/toggleTheme') {
            dispatch(toggleTheme());
          }
          // Add handlers for other action types here
        });
        
        setUpdateStatus({
          type: 'success',
          message: `Applied sequence of ${data.actions.length} actions`
        });
        
        dispatch(addToChangeHistory({
          description: `Applied sequence of ${data.actions.length} actions`,
          targetSlice: 'multiple',
          changeType: 'SEQUENCE'
        }));
        break;
        
      default:
        throw new Error(`Unknown action type: ${action}`);
    }
  };

  // Handle direct state update (JSON is treated as a direct state representation)
  const handleDirectStateUpdate = (data) => {
    // Validate that we're updating valid slices
    Object.keys(data).forEach(sliceKey => {
      if (!storeState[sliceKey]) {
        throw new Error(`Cannot update non-existent state slice: ${sliceKey}`);
      }
    });
    
    // Get list of slices we're updating
    const slicesToUpdate = Object.keys(data);
    console.log(`Updating these state slices:`, slicesToUpdate);
    
    // Apply updates to each slice using appropriate actions
    slicesToUpdate.forEach(sliceKey => {
      const sliceData = data[sliceKey];
      
      // Handle theme slice updates explicitly
      if (sliceKey === 'theme') {
        // If the theme mode is specified, update it directly
        if (sliceData.mode && ['light', 'dark'].includes(sliceData.mode)) {
          // If current theme mode doesn't match desired mode, toggle it
          if (storeState.theme.mode !== sliceData.mode) {
            dispatch(toggleTheme());
          }
          
          setUpdateStatus({
            type: 'success',
            message: `Theme changed to ${sliceData.mode} mode`
          });
        }
      }
      
      // Handle other slices here as needed
      // For example:
      // if (sliceKey === 'todos') { ... }
    });
    
    // Record the changes
    dispatch(addToChangeHistory({
      description: `Updated state slices: ${slicesToUpdate.join(', ')}`,
      targetSlice: slicesToUpdate.join(', '),
      changeType: 'DIRECT_UPDATE'
    }));
  };

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonInput).then(
      () => {
        setUpdateStatus({ type: 'info', message: 'Copied to clipboard' });
        setTimeout(() => setUpdateStatus(null), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        setUpdateStatus({ type: 'error', message: 'Failed to copy to clipboard' });
      }
    );
  };

  return (
    <div className="json-state-updater-panel">
      <div className="panel-header">
        <h2>JSON State Updater</h2>
        <div className="header-actions">
          <button 
            className="upload-btn"
            onClick={() => fileInputRef.current.click()}
            title="Upload JSON File"
          >
            Upload JSON
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
      
      {updateStatus && (
        <div className={`status-message ${updateStatus.type}`}>
          {updateStatus.message}
        </div>
      )}
      
      <div className="json-input-container">
        <div className="editor-header">
          <h3>JSON Content</h3>
          <div className="editor-actions">
            <button 
              className="copy-btn"
              onClick={copyToClipboard}
              disabled={!jsonInput}
              title="Copy to Clipboard"
            >
              Copy
            </button>
          </div>
        </div>
        
        <textarea
          className="json-editor"
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value);
            try {
              if (e.target.value.trim()) {
                const parsed = JSON.parse(e.target.value);
                setParsedJson(parsed);
                setJsonError(null);
              } else {
                setParsedJson(null);
              }
            } catch (error) {
              setJsonError(`Invalid JSON: ${error.message}`);
              setParsedJson(null);
            }
          }}
          placeholder="Paste or upload JSON here..."
        />
        
        {jsonError && <div className="json-error">{jsonError}</div>}
      </div>
      
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
      
      <div className="actions-container">
        <button
          className="apply-btn"
          onClick={applyJsonToState}
          disabled={!parsedJson || jsonError}
        >
          Apply to State
        </button>
      </div>
    </div>
  );
};

export default JSONStateUpdaterPanel;
