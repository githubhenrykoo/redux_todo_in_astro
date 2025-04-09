import React, { useState } from 'react';

const Playwright = () => {
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [screenshots, setScreenshots] = useState([]);

    const runAutomation = async (type) => {
        try {
            setStatus('running');
            setLogs([]);
            setScreenshots([]);

            const endpoint = type === 'mqtt' ? '/api/run-mqtt-automation' : '/api/run-lazygit-automation';
            const response = await fetch(endpoint, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Failed to run ${type} automation test`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                // Split by newlines and process each message
                const messages = text.split('\n').filter(msg => msg.trim());
                
                for (const msg of messages) {
                    try {
                        if (msg) {
                            const data = JSON.parse(msg);
                            if (data.type === 'log') {
                                setLogs(prev => [...prev, data.message]);
                            } else if (data.type === 'screenshot') {
                                setScreenshots(prev => [...prev, data.path]);
                            }
                        }
                    } catch (parseError) {
                        console.error('Parse error:', parseError);
                    }
                }
            }

            setStatus('completed');
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
            setLogs(prev => [...prev, `Error: ${error.message}`]);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Automation Test Runner</h2>
            
            <div className="flex gap-4 mb-4">
                <button
                    onClick={() => runAutomation('mqtt')}
                    disabled={status === 'running'}
                    className={`px-4 py-2 rounded ${
                        status === 'running'
                            ? 'bg-gray-400'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                >
                    {status === 'running' ? 'Running MQTT Test...' : 'Run MQTT Automation'}
                </button>

                <button
                    onClick={() => runAutomation('lazygit')}
                    disabled={status === 'running'}
                    className={`px-4 py-2 rounded ${
                        status === 'running'
                            ? 'bg-gray-400'
                            : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                >
                    {status === 'running' ? 'Running Lazygit Test...' : 'Run Lazygit Automation'}
                </button>
            </div>

            <div className="mt-4">
                <h3 className="font-bold mb-2">Status: {status}</h3>
                
                <div className="mt-4">
                    <h3 className="font-bold mb-2">Test Logs:</h3>
                    <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto font-mono text-sm">
                        {logs.map((log, index) => (
                            <div key={index} className="mb-1">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Playwright;