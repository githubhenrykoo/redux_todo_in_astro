import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

const SearchANDPrompts = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('prompts'); // 'prompts' or 'questions'

    // Search bar component
    const SearchBar = () => (
        <div className="p-4 border-b border-slate-200">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts and questions..."
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
            />
        </div>
    );

    // Prompts section
    const PromptsSection = () => (
        <div className="h-full overflow-y-auto p-4">
            <h2 className="text-lg font-semibold mb-4">Prompts</h2>
            <div className="space-y-4">
                {/* Prompt items will go here */}
                <div className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="font-medium">Sample Prompt 1</h3>
                    <p className="text-sm text-slate-600">Description of the prompt...</p>
                </div>
                {/* Add more prompt items */}
            </div>
        </div>
    );

    // Question Sets section
    const QuestionSetsSection = () => (
        <div className="h-full overflow-y-auto p-4">
            <h2 className="text-lg font-semibold mb-4">Question Sets</h2>
            <div className="space-y-4">
                {/* Question set items will go here */}
                <div className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="font-medium">Question Set 1</h3>
                    <p className="text-sm text-slate-600">Contains 5 questions</p>
                </div>
                {/* Add more question set items */}
            </div>
        </div>
    );

    // Section toggle
    const SectionToggle = () => (
        <div className="flex border-b border-slate-200">
            <button
                className={`flex-1 px-4 py-2 text-center ${
                    activeSection === 'prompts'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-slate-600'
                }`}
                onClick={() => setActiveSection('prompts')}
            >
                Prompts
            </button>
            <button
                className={`flex-1 px-4 py-2 text-center ${
                    activeSection === 'questions'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-slate-600'
                }`}
                onClick={() => setActiveSection('questions')}
            >
                Question Sets
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <SearchBar />
            <SectionToggle />
            <div className="flex-1 overflow-hidden">
                {activeSection === 'prompts' ? <PromptsSection /> : <QuestionSetsSection />}
            </div>
        </div>
    );
};

export default SearchANDPrompts;