import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { useSelector } from 'react-redux';
import { selectThemeMode } from '../../features/themeSlice';

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
  const themeMode = useSelector(selectThemeMode);
  const isDark = themeMode === 'dark';

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
      <div className={cn(
        "px-4 py-2 text-sm flex items-center justify-between flex-shrink-0 border-b",
        isDark 
          ? "bg-neutral-900 text-white border-neutral-800" 
          : "bg-white text-neutral-900 border-neutral-200"
      )}>
        <span>{title}</span>
        <div className="flex items-center space-x-2">
          {isReadOnly && (
            <span className={isDark ? "text-neutral-400" : "text-neutral-500"}>
              Read Only
            </span>
          )}
          {!isReadOnly && onSave && (
            <button
              onClick={onSave}
              className={cn(
                "px-2 py-1 text-xs rounded border-0 transition-colors",
                isDark 
                  ? "bg-neutral-800 text-white hover:bg-neutral-700" 
                  : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
              )}
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Editor Body - Scrollable Container */}
      <div className={cn(
        "flex-1 min-h-0 overflow-hidden relative",
        isDark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
      )}>
        {/* Line Numbers - Fixed Position */}
        {showLineNumbers && (
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 select-none overflow-hidden border-r",
              isDark 
                ? "bg-neutral-800 text-neutral-400 border-neutral-700" 
                : "bg-neutral-100 text-neutral-500 border-neutral-200"
            )}
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
                  <div 
                    key={idx} 
                    className={cn(
                      "leading-6",
                      isDark 
                        ? "hover:bg-neutral-800" 
                        : "hover:bg-neutral-100"
                    )}
                  >
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
              className={cn(
                "w-full h-full resize-none outline-none font-mono text-sm p-4",
                isDark 
                  ? "bg-neutral-900 text-white" 
                  : "bg-white text-neutral-900"
              )}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className={cn(
        "px-4 py-1 text-xs flex items-center justify-between flex-shrink-0 border-t",
        isDark 
          ? "bg-neutral-800 text-neutral-400 border-neutral-700" 
          : "bg-neutral-100 text-neutral-500 border-neutral-200"
      )}>
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
