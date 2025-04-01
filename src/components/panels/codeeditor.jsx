import React, { useState, useEffect, useRef } from 'react';

const CodeEditorPanel = ({ className = '' }) => {
  const [content, setContent] = useState('...');
  const [fileName, setFileName] = useState('untitled.txt');
  const [isSaved, setIsSaved] = useState(true);
  const [theme, setTheme] = useState('dark'); // dark or light
  const editorRef = useRef(null);
  const [currentDirectory, setCurrentDirectory] = useState(null);
  const [directoryHandle, setDirectoryHandle] = useState(null);
  const [fileHandles, setFileHandles] = useState({});
  const [isFileSystemSupported, setIsFileSystemSupported] = useState(false);
  // Add cursor position state here
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  
  // Check if File System Access API is supported
  useEffect(() => {
    setIsFileSystemSupported('showDirectoryPicker' in window);
  }, []);
  
  // Handle content changes
  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsSaved(false);
  };
  
  // Handle cursor position changes
  const handleCursorChange = (e) => {
    const textarea = e.target;
    const value = textarea.value;
    
    const selectionStart = textarea.selectionStart;
    let line = 1;
    let column = 1;
    
    for (let i = 0; i < selectionStart; i++) {
      if (value[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    setCursorPosition({ line, column });
  };
  
  // Handle file name changes
  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
    setIsSaved(false);
  };
  
  // Save content to localStorage
  const saveContent = async () => {
    try {
      // If we have a file handle for this file, save to the file system
      if (fileHandles[fileName]) {
        const fileHandle = fileHandles[fileName];
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      } else {
        // Otherwise save to localStorage
        localStorage.setItem(`codeeditor-${fileName}`, content);
        
        // Update file list
        const fileList = JSON.parse(localStorage.getItem('codeeditor-files') || '[]');
        if (!fileList.includes(fileName)) {
          fileList.push(fileName);
          localStorage.setItem('codeeditor-files', JSON.stringify(fileList));
        }
      }
      
      setIsSaved(true);
    } catch (err) {
      console.error('Error saving file:', err);
    }
  };
  
  // Load content from localStorage
  const loadContent = async (name, fileHandle = null) => {
    try {
      if (fileHandle) {
        // Load from file system
        const file = await fileHandle.getFile();
        const text = await file.text();
        setContent(text);
        setFileName(file.name);
        
        // Store the file handle for future saves
        setFileHandles(prev => ({
          ...prev,
          [file.name]: fileHandle
        }));
      } else {
        // Load from localStorage
        const savedContent = localStorage.getItem(`codeeditor-${name}`);
        if (savedContent) {
          setContent(savedContent);
          setFileName(name);
        }
      }
      setIsSaved(true);
    } catch (err) {
      console.error('Error loading file:', err);
    }
  };
  
  // Create a new file
  const createNewFile = () => {
    if (!isSaved) {
      if (!confirm('You have unsaved changes. Create new file anyway?')) {
        return;
      }
    }
    
    setContent('...');
    setFileName('untitled.txt');
    setIsSaved(true);
  };
  
  // Open directory
  const openDirectory = async () => {
    if (!isFileSystemSupported) {
      alert('File System Access API is not supported in your browser.');
      return;
    }
    
    try {
      const dirHandle = await window.showDirectoryPicker();
      setDirectoryHandle(dirHandle);
      setCurrentDirectory(dirHandle.name);
      
      // Clear existing file handles when opening a new directory
      setFileHandles({});
      
      // Load files from the directory
      await loadFilesFromDirectory(dirHandle);
    } catch (err) {
      console.error('Error opening directory:', err);
      // User probably cancelled the dialog
    }
  };
  
  // Load files from directory
  const loadFilesFromDirectory = async (dirHandle) => {
    const files = [];
    
    try {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          files.push({
            name: entry.name,
            handle: entry
          });
        }
      }
      
      // Update the saved files list with files from the directory
      setSavedFiles(files.map(file => file.name));
      
      // Store file handles for quick access
      const handles = {};
      files.forEach(file => {
        handles[file.name] = file.handle;
      });
      setFileHandles(handles);
    } catch (err) {
      console.error('Error reading directory:', err);
    }
  };
  
  // Add delete file function
  const deleteFile = async (name) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
    
    try {
      if (fileHandles[name]) {
        // Delete from file system
        if (directoryHandle) {
          await directoryHandle.removeEntry(name);
          
          // Refresh directory
          await loadFilesFromDirectory(directoryHandle);
        }
      } else {
        // Delete from localStorage
        localStorage.removeItem(`codeeditor-${name}`);
        
        // Update file list
        const fileList = JSON.parse(localStorage.getItem('codeeditor-files') || '[]');
        const updatedList = fileList.filter(file => file !== name);
        localStorage.setItem('codeeditor-files', JSON.stringify(updatedList));
        setSavedFiles(updatedList);
      }
      
      // If the deleted file was the current file, create a new one
      if (name === fileName) {
        createNewFile();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      alert(`Failed to delete file: ${err.message}`);
    }
  };
  
  // Open file
  const openFile = async () => {
    if (!isFileSystemSupported) {
      alert('File System Access API is not supported in your browser.');
      return;
    }
    
    try {
      const [fileHandle] = await window.showOpenFilePicker();
      await loadContent(null, fileHandle);
    } catch (err) {
      console.error('Error opening file:', err);
      // User probably cancelled the dialog
    }
  };
  
  // Save as
  const saveAs = async () => {
    if (!isFileSystemSupported) {
      alert('File System Access API is not supported in your browser.');
      return;
    }
    
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      setFileName(fileHandle.name || fileName);
      setIsSaved(true);
      
      // Store the file handle for future saves
      setFileHandles(prev => ({
        ...prev,
        [fileHandle.name || fileName]: fileHandle
      }));
    } catch (err) {
      console.error('Error in save as:', err);
      // User probably cancelled the dialog
    }
  };
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
      }
      
      // Open: Ctrl+O or Cmd+O
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openFile();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, fileName, fileHandles]);
  
  // Get list of saved files
  const [savedFiles, setSavedFiles] = useState([]);
  
  useEffect(() => {
    if (!directoryHandle) {
      try {
        const fileList = JSON.parse(localStorage.getItem('codeeditor-files') || '[]');
        setSavedFiles(fileList);
      } catch (err) {
        console.error('Error loading file list:', err);
      }
    }
  }, [isSaved, directoryHandle]);
  
  return (
    <div className={`h-full w-full flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'} ${className}`}>
      <div className={`p-2 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'} border-b flex items-center`}>
        
        <input
          type="text"
          value={fileName}
          onChange={handleFileNameChange}
          className={`flex-grow px-2 py-1 mr-2 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
        />
        
        <button
          onClick={saveContent}
          className={`px-2 py-1 text-xs rounded mr-2 ${isSaved ? 
            (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500') : 
            'bg-blue-600 text-white hover:bg-blue-700'}`}
          disabled={isSaved}
        >
          {isSaved ? 'Saved' : 'Save'}
        </button>
        
        <button
          onClick={createNewFile}
          className={`px-2 py-1 text-xs rounded mr-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          New
        </button>
        
        {isFileSystemSupported && (
          <>
            <button
              onClick={openFile}
              className={`px-2 py-1 text-xs rounded mr-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Open
            </button>
            <button
              onClick={openDirectory}
              className={`px-2 py-1 text-xs rounded mr-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Open Dir
            </button>
            <button
              onClick={saveAs}
              className={`px-2 py-1 text-xs rounded mr-2 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Save As
            </button>
          </>
        )}
        
        <button
          onClick={toggleTheme}
          className={`px-2 py-1 text-xs rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      
      <div className="flex flex-1">
        <div className={`w-48 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border-r`}>
          <div className="p-2 font-bold text-sm flex justify-between items-center">
            <span>{currentDirectory || 'Files'}</span>
            {currentDirectory && (
              <button 
                onClick={() => loadFilesFromDirectory(directoryHandle)}
                className="text-xs px-1 rounded hover:bg-gray-700"
                title="Refresh"
              >
                🔄
              </button>
            )}
          </div>
          <ul>
            {savedFiles.map((file, index) => (
              <li 
                key={index}
                className={`px-3 py-1 text-sm flex justify-between items-center ${fileName === file ? 
                  (theme === 'dark' ? 'bg-blue-800' : 'bg-blue-100') : 
                  'hover:bg-opacity-20 hover:bg-blue-500'}`}
              >
                <span 
                  className="flex-grow cursor-pointer truncate mr-2"
                  onClick={() => loadContent(file, fileHandles[file])}
                >
                  {file}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file);
                  }}
                  className={`px-1 text-xs rounded opacity-60 hover:opacity-100 ${
                    theme === 'dark' ? 'hover:bg-red-900' : 'hover:bg-red-200'
                  }`}
                  title="Delete file"
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          onMouseUp={handleCursorChange}
          className={`flex-1 p-4 font-mono text-sm resize-none outline-none ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'}`}
          spellCheck="false"
        />
      </div>
      
      <div className={`p-1 ${theme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-600'} text-xs flex justify-between`}>
        <span>Ln {cursorPosition.line}, Col {cursorPosition.column} | {content.split('\n').length} lines</span>
        <span>
          {!isSaved && '•'} 
          {currentDirectory ? `${currentDirectory}/` : ''}{fileName}
          {!isFileSystemSupported && ' (Local Storage)'}
        </span>
      </div>
    </div>
  );
};

export default CodeEditorPanel;