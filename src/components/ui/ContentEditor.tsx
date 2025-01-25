import React, { useState, useEffect } from 'react';

interface ContentEditorProps {
  content: string;
  title?: string;
  isReadOnly?: boolean;
  onChange?: (content: string) => void;
  onSave?: () => void;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
  theme?: 'dark' | 'light';
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  content = '',
  title = 'Content Editor',
  isReadOnly = false,
  onChange,
  onSave,
  language = 'Plain Text',
  className = '',
  showLineNumbers = true,
  theme = 'dark',
}) => {
  const [localContent, setLocalContent] = useState(content);
  const contentLines = localContent.split('\n');
  const lineNumberWidth = contentLines.length.toString().length;

  // Update local content when prop changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange?.(newContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave?.();
    }
  };

  // Theme-based styles
  const themeStyles = {
    dark: {
      header: 'bg-gray-800 text-white',
      body: 'bg-gray-900 text-gray-100',
      lineNumbers: 'bg-gray-800 text-gray-500',
      statusBar: 'bg-gray-800 text-gray-400',
      hoverBg: 'hover:bg-gray-800',
    },
    light: {
      header: 'bg-gray-200 text-gray-800',
      body: 'bg-white text-gray-900',
      lineNumbers: 'bg-gray-100 text-gray-500',
      statusBar: 'bg-gray-200 text-gray-600',
      hoverBg: 'hover:bg-gray-100',
    },
  }[theme];

  return (
    <div className={`content-editor flex flex-col min-h-0 h-full ${className}`}>
      {/* Header */}
      <div className={`${themeStyles.header} px-4 py-2 text-sm flex items-center justify-between flex-shrink-0`}>
        <span>{title}</span>
        <div className="flex items-center space-x-2">
          {isReadOnly && <span className="text-gray-400">Read Only</span>}
          {!isReadOnly && onSave && (
            <button
              onClick={onSave}
              className="px-2 py-1 text-xs rounded border border-gray-600 hover:bg-gray-700"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Editor Body - Scrollable Container */}
      <div className={`flex-1 min-h-0 overflow-hidden relative ${themeStyles.body}`}>
        {/* Line Numbers - Fixed Position */}
        {showLineNumbers && (
          <div
            className={`absolute left-0 top-0 bottom-0 ${themeStyles.lineNumbers} select-none overflow-hidden`}
            style={{ width: `${lineNumberWidth + 3}ch`, minWidth: '3ch' }}
          >
            <div className="h-full overflow-auto invisible-scrollbar">
              {contentLines.map((_, idx) => (
                <div key={idx} className="px-2 text-right leading-6">
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div 
          className="h-full overflow-auto"
          style={{ 
            marginLeft: showLineNumbers ? `${lineNumberWidth + 3}ch` : '0',
            minWidth: '0'
          }}
        >
          {isReadOnly ? (
            <pre className="font-mono text-sm p-4 whitespace-pre overflow-x-auto">
              <code>
                {contentLines.map((line, idx) => (
                  <div key={idx} className={`${themeStyles.hoverBg} leading-6`}>
                    {line || '\n'}
                  </div>
                ))}
              </code>
            </pre>
          ) : (
            <textarea
              value={localContent}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className={`w-full h-full resize-none outline-none font-mono text-sm p-4 ${themeStyles.body}`}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className={`${themeStyles.statusBar} px-4 py-1 text-xs flex items-center justify-between flex-shrink-0`}>
        <div>
          {contentLines.length} {contentLines.length === 1 ? 'line' : 'lines'}
        </div>
        <div className="flex space-x-4">
          <span>{language}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;
