import React, { useState } from 'react';

const Playwright = () => {
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [screenshots, setScreenshots] = useState([]);

    const runMqttAutomation = async () => {
        try {
            setStatus('running');
            setLogs([]);
            setScreenshots([]);

            const response = await fetch('/api/run-mqtt-automation', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to run MQTT automation test');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const data = JSON.parse(text);

                if (data.type === 'log') {
                    setLogs(prev => [...prev, data.message]);
                } else if (data.type === 'screenshot') {
                    setScreenshots(prev => [...prev, data.path]);
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
            <h2 className="text-xl font-bold mb-4">MQTT Automation Test Runner</h2>
            
            <button
                onClick={runMqttAutomation}
                disabled={status === 'running'}
                className={`px-4 py-2 rounded ${
                    status === 'running'
                        ? 'bg-gray-400'
                        : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
            >
                {status === 'running' ? 'Running MQTT Test...' : 'Run MQTT Automation'}
            </button>

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

                {screenshots.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-bold mb-2">Test Screenshots:</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {screenshots.map((screenshot, index) => (
                                <div key={index} className="border rounded p-2">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Step {index + 1}
                                    </p>
                                    <img
                                        src={`/data/${screenshot}`}
                                        alt={`MQTT test step ${index + 1}`}
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Playwright;