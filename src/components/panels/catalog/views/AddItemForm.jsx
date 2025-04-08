import React, { useRef, useState } from 'react';
import { DEFAULT_CONTENT_TYPES } from '../utils/contentTypeUtils';

/**
 * AddItemForm component for adding new items to the catalog
 */
const AddItemForm = ({ onSubmit, onCancel, isLoading, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contentType: DEFAULT_CONTENT_TYPES.TEXT,
    file: null
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        name: file.name,
        contentType: file.type || DEFAULT_CONTENT_TYPES.BINARY,
        file: file
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please provide a name for the new item');
      return;
    }
    
    onSubmit(formData);
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
      setFormData({
        ...formData,
        name: file.name,
        contentType: file.type || DEFAULT_CONTENT_TYPES.BINARY,
        file: file
      });
    }
  };

  // Clear file selection
  const handleClearFile = () => {
    setFormData({
      ...formData,
      file: null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="catalog-form">
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
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
            : (formData.file 
              ? `Selected: ${formData.file.name}` 
              : "Drag & drop a file here, or click to browse")}
        </label>
        <input
          type="file"
          id="file"
          onChange={handleFileChange}
          style={{ opacity: formData.file ? 0 : 0.01 }}
        />
        {!formData.file && <div className="drop-icon">📁</div>}
        {formData.file && (
          <div className="file-info">
            <span className="file-name">{formData.file.name}</span>
            <span className="file-size">({Math.round(formData.file.size / 1024)} KB)</span>
            <button 
              type="button" 
              className="btn-clear-file"
              onClick={handleClearFile}
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
          value={formData.description}
          onChange={handleInputChange}
          rows="6"
          placeholder="Enter text content here"
          disabled={!!formData.file}
        />
      </div>
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Uploading...' : (formData.file ? 'Upload File' : 'Add Content')}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddItemForm;
