import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addLog, addScreenshot, setStatus, clearLogs } from '../../features/testLogsSlice';

const Playwright = () => {
    const dispatch = useDispatch();
    const testLogs = useSelector(state => state.testLogs) || { status: 'idle', logs: [], screenshots: [] };
    const { status, logs, screenshots } = testLogs;

    const runAutomation = async (type) => {
        try {
            dispatch(setStatus('running'));
            dispatch(clearLogs());

            const endpoint = type === 'mqtt' 
                ? '/api/run-mqtt-automation' 
                : type === 'file'
                ? '/api/run-file-automation'
                : '/api/run-lazygit-automation';
                
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
                const messages = text.split('\n').filter(msg => msg.trim());
                
                for (const msg of messages) {
                    try {
                        if (msg) {
                            const data = JSON.parse(msg);
                            if (data.type === 'log') {
                                dispatch(addLog(data.message));
                            } else if (data.type === 'screenshot') {
                                dispatch(addScreenshot(data.path));
                            }
                        }
                    } catch (parseError) {
                        console.error('Parse error:', parseError);
                        dispatch(addLog(`Parse error: ${parseError.message}`));
                    }
                }
            }

            dispatch(setStatus('completed'));
            dispatch(addLog(`${type} automation test completed successfully`));
        } catch (error) {
            console.error('Error:', error);
            dispatch(setStatus('error'));
            dispatch(addLog(`Error: ${error.message}`));
        }
    };

    // Add the runTest6 function after runTest5
    const runTest5 = async () => {
        try {
            const response = await fetch('/api/run-5', {
                method: 'POST'
            });
            const data = await response.json();
            console.log('Automation result:', data);
        } catch (error) {
            console.error('Error running automation:', error);
        }
    };

    const runTest6 = async () => {
        try {
            const response = await fetch('/api/run-6', {
                method: 'POST'
            });
            const data = await response.json();
            console.log('Automation result:', data);
        } catch (error) {
            console.error('Error running automation:', error);
        }
    };

    // Add after other test functions
        const runTest0 = async () => {
            try {
                dispatch(setStatus('running'));
                dispatch(clearLogs());
                
                const response = await fetch('/api/run-0', {
                    method: 'POST'
                });
    
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
    
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
    
                    const text = decoder.decode(value);
                    const messages = text.split('\n').filter(msg => msg.trim());
                    
                    for (const msg of messages) {
                        try {
                            if (msg) {
                                const data = JSON.parse(msg);
                                if (data.type === 'log') {
                                    dispatch(addLog(data.message));
                                } else if (data.type === 'screenshot') {
                                    dispatch(addScreenshot(data.path));
                                }
                            }
                        } catch (parseError) {
                            console.error('Parse error:', parseError);
                            dispatch(addLog(`Parse error: ${parseError.message}`));
                        }
                    }
                }
    
                dispatch(setStatus('completed'));
            } catch (error) {
                console.error('Error running automation:', error);
                dispatch(setStatus('error'));
                dispatch(addLog(`Error: ${error.message}`));
            }
        };
    
        // Add new button in the return statement after other buttons
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
                                : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                    >
                        {status === 'running' ? 'Running Lazygit Test...' : 'Run Lazygit Automation'}
                    </button>
    
                    <button
                        onClick={() => runAutomation('file')}
                        disabled={status === 'running'}
                        className={`px-4 py-2 rounded ${
                            status === 'running'
                                ? 'bg-gray-400'
                                : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                    >
                        {status === 'running' ? 'Running File Test...' : 'Run File Automation'}
                    </button>
    
                    <button
                        onClick={runTest5}
                        disabled={status === 'running'}
                        className={`px-4 py-2 rounded ${
                            status === 'running'
                                ? 'bg-gray-400'
                                : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                    >
                        {status === 'running' ? 'Running Test 5...' : 'Run Test 5'}
                    </button>
    
                    <button
                        onClick={runTest6}
                        disabled={status === 'running'}
                        className={`px-4 py-2 rounded ${
                            status === 'running'
                                ? 'bg-gray-400'
                                : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                    >
                        {status === 'running' ? 'Running Test 6...' : 'Run Test 6'}
                    </button>
                    <button
                        onClick={runTest0}
                        disabled={status === 'running'}
                        className={`px-4 py-2 rounded ${
                            status === 'running'
                                ? 'bg-gray-400'
                                : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                    >
                        {status === 'running' ? 'Running Test 0...' : 'Run Combined Test'}
                    </button>
            </div>

            <div className="mt-4">
                <h3 className="font-bold mb-2">Status: {status}</h3>
                
                <div className="mt-4">
                    <h3 className="font-bold mb-2">Test Logs:</h3>
                    <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto font-mono text-sm">
                        {logs && logs.map((log, index) => (
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