import React, { useState, useEffect } from 'react';
import ModernChatbot from './chatbotmodern.jsx';
import ClassicChatbot from './chatbotclassic.jsx';

const ChatbotWrapper = ({ className = '' }) => {
  // Get selected template from localStorage
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    return localStorage.getItem('chatbotTemplate');
  });

  // Save template preference
  useEffect(() => {
    if (selectedTemplate) {
      localStorage.setItem('chatbotTemplate', selectedTemplate);
    }
  }, [selectedTemplate]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="relative h-full w-full">
      {/* Always show template selection until one is chosen */}
      {!selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Choose Chatbot Template</h2>
            <div className="space-y-4">
              <button
                onClick={() => handleTemplateSelect('modern')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedTemplate === 'modern'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">1. Modern Template ($99)</h3>
                    <p className="text-sm text-gray-500">Clean, modern design with gradient accents</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTemplateSelect('classic')}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedTemplate === 'classic'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">2. Classic Template (Free)</h3>
                    <p className="text-sm text-gray-500">Traditional chat interface with dark theme</p>
                  </div>
                </div>
              </button>
            </div>

            {!localStorage.getItem('chatbotTemplate') && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                You can change the template later using the menu button
              </p>
            )}
          </div>
        </div>
      )}

      {/* Render Selected Template */}
      {selectedTemplate === 'modern' && <ModernChatbot className={className} />}
      {selectedTemplate === 'classic' && <ClassicChatbot className={className} />}
    </div>
  );
};

export default ChatbotWrapper;
