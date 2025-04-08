import React, { useRef, useState } from 'react';

/**
 * Form component for adding new items to the catalog
 */
const AddItemForm = ({ 
  loading, 
  error, 
  onSubmit, 
  onCancel 
}) => {
  // Form state
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    contentType: 'text/plain',
    file: null
  });
  
  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef(null);
  
  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewItem({
        ...newItem,
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        file: file
      });
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
  };
  
  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if leaving the drop zone itself, not its children
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0]; // Take only the first file if multiple are dropped
      setNewItem({
        ...newItem,
        name: file.name,
        contentType: file.type || 'application/octet-stream',
        file: file
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newItem.name) {
      alert('Please provide a name for the new item');
      return;
    }
    
    if (!newItem.file && !newItem.description) {
      alert('Please provide content to add');
      return;
    }
    
    onSubmit(newItem);
  };
  
  return (
    <form onSubmit={handleSubmit} className="catalog-form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={newItem.name}
          onChange={handleInputChange}
          placeholder="Item name (optional for text content)"
        />
      </div>
      
      <div 
        className={`form-group drop-zone ${isDragging ? 'dropping' : ''}`}
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label htmlFor="file">
          {isDragging 
            ? "Drop file here" 
            : (newItem.file 
              ? `Selected: ${newItem.file.name}` 
              : "Drag & drop a file here, or click to browse")}
        </label>
        <input
          type="file"
          id="file"
          onChange={handleFileChange}
          style={{ opacity: newItem.file ? 0 : 0.01 }}
        />
        {!newItem.file && <div className="drop-icon">📁</div>}
        {newItem.file && (
          <div className="file-info">
            <span className="file-name">{newItem.file.name}</span>
            <span className="file-size">({Math.round(newItem.file.size / 1024)} KB)</span>
            <button 
              type="button" 
              className="btn-clear-file"
              onClick={() => {
                setNewItem({...newItem, file: null});
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Text Content (if not uploading a file)</label>
        <textarea
          id="description"
          name="description"
          value={newItem.description}
          onChange={handleInputChange}
          rows="6"
          placeholder="Enter text content here"
          disabled={!!newItem.file}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Uploading...' : (newItem.file ? 'Upload File' : 'Add Content')}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddItemForm;
