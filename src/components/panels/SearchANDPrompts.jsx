import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

const SearchANDPrompts = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('prompts'); // 'prompts' or 'generated'

    // Search bar component
    const SearchBar = () => (
        <div className="p-4 border-b border-slate-200">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts and outputs..."
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
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">Math Question Generator</h3>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Template</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Generates math questions with varying difficulty levels</p>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Used 24 times</span>
                        <div className="space-x-2">
                            <button className="text-blue-500 hover:text-blue-600">Use</button>
                            <button className="text-slate-500 hover:text-slate-600">Edit</button>
                        </div>
                    </div>
                </div>
                <div className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">Science Quiz Creator</h3>
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Template</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Creates science quizzes for different topics</p>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Used 15 times</span>
                        <div className="space-x-2">
                            <button className="text-blue-500 hover:text-blue-600">Use</button>
                            <button className="text-slate-500 hover:text-slate-600">Edit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Generated Outputs section
    const GeneratedOutputsSection = () => (
        <div className="h-full overflow-y-auto p-4">
            <h2 className="text-lg font-semibold mb-4">Generated Outputs</h2>
            <div className="space-y-4">
                {/* Output items will go here */}
                <div className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">Math Quiz Set #1</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">New</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Generated from: "Math Question Generator"</p>
                    <div className="text-xs text-slate-500 mb-2">10 questions generated</div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>2 minutes ago</span>
                        <div className="space-x-2">
                            <button className="text-green-500 hover:text-green-600">Export</button>
                            <button className="text-red-500 hover:text-red-600">Delete</button>
                        </div>
                    </div>
                </div>
                <div className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">Physics Quiz Set</h3>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Exported</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">Generated from: "Science Quiz Creator"</p>
                    <div className="text-xs text-slate-500 mb-2">15 questions generated</div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>1 hour ago</span>
                        <div className="space-x-2">
                            <button className="text-blue-500 hover:text-blue-600">View</button>
                            <button className="text-red-500 hover:text-red-600">Delete</button>
                        </div>
                    </div>
                </div>
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
                    activeSection === 'generated'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-slate-600'
                }`}
                onClick={() => setActiveSection('generated')}
            >
                Generated Outputs
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <SearchBar />
            <SectionToggle />
            <div className="flex-1 overflow-hidden">
                {activeSection === 'prompts' ? <PromptsSection /> : <GeneratedOutputsSection />}
            </div>
        </div>
    );
};

export default SearchANDPrompts;