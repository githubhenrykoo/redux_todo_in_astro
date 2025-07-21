import React, { useRef } from 'react';

/**
 * RAGChat component - Displays chat messages and input field
 */
const RAGChat = ({
  messages,
  input,
  isLoading,
  onInputChange,
  onKeyDown,
  onSendMessage,
  messagesEndRef
}) => {
  return (
    <>
      <div className="flex-1 p-4 overflow-y-auto min-h-0">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${
            message.role === 'user' ? 'text-right' : 
            message.role === 'error' ? 'text-center' : 
            'text-left'
          }`}>
            <div className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
              message.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 
              message.role === 'system' ? 'bg-gray-700 text-gray-200' : 
              message.role === 'error' ? 'bg-red-600 text-white' : 
              'bg-gray-800 text-gray-200 rounded-bl-none'
            } ${message.isThinking ? 'relative' : ''}`}>
              {message.isThinking && (
                <div className="absolute -bottom-6 left-4 flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.2s'}}></div>
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-start">
          <div className="relative flex-grow">
            <textarea
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder="Ask a question about your documents..."
              className="w-full p-2 bg-gray-800 text-white rounded-lg resize-none h-12 max-h-32 min-h-[3rem] pr-10"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={onSendMessage}
            disabled={isLoading || !input.trim()}
            className={`ml-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              isLoading || !input.trim() 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <div className="flex space-x-1 items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0s'}}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-[bounce_0.9s_infinite]" style={{animationDelay: '0.2s'}}></div>
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform duration-200 ease-in-out hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default RAGChat;
