import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface ContentEditorProps {
  content: string;
  title?: string;
  isReadOnly?: boolean;
  onChange?: (content: string) => void;
  onSave?: () => void;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
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

  return (
    <div className={cn('content-editor flex flex-col min-h-0 h-full', className)}>
      {/* Header */}
      <div className="dark:bg-white bg-neutral-900 px-4 py-2 text-sm flex items-center justify-between flex-shrink-0 border-b dark:border-neutral-200 border-neutral-800">
        <span className="dark:text-neutral-900 text-white">{title}</span>
        <div className="flex items-center space-x-2">
          {isReadOnly && <span className="dark:text-neutral-500 text-neutral-400">Read Only</span>}
          {!isReadOnly && onSave && (
            <button
              onClick={onSave}
              className="px-2 py-1 text-xs rounded border-0 dark:bg-neutral-900 bg-white dark:text-white text-neutral-900 hover:bg-white/90 dark:hover:bg-neutral-900/90 transition-colors"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Editor Body - Scrollable Container */}
      <div className="flex-1 min-h-0 overflow-hidden relative dark:bg-white bg-neutral-900 dark:text-neutral-900 text-white">
        {/* Line Numbers - Fixed Position */}
        {showLineNumbers && (
          <div
            className="absolute left-0 top-0 bottom-0 dark:bg-neutral-100 bg-neutral-800 dark:text-neutral-500 text-neutral-400 select-none overflow-hidden border-r dark:border-neutral-200 border-neutral-800"
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
                  <div key={idx} className="dark:hover:bg-neutral-100 hover:bg-neutral-800 leading-6">
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
              className="w-full h-full resize-none outline-none font-mono text-sm p-4 dark:bg-white bg-neutral-900 dark:text-neutral-900 text-white"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="dark:bg-neutral-100 bg-neutral-800 px-4 py-1 text-xs flex items-center justify-between flex-shrink-0 dark:text-neutral-500 text-neutral-400 border-t dark:border-neutral-200 border-neutral-800">
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
