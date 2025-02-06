import React, { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useSelector, useDispatch } from 'react-redux';

const GeneratePanel = () => {
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationLog, setGenerationLog] = useState([]);

    // Prompt Selection Panel
    const PromptSelectionPanel = () => (
        <div className="h-full flex flex-col p-4 bg-white">
            <h2 className="text-lg font-semibold mb-4">Select Prompt</h2>
            
            {/* Prompt Selection */}
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                    {/* Sample prompts - replace with actual data */}
                    {['Prompt 1', 'Prompt 2', 'Prompt 3'].map((prompt, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedPrompt === prompt
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                            onClick={() => setSelectedPrompt(prompt)}
                        >
                            <h3 className="font-medium">{prompt}</h3>
                            <p className="text-sm text-slate-600">Description of the prompt...</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <div className="mt-4 flex gap-2">
                <button
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        selectedPrompt && !isGenerating
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                    disabled={!selectedPrompt || isGenerating}
                    onClick={() => {
                        setIsGenerating(true);
                        setGenerationLog(prev => [...prev, 'Starting generation...']);
                        // Add your generation logic here
                    }}
                >
                    {isGenerating ? 'Generating...' : 'Generate Questions'}
                </button>
            </div>
        </div>
    );

    // Generation Details Panel
    const GenerationDetailsPanel = () => (
        <div className="h-full flex flex-col p-4 bg-white">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Generation Progress</h2>
                {isGenerating && (
                    <button
                        className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm transition-colors"
                        onClick={() => {
                            setIsGenerating(false);
                            setGenerationLog(prev => [...prev, 'Generation cancelled']);
                            // Add your cancellation logic here
                        }}
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* Generation Log */}
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-3">
                <div className="space-y-2">
                    {generationLog.map((log, index) => (
                        <div
                            key={index}
                            className="text-sm font-mono p-2 bg-white rounded border border-slate-200"
                        >
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-slate-100">
            <PanelGroup direction="vertical">
                {/* Top Panel - Prompt Selection */}
                <Panel defaultSize={40} minSize={30}>
                    <PromptSelectionPanel />
                </Panel>

                {/* Resize Handle */}
                <PanelResizeHandle className="h-1 bg-slate-200 hover:bg-slate-400 transition-colors" />

                {/* Bottom Panel - Generation Details */}
                <Panel minSize={30}>
                    <GenerationDetailsPanel />
                </Panel>
            </PanelGroup>
        </div>
    );
};

export default GeneratePanel;