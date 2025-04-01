import React, { useRef, useState } from 'react';

const FileUploader = ({ onFileSelected, className = '' }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [fileInfo, setFileInfo] = useState(null);

  // Handle click on the uploader area
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection from input
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileInfo({
      name: file.name,
      type: file.type,
      size: formatFileSize(file.size)
    });
    
    // Pass the raw file to the parent component
    onFileSelected(file);
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileInfo({
        name: file.name,
        type: file.type,
        size: formatFileSize(file.size)
      });
      
      // Pass the raw file to the parent component
      onFileSelected(file);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };

  return (
    <div 
      className={`w-full ${className}`}
      onDragEnter={handleDrag}
    >
      <div 
        className={`
          flex flex-col items-center justify-center 
          p-6 border-2 border-dashed rounded-lg 
          cursor-pointer transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'}
        `}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-2">📁</div>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Any file type supported
        </p>
        
        {fileInfo && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 w-full rounded text-sm">
            <p><strong>Selected file:</strong> {fileInfo.name}</p>
            <p><strong>Type:</strong> {fileInfo.type}</p>
            <p><strong>Size:</strong> {fileInfo.size}</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />
    </div>
  );
};

export default FileUploader;
